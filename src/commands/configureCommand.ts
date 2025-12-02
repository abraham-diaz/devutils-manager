import * as vscode from 'vscode';
import { StorageManager } from '../storage';
import { SavedFunction } from '../models';

export async function configureCommandCommand(
  storageManager: StorageManager,
  onCommandConfigured?: () => void
): Promise<void> {
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
      const existingFunc = storageManager
        .getAllFunctions()
        .find(f => f.customCommand === value.trim() && f.id !== func.id);
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
  const wantKeybinding = await vscode.window.showQuickPick(['Yes', 'No'], {
    placeHolder: 'Do you want to add/update a keyboard shortcut?',
    title: 'Keyboard Shortcut'
  });

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

  // Mostrar instrucciones de keybinding
  if (keybinding) {
    const updatedFunc = storageManager.getFunctionById(func.id);
    if (updatedFunc) {
      await showKeybindingInstructions(updatedFunc);
    }
  } else {
    vscode.window.showInformationMessage(`✅ Custom command configured for "${func.name}"!`);
  }

  // Notificar que se configuró un comando
  if (onCommandConfigured) {
    onCommandConfigured();
  }
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
