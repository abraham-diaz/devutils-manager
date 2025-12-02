import * as vscode from 'vscode';
import { StorageManager } from '../storage';

export async function insertFunctionCommand(storageManager: StorageManager): Promise<void> {
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
    await editor.edit(editBuilder => {
      editBuilder.insert(position, selected.func.code);
    });

    // Incrementar contador de uso
    storageManager.incrementUsage(selected.func.id);

    vscode.window.showInformationMessage(`Inserted function: ${selected.func.name}`);
  }
}
