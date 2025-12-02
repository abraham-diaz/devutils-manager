import * as vscode from 'vscode';
import { StorageManager } from '../storage';
import { FunctionDetailsView } from '../views/functionDetailsView';

export async function showFunctionsCommand(
  context: vscode.ExtensionContext,
  storageManager: StorageManager,
  onFunctionDeleted?: () => void
): Promise<void> {
  const functions = storageManager.getAllFunctions();

  if (functions.length === 0) {
    vscode.window.showInformationMessage(
      'No functions saved yet. Select code and use "DevUtils: Save Function" to start!'
    );
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
    // Mostrar detalles de la función usando la vista
    const detailsView = new FunctionDetailsView(context, storageManager, onFunctionDeleted);
    detailsView.show(selected.func);
  }
}
