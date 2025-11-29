import * as vscode from 'vscode';
import { StorageManager } from './storage';
import { FunctionService } from './services/FunctionService';
import { CommandRegistry } from './services/CommandRegistry';
import { KeybindingManager } from './services/KeybindingManager';
import {
  createSaveFunctionCommand,
  createShowFunctionsCommand,
  createInsertFunctionCommand,
  createConfigureCommandCommand
} from './commands';
import { COMMANDS } from './utils/constants';

let commandRegistry: CommandRegistry;

export function activate(context: vscode.ExtensionContext) {
  console.log('DevUtils Manager is now active!');

  // Initialize services
  const storageManager = new StorageManager(context);
  const functionService = new FunctionService(storageManager);
  commandRegistry = new CommandRegistry(context, functionService);
  const keybindingManager = new KeybindingManager();

  // Register dynamic commands for saved functions
  commandRegistry.registerAllFunctionCommands();

  // Register extension commands
  const saveFunctionCmd = vscode.commands.registerCommand(
    COMMANDS.SAVE_FUNCTION,
    createSaveFunctionCommand(functionService, commandRegistry, keybindingManager)
  );

  const showFunctionsCmd = vscode.commands.registerCommand(
    COMMANDS.SHOW_FUNCTIONS,
    createShowFunctionsCommand(functionService)
  );

  const insertFunctionCmd = vscode.commands.registerCommand(
    COMMANDS.INSERT_FUNCTION,
    createInsertFunctionCommand(functionService)
  );

  const configureCommandCmd = vscode.commands.registerCommand(
    COMMANDS.CONFIGURE_COMMAND,
    createConfigureCommandCommand(functionService, commandRegistry, keybindingManager)
  );

  // Add to subscriptions
  context.subscriptions.push(
    saveFunctionCmd,
    showFunctionsCmd,
    insertFunctionCmd,
    configureCommandCmd
  );
}

export function deactivate() {
  // Cleanup
  commandRegistry.dispose();
}
