import * as vscode from 'vscode';
import * as fs from 'fs';
import { StorageManager } from '../storage';
import { SavedFunction } from '../models';

export interface ExportData {
  version: string;
  exportDate: string;
  functions: SavedFunction[];
  customCategories: string[];
}

export async function exportFunctionsCommand(
  storageManager: StorageManager
): Promise<void> {
  const functions = storageManager.getAllFunctions();
  const customCategories = storageManager.getCustomCategories();

  if (functions.length === 0) {
    vscode.window.showWarningMessage('No functions to export');
    return;
  }

  // Create export data
  const exportData: ExportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    functions: functions,
    customCategories: customCategories
  };

  // Show save dialog
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file('devutils-functions.json'),
    filters: {
      'DevUtils Export': ['json'],
      'All Files': ['*']
    },
    title: 'Export Functions'
  });

  if (!uri) {
    return; // Cancelled
  }

  try {
    const jsonContent = JSON.stringify(exportData, null, 2);
    fs.writeFileSync(uri.fsPath, jsonContent, 'utf8');

    vscode.window.showInformationMessage(
      `Exported ${functions.length} function${functions.length !== 1 ? 's' : ''} successfully`
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Error exporting functions: ${error}`);
  }
}
