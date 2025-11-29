import * as vscode from 'vscode';
import { StorageManager } from './storage';
import { SavedFunction } from './models';

let storageManager: StorageManager;
let commandDisposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {
  console.log('DevUtils Manager is now active!');

  // Inicializar storage
  storageManager = new StorageManager(context);

  // Registrar comandos dinámicos para funciones guardadas
  registerDynamicCommands(context);

  // Comando: Guardar función
  let saveFunctionCmd = vscode.commands.registerCommand(
    'devutils-manager.saveFunction',
    async () => {
      const editor = vscode.window.activeTextEditor;
      
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      const selection = editor.selection;
      const selectedCode = editor.document.getText(selection);

      if (!selectedCode) {
        vscode.window.showErrorMessage('No code selected');
        return;
      }

      // Pedir nombre
      const name = await vscode.window.showInputBox({
        prompt: 'Enter a name for this function',
        placeHolder: 'e.g., formatDate, fetchWithRetry',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Name is required';
          }
          return null;
        }
      });

      if (!name) {
        return; // Usuario canceló
      }

      // Pedir descripción (opcional)
      const description = await vscode.window.showInputBox({
        prompt: 'Enter a description (optional)',
        placeHolder: 'What does this function do?'
      });

      // Preguntar si quiere configurar comando personalizado
      const wantCustomCommand = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        {
          placeHolder: 'Do you want to create a custom command for this function?',
          title: 'Custom Command'
        }
      );

      let customCommand: string | undefined;
      let keybinding: { key: string; mac?: string; when?: string } | undefined;

      if (wantCustomCommand === 'Yes') {
        // Pedir nombre del comando
        customCommand = await vscode.window.showInputBox({
          prompt: 'Enter a command name (will be prefixed with "devutils-manager.custom.")',
          placeHolder: 'e.g., myFormatDate, quickSort',
          validateInput: (value) => {
            if (!value || value.trim().length === 0) {
              return 'Command name is required';
            }
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
              return 'Command name can only contain letters, numbers, hyphens, and underscores';
            }
            // Verificar si el comando ya existe
            const existingFunc = storageManager.getAllFunctions().find(
              f => f.customCommand === value.trim()
            );
            if (existingFunc) {
              return `Command "${value}" already exists for function "${existingFunc.name}"`;
            }
            return null;
          }
        });

        if (customCommand) {
          // Preguntar si quiere configurar keybinding
          const wantKeybinding = await vscode.window.showQuickPick(
            ['Yes', 'No'],
            {
              placeHolder: 'Do you want to add a keyboard shortcut?',
              title: 'Keyboard Shortcut'
            }
          );

          if (wantKeybinding === 'Yes') {
            const keyInput = await vscode.window.showInputBox({
              prompt: 'Enter keyboard shortcut (e.g., ctrl+shift+k)',
              placeHolder: 'ctrl+shift+k',
              validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                  return 'Keyboard shortcut is required';
                }
                return null;
              }
            });

            if (keyInput) {
              const macKey = await vscode.window.showInputBox({
                prompt: 'Enter Mac keyboard shortcut (optional, leave empty to use same as above)',
                placeHolder: 'cmd+shift+k'
              });

              const whenCondition = await vscode.window.showInputBox({
                prompt: 'Enter "when" condition (optional, e.g., editorTextFocus)',
                placeHolder: 'editorTextFocus'
              });

              keybinding = {
                key: keyInput.trim(),
                mac: macKey?.trim() || undefined,
                when: whenCondition?.trim() || undefined
              };
            }
          }
        }
      }

      // Detectar lenguaje
      const language = editor.document.languageId;

      // Crear objeto función
      const newFunction: SavedFunction = {
        id: generateId(),
        name: name.trim(),
        code: selectedCode,
        language: language,
        description: description?.trim(),
        tags: [],
        createdAt: new Date().toISOString(),
        usageCount: 0,
        customCommand: customCommand?.trim(),
        keybinding: keybinding
      };

      // Guardar
      try {
        storageManager.addFunction(newFunction);

        // Registrar comando dinámico si fue configurado
        if (newFunction.customCommand) {
          const disposable = registerFunctionCommand(newFunction);
          if (disposable) {
            commandDisposables.push(disposable);
          }

          // Mostrar instrucciones de keybinding si fue configurado
          if (newFunction.keybinding) {
            await showKeybindingInstructions(newFunction);
          } else {
            vscode.window.showInformationMessage(
              `✅ Function "${name}" saved with command "devutils-manager.custom.${customCommand}"!`
            );
          }
        } else {
          vscode.window.showInformationMessage(
            `✅ Function "${name}" saved successfully!`
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error saving function: ${error}`
        );
      }
    }
  );

  // Comando: Mostrar funciones guardadas con QuickPick
  let showFunctionsCmd = vscode.commands.registerCommand(
    'devutils-manager.showFunctions',
    async () => {
      const functions = storageManager.getAllFunctions();
      if (functions.length === 0) {
        vscode.window.showInformationMessage('No functions saved yet. Select code and use "DevUtils: Save Function" to start!');
        return;
      }

      // Crear items para QuickPick
      const items = functions.map(func => ({
        label: func.name,
        description: func.language,
        detail: func.description || 'No description',
        func: func
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a function to view details',
        matchOnDescription: true,
        matchOnDetail: true
      });

      if (selected) {
        // Mostrar detalles de la función
        const panel = vscode.window.createWebviewPanel(
          'functionDetails',
          `Function: ${selected.func.name}`,
          vscode.ViewColumn.Two,
          {}
        );

        panel.webview.html = getFunctionDetailsHtml(selected.func);
      }
    }
  );

  // Comando: Insertar función en el código actual
  let insertFunctionCmd = vscode.commands.registerCommand(
    'devutils-manager.insertFunction',
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      const functions = storageManager.getAllFunctions();
      if (functions.length === 0) {
        vscode.window.showInformationMessage('No functions saved yet');
        return;
      }

      // Crear items para QuickPick con preview
      const items = functions.map(func => ({
        label: `$(symbol-function) ${func.name}`,
        description: func.language,
        detail: func.description || 'No description',
        func: func
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Search and select a function to insert',
        matchOnDescription: true,
        matchOnDetail: true
      });

      if (selected) {
        // Insertar el código en la posición actual del cursor
        const position = editor.selection.active;
        editor.edit(editBuilder => {
          editBuilder.insert(position, selected.func.code);
        });

        // Incrementar contador de uso
        storageManager.incrementUsage(selected.func.id);

        vscode.window.showInformationMessage(
          `Inserted function: ${selected.func.name}`
        );
      }
    }
  );

  // Comando: Configurar comando personalizado y keybinding para función existente
  let configureCommandCmd = vscode.commands.registerCommand(
    'devutils-manager.configureCommand',
    async () => {
      const functions = storageManager.getAllFunctions();
      if (functions.length === 0) {
        vscode.window.showInformationMessage('No functions saved yet');
        return;
      }

      // Seleccionar función
      const items = functions.map(func => ({
        label: func.name,
        description: func.customCommand
          ? `Command: devutils-manager.custom.${func.customCommand}`
          : 'No custom command',
        detail: func.description || 'No description',
        func: func
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a function to configure custom command',
        matchOnDescription: true,
        matchOnDetail: true
      });

      if (!selected) {
        return;
      }

      const func = selected.func;

      // Pedir nombre del comando
      const customCommand = await vscode.window.showInputBox({
        prompt: 'Enter a command name (will be prefixed with "devutils-manager.custom.")',
        placeHolder: 'e.g., myFormatDate, quickSort',
        value: func.customCommand || '',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Command name is required';
          }
          if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            return 'Command name can only contain letters, numbers, hyphens, and underscores';
          }
          // Verificar si el comando ya existe (excepto en la función actual)
          const existingFunc = storageManager.getAllFunctions().find(
            f => f.customCommand === value.trim() && f.id !== func.id
          );
          if (existingFunc) {
            return `Command "${value}" already exists for function "${existingFunc.name}"`;
          }
          return null;
        }
      });

      if (!customCommand) {
        return;
      }

      // Preguntar si quiere configurar keybinding
      const wantKeybinding = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        {
          placeHolder: 'Do you want to add/update a keyboard shortcut?',
          title: 'Keyboard Shortcut'
        }
      );

      let keybinding: { key: string; mac?: string; when?: string } | undefined = func.keybinding;

      if (wantKeybinding === 'Yes') {
        const keyInput = await vscode.window.showInputBox({
          prompt: 'Enter keyboard shortcut (e.g., ctrl+shift+k)',
          placeHolder: 'ctrl+shift+k',
          value: func.keybinding?.key || '',
          validateInput: (value) => {
            if (!value || value.trim().length === 0) {
              return 'Keyboard shortcut is required';
            }
            return null;
          }
        });

        if (keyInput) {
          const macKey = await vscode.window.showInputBox({
            prompt: 'Enter Mac keyboard shortcut (optional, leave empty to use same as above)',
            placeHolder: 'cmd+shift+k',
            value: func.keybinding?.mac || ''
          });

          const whenCondition = await vscode.window.showInputBox({
            prompt: 'Enter "when" condition (optional, e.g., editorTextFocus)',
            placeHolder: 'editorTextFocus',
            value: func.keybinding?.when || ''
          });

          keybinding = {
            key: keyInput.trim(),
            mac: macKey?.trim() || undefined,
            when: whenCondition?.trim() || undefined
          };
        }
      }

      // Actualizar función
      storageManager.updateFunction(func.id, {
        customCommand: customCommand.trim(),
        keybinding: keybinding
      });

      // Re-registrar comandos dinámicos
      registerDynamicCommands(context);

      // Mostrar instrucciones de keybinding
      if (keybinding) {
        const updatedFunc = storageManager.getFunctionById(func.id);
        if (updatedFunc) {
          await showKeybindingInstructions(updatedFunc);
        }
      } else {
        vscode.window.showInformationMessage(
          `✅ Custom command configured for "${func.name}"!`
        );
      }
    }
  );

  context.subscriptions.push(saveFunctionCmd, showFunctionsCmd, insertFunctionCmd, configureCommandCmd);
}

export function deactivate() {}

// Helper functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getFunctionDetailsHtml(func: SavedFunction): string {
  const createdDate = new Date(func.createdAt).toLocaleString();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Function Details</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          padding: 20px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
        }
        .header {
          border-bottom: 1px solid var(--vscode-panel-border);
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        h1 {
          margin: 0 0 10px 0;
          color: var(--vscode-foreground);
        }
        .meta {
          color: var(--vscode-descriptionForeground);
          font-size: 0.9em;
        }
        .section {
          margin: 20px 0;
        }
        .section-title {
          font-weight: bold;
          color: var(--vscode-foreground);
          margin-bottom: 8px;
        }
        .description {
          color: var(--vscode-descriptionForeground);
          font-style: italic;
          margin-bottom: 15px;
        }
        pre {
          background-color: var(--vscode-textCodeBlock-background);
          border: 1px solid var(--vscode-panel-border);
          border-radius: 4px;
          padding: 15px;
          overflow-x: auto;
        }
        code {
          font-family: var(--vscode-editor-font-family);
          font-size: var(--vscode-editor-font-size);
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 3px;
          background-color: var(--vscode-badge-background);
          color: var(--vscode-badge-foreground);
          font-size: 0.85em;
          margin-right: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${func.name}</h1>
        <div class="meta">
          <span class="badge">${func.language}</span>
          <span>Created: ${createdDate}</span>
          <span> | Used: ${func.usageCount} times</span>
        </div>
      </div>

      ${func.description ? `
        <div class="section">
          <div class="section-title">Description</div>
          <div class="description">${func.description}</div>
        </div>
      ` : ''}

      ${func.customCommand ? `
        <div class="section">
          <div class="section-title">Custom Command</div>
          <div><code>devutils-manager.custom.${func.customCommand}</code></div>
        </div>
      ` : ''}

      ${func.keybinding ? `
        <div class="section">
          <div class="section-title">Keyboard Shortcut</div>
          <div>
            <div><strong>Key:</strong> <code>${func.keybinding.key}</code></div>
            ${func.keybinding.mac ? `<div><strong>Mac:</strong> <code>${func.keybinding.mac}</code></div>` : ''}
            ${func.keybinding.when ? `<div><strong>When:</strong> <code>${func.keybinding.when}</code></div>` : ''}
          </div>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Code</div>
        <pre><code>${escapeHtml(func.code)}</code></pre>
      </div>

      ${func.tags.length > 0 ? `
        <div class="section">
          <div class="section-title">Tags</div>
          <div>${func.tags.map(tag => `<span class="badge">${tag}</span>`).join('')}</div>
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Registrar comandos dinámicos para todas las funciones guardadas
function registerDynamicCommands(context: vscode.ExtensionContext): void {
  // Limpiar comandos anteriores
  commandDisposables.forEach(disposable => disposable.dispose());
  commandDisposables = [];

  const functions = storageManager.getAllFunctions();

  functions.forEach(func => {
    if (func.customCommand) {
      const disposable = registerFunctionCommand(func);
      if (disposable) {
        commandDisposables.push(disposable);
        context.subscriptions.push(disposable);
      }
    }
  });

  console.log(`Registered ${commandDisposables.length} custom function commands`);
}

// Registrar un comando individual para una función
function registerFunctionCommand(func: SavedFunction): vscode.Disposable | null {
  if (!func.customCommand) {
    return null;
  }

  const commandId = `devutils-manager.custom.${func.customCommand}`;

  return vscode.commands.registerCommand(commandId, async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    // Insertar el código en la posición actual del cursor
    const position = editor.selection.active;
    await editor.edit(editBuilder => {
      editBuilder.insert(position, func.code);
    });

    // Incrementar contador de uso
    storageManager.incrementUsage(func.id);

    vscode.window.showInformationMessage(
      `Inserted function: ${func.name}`
    );
  });
}

// Generar configuración de keybinding sugerida
function generateKeybindingConfig(func: SavedFunction): string {
  if (!func.customCommand || !func.keybinding) {
    return '';
  }

  const commandId = `devutils-manager.custom.${func.customCommand}`;
  const config: any = {
    key: func.keybinding.key,
    command: commandId
  };

  if (func.keybinding.mac) {
    config.mac = func.keybinding.mac;
  }

  if (func.keybinding.when) {
    config.when = func.keybinding.when;
  }

  return JSON.stringify(config, null, 2);
}

// Mostrar instrucciones para configurar keybinding
async function showKeybindingInstructions(func: SavedFunction): Promise<void> {
  if (!func.keybinding) {
    return;
  }

  const config = generateKeybindingConfig(func);
  const commandId = `devutils-manager.custom.${func.customCommand}`;

  const message = `Custom command "${commandId}" created! To add the keyboard shortcut, would you like to open the Keyboard Shortcuts settings?`;

  const action = await vscode.window.showInformationMessage(
    message,
    'Open Keyboard Shortcuts',
    'Copy Config',
    'Later'
  );

  if (action === 'Open Keyboard Shortcuts') {
    vscode.commands.executeCommand('workbench.action.openGlobalKeybindings', commandId);
  } else if (action === 'Copy Config') {
    vscode.env.clipboard.writeText(config);
    vscode.window.showInformationMessage('Keybinding config copied to clipboard! Paste it in keybindings.json');
  }
}