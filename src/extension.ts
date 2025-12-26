import * as vscode from 'vscode';
import { StorageManager } from './storage';
import { SavedFunction } from './models';
import { saveFunctionCommand } from './commands/saveFunction';
import { showFunctionsCommand } from './commands/showFunctions';
import { insertFunctionCommand } from './commands/insertFunction';
import { configureCommandCommand } from './commands/configureCommand';
import { editFunctionCommand } from './commands/editFunction';
import { exportFunctionsCommand } from './commands/exportFunctions';
import { importFunctionsCommand } from './commands/importFunctions';
import { FunctionsTreeProvider, FunctionTreeItem, CategoryTreeItem } from './views/functionsTreeProvider';
import { DEFAULT_CATEGORIES } from './models';
import { FunctionDetailsView } from './views/functionDetailsView';

let storageManager: StorageManager;
let commandDisposables: vscode.Disposable[] = [];
let treeDataProvider: FunctionsTreeProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('DevUtils Manager is now active!');

  // Inicializar storage
  storageManager = new StorageManager(context);

  // Inicializar TreeView
  treeDataProvider = new FunctionsTreeProvider(storageManager);
  const treeView = vscode.window.createTreeView('devutils-manager.functionsView', {
    treeDataProvider: treeDataProvider,
    showCollapseAll: false
  });
  context.subscriptions.push(treeView);

  // Callback para refrescar el árbol
  const refreshTree = () => {
    treeDataProvider.refresh();
    registerDynamicCommands(context);
  };

  // Registrar comandos dinámicos para funciones guardadas
  registerDynamicCommands(context);

  // Registrar comandos principales
  const commands = [
    vscode.commands.registerCommand('devutils-manager.saveFunction', () =>
      saveFunctionCommand(storageManager, refreshTree)
    ),
    vscode.commands.registerCommand('devutils-manager.showFunctions', () =>
      showFunctionsCommand(context, storageManager, refreshTree)
    ),
    vscode.commands.registerCommand('devutils-manager.insertFunction', () =>
      insertFunctionCommand(storageManager)
    ),
    vscode.commands.registerCommand('devutils-manager.configureCommand', () =>
      configureCommandCommand(storageManager, refreshTree)
    ),

    // Comandos del TreeView
    vscode.commands.registerCommand('devutils-manager.refreshTree', () => {
      treeDataProvider.refresh();
    }),

    vscode.commands.registerCommand('devutils-manager.viewFunctionDetails', (func: SavedFunction) => {
      const detailsView = new FunctionDetailsView(context, storageManager, refreshTree);
      detailsView.show(func);
    }),

    vscode.commands.registerCommand('devutils-manager.insertFromTree', async (item: FunctionTreeItem) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      const position = editor.selection.active;
      await editor.edit(editBuilder => {
        editBuilder.insert(position, item.func.code);
      });

      storageManager.incrementUsage(item.func.id);
      treeDataProvider.refresh();
      vscode.window.showInformationMessage(`Inserted: ${item.func.name}`);
    }),

    vscode.commands.registerCommand('devutils-manager.deleteFromTree', async (item: FunctionTreeItem) => {
      const confirm = await vscode.window.showWarningMessage(
        `Delete "${item.func.name}"?`,
        { modal: true },
        'Delete'
      );

      if (confirm === 'Delete') {
        storageManager.deleteFunction(item.func.id);
        refreshTree();
        vscode.window.showInformationMessage(`Deleted: ${item.func.name}`);
      }
    }),

    vscode.commands.registerCommand('devutils-manager.editFunction', async (item: FunctionTreeItem) => {
      await editFunctionCommand(item.func, storageManager, refreshTree);
    }),

    // Category commands
    vscode.commands.registerCommand('devutils-manager.addCategory', async () => {
      const categories = storageManager.getCategories();

      const newCategory = await vscode.window.showInputBox({
        prompt: 'Enter new category name',
        placeHolder: 'e.g., Helpers, Validation, Formatting',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Category name is required';
          }
          if (categories.includes(value.trim())) {
            return 'Category already exists';
          }
          return null;
        }
      });

      if (newCategory) {
        storageManager.addCategory(newCategory.trim());
        refreshTree();
        vscode.window.showInformationMessage(`Category "${newCategory}" created`);
      }
    }),

    vscode.commands.registerCommand('devutils-manager.renameCategory', async (item: CategoryTreeItem) => {
      if (!item.isCustom) {
        vscode.window.showWarningMessage('Cannot rename default categories');
        return;
      }

      const categories = storageManager.getCategories();
      const newName = await vscode.window.showInputBox({
        prompt: 'Enter new category name',
        value: item.categoryName,
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Category name is required';
          }
          if (value.trim() !== item.categoryName && categories.includes(value.trim())) {
            return 'Category already exists';
          }
          return null;
        }
      });

      if (newName && newName.trim() !== item.categoryName) {
        storageManager.renameCategory(item.categoryName, newName.trim());
        refreshTree();
        vscode.window.showInformationMessage(`Category renamed to "${newName}"`);
      }
    }),

    vscode.commands.registerCommand('devutils-manager.deleteCategory', async (item: CategoryTreeItem) => {
      if (!item.isCustom) {
        vscode.window.showWarningMessage('Cannot delete default categories');
        return;
      }

      const confirm = await vscode.window.showWarningMessage(
        `Delete category "${item.categoryName}"? Functions will be moved to "General".`,
        { modal: true },
        'Delete'
      );

      if (confirm === 'Delete') {
        storageManager.deleteCategory(item.categoryName);
        refreshTree();
        vscode.window.showInformationMessage(`Category "${item.categoryName}" deleted`);
      }
    }),

    // Export/Import commands
    vscode.commands.registerCommand('devutils-manager.exportFunctions', () =>
      exportFunctionsCommand(storageManager)
    ),

    vscode.commands.registerCommand('devutils-manager.importFunctions', () =>
      importFunctionsCommand(storageManager, refreshTree)
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
