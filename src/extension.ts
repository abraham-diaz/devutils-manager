import * as vscode from 'vscode';
import { StorageManager } from './storage';
import { SavedFunction } from './models';
import { saveFunctionCommand } from './commands/saveFunction';
import { showFunctionsCommand } from './commands/showFunctions';
import { insertFunctionCommand } from './commands/insertFunction';
import { configureCommandCommand } from './commands/configureCommand';

let storageManager: StorageManager;
let commandDisposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {
  console.log('DevUtils Manager is now active!');

  // Inicializar storage
  storageManager = new StorageManager(context);

  // Registrar comandos dinámicos para funciones guardadas
  registerDynamicCommands(context);

  // Registrar comandos principales
  const commands = [
    vscode.commands.registerCommand('devutils-manager.saveFunction', () =>
      saveFunctionCommand(storageManager, () => registerDynamicCommands(context))
    ),
    vscode.commands.registerCommand('devutils-manager.showFunctions', () =>
      showFunctionsCommand(context, storageManager, () => registerDynamicCommands(context))
    ),
    vscode.commands.registerCommand('devutils-manager.insertFunction', () =>
      insertFunctionCommand(storageManager)
    ),
    vscode.commands.registerCommand('devutils-manager.configureCommand', () =>
      configureCommandCommand(storageManager, () => registerDynamicCommands(context))
    )
  ];

  context.subscriptions.push(...commands);
}

export function deactivate() {}

// Registrar comandos dinámicos para todas las funciones guardadas
function registerDynamicCommands(context: vscode.ExtensionContext): void {
  // Limpiar comandos anteriores
  commandDisposables.forEach(disposable => disposable.dispose());
  commandDisposables = [];

  const functions = storageManager.getAllFunctions();

  functions.forEach(func => {
    if (func.customCommand) {
      const disposable = registerFunctionCommand(func);
      if (disposable) {
        commandDisposables.push(disposable);
        context.subscriptions.push(disposable);
      }
    }
  });

  console.log(`Registered ${commandDisposables.length} custom function commands`);
}

// Registrar un comando individual para una función
function registerFunctionCommand(func: SavedFunction): vscode.Disposable | null {
  if (!func.customCommand) {
    return null;
  }

  const commandId = `devutils-manager.custom.${func.customCommand}`;

  return vscode.commands.registerCommand(commandId, async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    // Insertar el código en la posición actual del cursor
    const position = editor.selection.active;
    await editor.edit(editBuilder => {
      editBuilder.insert(position, func.code);
    });

    // Incrementar contador de uso
    storageManager.incrementUsage(func.id);

    vscode.window.showInformationMessage(`Inserted function: ${func.name}`);
  });
}
