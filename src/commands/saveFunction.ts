import * as vscode from 'vscode';
import { StorageManager } from '../storage';
import { SavedFunction } from '../models';
import { generateId } from '../utils/helpers';

export async function saveFunctionCommand(
  storageManager: StorageManager,
  onFunctionSaved?: () => void
): Promise<void> {
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
    return;
  }

  // Pedir descripción (opcional)
  const description = await vscode.window.showInputBox({
    prompt: 'Enter a description (optional)',
    placeHolder: 'What does this function do?'
  });

  // Preguntar si quiere configurar comando personalizado
  const wantCustomCommand = await vscode.window.showQuickPick(['Yes', 'No'], {
    placeHolder: 'Do you want to create a custom command for this function?',
    title: 'Custom Command'
  });

  let customCommand: string | undefined;
  let keybinding: { key: string; mac?: string; when?: string } | undefined;

  if (wantCustomCommand === 'Yes') {
    const result = await configureCustomCommand(storageManager);
    if (result) {
      customCommand = result.customCommand;
      keybinding = result.keybinding;
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

    // Mostrar mensaje de éxito
    if (newFunction.customCommand && newFunction.keybinding) {
      await showKeybindingInstructions(newFunction);
    } else if (newFunction.customCommand) {
      vscode.window.showInformationMessage(
        `✅ Function "${name}" saved with command "devutils-manager.custom.${customCommand}"!`
      );
    } else {
      vscode.window.showInformationMessage(`✅ Function "${name}" saved successfully!`);
    }

    // Notificar que se guardó una función
    if (onFunctionSaved) {
      onFunctionSaved();
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error saving function: ${error}`);
  }
}

async function configureCustomCommand(
  storageManager: StorageManager
): Promise<{ customCommand: string; keybinding?: { key: string; mac?: string; when?: string } } | undefined> {
  // Pedir nombre del comando
  const customCommand = await vscode.window.showInputBox({
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
      const existingFunc = storageManager
        .getAllFunctions()
        .find(f => f.customCommand === value.trim());
      if (existingFunc) {
        return `Command "${value}" already exists for function "${existingFunc.name}"`;
      }
      return null;
    }
  });

  if (!customCommand) {
    return undefined;
  }

  // Preguntar si quiere configurar keybinding
  const wantKeybinding = await vscode.window.showQuickPick(['Yes', 'No'], {
    placeHolder: 'Do you want to add a keyboard shortcut?',
    title: 'Keyboard Shortcut'
  });

  let keybinding: { key: string; mac?: string; when?: string } | undefined;

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

  return { customCommand: customCommand.trim(), keybinding };
}

async function showKeybindingInstructions(func: SavedFunction): Promise<void> {
  if (!func.keybinding || !func.customCommand) {
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
    vscode.window.showInformationMessage(
      'Keybinding config copied to clipboard! Paste it in keybindings.json'
    );
  }
}

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
