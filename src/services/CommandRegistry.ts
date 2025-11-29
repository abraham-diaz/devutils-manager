import * as vscode from 'vscode';
import { SavedFunction } from '../models';
import { FunctionService } from './FunctionService';
import { COMMANDS } from '../utils/constants';

/**
 * Service for managing dynamic command registration
 */
export class CommandRegistry {
  private disposables: vscode.Disposable[] = [];

  constructor(
    private context: vscode.ExtensionContext,
    private functionService: FunctionService
  ) {}

  /**
   * Register all custom commands for saved functions
   */
  registerAllFunctionCommands(): void {
    // Clear previous registrations
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];

    const functions = this.functionService.getFunctionsWithCustomCommands();

    functions.forEach(func => {
      const disposable = this.registerFunctionCommand(func);
      if (disposable) {
        this.disposables.push(disposable);
        this.context.subscriptions.push(disposable);
      }
    });

    console.log(`Registered ${this.disposables.length} custom function commands`);
  }

  /**
   * Register a command for a specific function
   */
  registerFunctionCommand(func: SavedFunction): vscode.Disposable | null {
    if (!func.customCommand) {
      return null;
    }

    const commandId = `${COMMANDS.CUSTOM_PREFIX}${func.customCommand}`;

    return vscode.commands.registerCommand(commandId, async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      // Insert the code at cursor position
      const position = editor.selection.active;
      await editor.edit(editBuilder => {
        editBuilder.insert(position, func.code);
      });

      // Increment usage count
      this.functionService.incrementUsage(func.id);

      vscode.window.showInformationMessage(`Inserted function: ${func.name}`);
    });
  }

  /**
   * Dispose all registered commands
   */
  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
