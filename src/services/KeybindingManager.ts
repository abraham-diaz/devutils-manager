import * as vscode from 'vscode';
import { SavedFunction } from '../models';
import { COMMANDS } from '../utils/constants';

/**
 * Service for managing keyboard shortcuts
 */
export class KeybindingManager {
  /**
   * Generate keybinding configuration JSON
   */
  generateKeybindingConfig(func: SavedFunction): string {
    if (!func.customCommand || !func.keybinding) {
      return '';
    }

    const commandId = `${COMMANDS.CUSTOM_PREFIX}${func.customCommand}`;
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

  /**
   * Show keybinding setup instructions to the user
   */
  async showKeybindingInstructions(func: SavedFunction): Promise<void> {
    if (!func.keybinding) {
      return;
    }

    const config = this.generateKeybindingConfig(func);
    const commandId = `${COMMANDS.CUSTOM_PREFIX}${func.customCommand}`;

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
}
