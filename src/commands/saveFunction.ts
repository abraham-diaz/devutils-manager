import * as vscode from 'vscode';
import { FunctionService } from '../services/FunctionService';
import { CommandRegistry } from '../services/CommandRegistry';
import { KeybindingManager } from '../services/KeybindingManager';
import { InputValidators } from '../ui/InputValidators';
import { MESSAGES, PROMPTS } from '../utils/constants';
import { KeyBinding } from '../models';

/**
 * Handler for the Save Function command
 */
export function createSaveFunctionCommand(
  functionService: FunctionService,
  commandRegistry: CommandRegistry,
  keybindingManager: KeybindingManager
) {
  const validators = new InputValidators(functionService);

  return async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage(MESSAGES.NO_ACTIVE_EDITOR);
      return;
    }

    const selection = editor.selection;
    const selectedCode = editor.document.getText(selection);

    if (!selectedCode) {
      vscode.window.showErrorMessage(MESSAGES.NO_CODE_SELECTED);
      return;
    }

    // Get function name
    const name = await vscode.window.showInputBox({
      ...PROMPTS.FUNCTION_NAME,
      validateInput: value => validators.validateFunctionName(value)
    });

    if (!name) {
      return; // User cancelled
    }

    // Get description (optional)
    const description = await vscode.window.showInputBox(PROMPTS.DESCRIPTION);

    // Ask about custom command
    const wantCustomCommand = await vscode.window.showQuickPick(['Yes', 'No'], {
      placeHolder: 'Do you want to create a custom command for this function?',
      title: 'Custom Command'
    });

    let customCommand: string | undefined;
    let keybinding: KeyBinding | undefined;

    if (wantCustomCommand === 'Yes') {
      // Get command name
      customCommand = await vscode.window.showInputBox({
        ...PROMPTS.CUSTOM_COMMAND,
        validateInput: value => validators.validateCommandName(value)
      });

      if (customCommand) {
        // Ask about keybinding
        const wantKeybinding = await vscode.window.showQuickPick(['Yes', 'No'], {
          placeHolder: 'Do you want to add a keyboard shortcut?',
          title: 'Keyboard Shortcut'
        });

        if (wantKeybinding === 'Yes') {
          const keyInput = await vscode.window.showInputBox({
            ...PROMPTS.KEYBOARD_SHORTCUT,
            validateInput: value => validators.validateKeyboardShortcut(value)
          });

          if (keyInput) {
            const macKey = await vscode.window.showInputBox(PROMPTS.MAC_SHORTCUT);
            const whenCondition = await vscode.window.showInputBox(PROMPTS.WHEN_CONDITION);

            keybinding = {
              key: keyInput.trim(),
              mac: macKey?.trim() || undefined,
              when: whenCondition?.trim() || undefined
            };
          }
        }
      }
    }

    // Create and save function
    try {
      const newFunction = functionService.createFunction({
        name: name.trim(),
        code: selectedCode,
        language: editor.document.languageId,
        description: description?.trim(),
        customCommand: customCommand?.trim(),
        keybinding
      });

      // Register dynamic command if configured
      if (newFunction.customCommand) {
        commandRegistry.registerAllFunctionCommands();

        // Show keybinding instructions if configured
        if (newFunction.keybinding) {
          await keybindingManager.showKeybindingInstructions(newFunction);
        } else {
          vscode.window.showInformationMessage(
            MESSAGES.FUNCTION_SAVED_WITH_COMMAND(name, customCommand!)
          );
        }
      } else {
        vscode.window.showInformationMessage(MESSAGES.FUNCTION_SAVED(name));
      }
    } catch (error) {
      vscode.window.showErrorMessage(MESSAGES.ERROR_SAVING(error));
    }
  };
}
