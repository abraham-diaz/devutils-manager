import * as vscode from 'vscode';
import { StorageManager } from './storage';
import { SavedFunction } from './models';

let storageManager: StorageManager;

export function activate(context: vscode.ExtensionContext) {
  console.log('DevUtils Manager is now active!');

  // Inicializar storage
  storageManager = new StorageManager(context);

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
        usageCount: 0
      };

      // Guardar
      try {
        storageManager.addFunction(newFunction);
        vscode.window.showInformationMessage(
          `✅ Function "${name}" saved successfully!`
        );
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

  context.subscriptions.push(saveFunctionCmd, showFunctionsCmd, insertFunctionCmd);
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