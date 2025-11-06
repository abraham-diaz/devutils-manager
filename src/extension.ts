import * as vscode from 'vscode';
import { StorageManager } from './storage';
import { SavedFunction } from './models';

let storageManager: StorageManager;

export function activate(context: vscode.ExtensionContext) {
  console.log('DevUtils Manager is now active!');

  // Inicializar storage
  storageManager = new StorageManager(context);

  // Comando: Guardar función
  let saveFunctionCmd = vscode.commands.registerCommand(
    'devutils-manager.saveFunction',
    async () => {
      const editor = vscode.window.activeTextEditor;
      
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      const selection = editor.selection;
      const selectedCode = editor.document.getText(selection);

      if (!selectedCode) {
        vscode.window.showErrorMessage('No code selected');
        return;
      }

      // Pedir nombre
      const name = await vscode.window.showInputBox({
        prompt: 'Enter a name for this function',
        placeHolder: 'e.g., formatDate, fetchWithRetry',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Name is required';
          }
          return null;
        }
      });

      if (!name) {
        return; // Usuario canceló
      }

      // Pedir descripción (opcional)
      const description = await vscode.window.showInputBox({
        prompt: 'Enter a description (optional)',
        placeHolder: 'What does this function do?'
      });

      // Detectar lenguaje
      const language = editor.document.languageId;

      // Crear objeto función
      const newFunction: SavedFunction = {
        id: generateId(),
        name: name.trim(),
        code: selectedCode,
        language: language,
        description: description?.trim(),
        tags: [],
        createdAt: new Date().toISOString(),
        usageCount: 0
      };

      // Guardar
      try {
        storageManager.addFunction(newFunction);
        vscode.window.showInformationMessage(
          `✅ Function "${name}" saved successfully!`
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error saving function: ${error}`
        );
      }
    }
  );

  // Comando: Mostrar funciones (temporal, solo para testing)
  let showFunctionsCmd = vscode.commands.registerCommand(
    'devutils-manager.showFunctions',
    () => {
      const functions = storageManager.getAllFunctions();
      if (functions.length === 0) {
        vscode.window.showInformationMessage('No functions saved yet');
        return;
      }

      const message = functions
        .map(f => `- ${f.name} (${f.language})`)
        .join('\n');
      
      vscode.window.showInformationMessage(
        `Saved Functions:\n${message}`
      );
    }
  );

  context.subscriptions.push(saveFunctionCmd, showFunctionsCmd);
}

export function deactivate() {}

// Helper function
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}