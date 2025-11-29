import * as vscode from 'vscode';
import { FunctionService } from '../services/FunctionService';
import { MESSAGES } from '../utils/constants';

/**
 * Handler for the Insert Function command
 */
export function createInsertFunctionCommand(functionService: FunctionService) {
  return async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage(MESSAGES.NO_ACTIVE_EDITOR);
      return;
    }

    const functions = functionService.getAllFunctions();

    if (functions.length === 0) {
      vscode.window.showInformationMessage(MESSAGES.NO_FUNCTIONS_SAVED);
      return;
    }

    // Create QuickPick items with preview
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
      // Insert code at cursor position
      const position = editor.selection.active;
      await editor.edit(editBuilder => {
        editBuilder.insert(position, selected.func.code);
      });

      // Increment usage count
      functionService.incrementUsage(selected.func.id);

      vscode.window.showInformationMessage(
        MESSAGES.FUNCTION_INSERTED(selected.func.name)
      );
    }
  };
}
