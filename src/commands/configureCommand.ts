import * as vscode from 'vscode';
import { FunctionService } from '../services/FunctionService';
import { CommandRegistry } from '../services/CommandRegistry';
import { KeybindingManager } from '../services/KeybindingManager';
import { InputValidators } from '../ui/InputValidators';
import { MESSAGES, PROMPTS } from '../utils/constants';
import { KeyBinding } from '../models';

/**
 * Handler for the Configure Command command
 */
export function createConfigureCommandCommand(
  functionService: FunctionService,
  commandRegistry: CommandRegistry,
  keybindingManager: KeybindingManager
) {
  const validators = new InputValidators(functionService);

  return async () => {
    const functions = functionService.getAllFunctions();

    if (functions.length === 0) {
      vscode.window.showInformationMessage(MESSAGES.NO_FUNCTIONS_SAVED);
      return;
    }

    // Select function
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

    // Get command name
    const customCommand = await vscode.window.showInputBox({
      ...PROMPTS.CUSTOM_COMMAND,
      value: func.customCommand || '',
      validateInput: value => validators.validateCommandName(value, func.id)
    });

    if (!customCommand) {
      return;
    }

    // Ask about keybinding
    const wantKeybinding = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: 'Do you want to add/update a keyboard shortcut?',
      title: 'Keyboard Shortcut'
    });

    let keybinding: KeyBinding | undefined = func.keybinding;

    if (wantKeybinding === 'Yes') {
      const keyInput = await vscode.window.showInputBox({
        ...PROMPTS.KEYBOARD_SHORTCUT,
        value: func.keybinding?.key || '',
        validateInput: value => validators.validateKeyboardShortcut(value)
      });

      if (keyInput) {
        const macKey = await vscode.window.showInputBox({
          ...PROMPTS.MAC_SHORTCUT,
          value: func.keybinding?.mac || ''
        });

        const whenCondition = await vscode.window.showInputBox({
          ...PROMPTS.WHEN_CONDITION,
          value: func.keybinding?.when || ''
        });

        keybinding = {
          key: keyInput.trim(),
          mac: macKey?.trim() || undefined,
          when: whenCondition?.trim() || undefined
        };
      }
    }

    // Update function
    functionService.updateFunction(func.id, {
      customCommand: customCommand.trim(),
      keybinding
    });

    // Re-register dynamic commands
    commandRegistry.registerAllFunctionCommands();

    // Show keybinding instructions
    if (keybinding) {
      const updatedFunc = functionService.getFunctionById(func.id);
      if (updatedFunc) {
        await keybindingManager.showKeybindingInstructions(updatedFunc);
      }
    } else {
      vscode.window.showInformationMessage(
        MESSAGES.COMMAND_CONFIGURED(func.name)
      );
    }
  };
}
