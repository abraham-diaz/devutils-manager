import * as vscode from 'vscode';
import { FunctionService } from '../services/FunctionService';
import { FunctionDetailsView } from '../ui/FunctionDetailsView';
import { MESSAGES } from '../utils/constants';

/**
 * Handler for the Show Functions command
 */
export function createShowFunctionsCommand(functionService: FunctionService) {
  return async () => {
    const functions = functionService.getAllFunctions();

    if (functions.length === 0) {
      vscode.window.showInformationMessage(
        MESSAGES.NO_FUNCTIONS_SAVED + '. Select code and use "DevUtils: Save Function" to start!'
      );
      return;
    }

    // Create QuickPick items
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
      // Show function details in webview panel
      const panel = vscode.window.createWebviewPanel(
        'functionDetails',
        `Function: ${selected.func.name}`,
        vscode.ViewColumn.Two,
        {}
      );

      panel.webview.html = FunctionDetailsView.generateHtml(selected.func);
    }
  };
}
