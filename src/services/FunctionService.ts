import { SavedFunction, KeyBinding } from '../models';
import { StorageManager } from '../storage';
import { generateId } from '../utils/helpers';

/**
 * Service for managing saved functions
 * Provides business logic layer between commands and storage
 */
export class FunctionService {
  constructor(private storageManager: StorageManager) {}

  /**
   * Get all saved functions
   */
  getAllFunctions(): SavedFunction[] {
    return this.storageManager.getAllFunctions();
  }

  /**
   * Get a function by ID
   */
  getFunctionById(id: string): SavedFunction | undefined {
    return this.storageManager.getFunctionById(id);
  }

  /**
   * Check if a custom command name already exists
   */
  isCommandNameTaken(commandName: string, excludeId?: string): boolean {
    return this.storageManager
      .getAllFunctions()
      .some(f => f.customCommand === commandName && f.id !== excludeId);
  }

  /**
   * Create and save a new function
   */
  createFunction(params: {
    name: string;
    code: string;
    language: string;
    description?: string;
    customCommand?: string;
    keybinding?: KeyBinding;
  }): SavedFunction {
    const newFunction: SavedFunction = {
      id: generateId(),
      name: params.name,
      code: params.code,
      language: params.language,
      description: params.description,
      tags: [],
      createdAt: new Date().toISOString(),
      usageCount: 0,
      customCommand: params.customCommand,
      keybinding: params.keybinding
    };

    this.storageManager.addFunction(newFunction);
    return newFunction;
  }

  /**
   * Update an existing function
   */
  updateFunction(id: string, updates: Partial<SavedFunction>): SavedFunction | null {
    this.storageManager.updateFunction(id, updates);
    return this.getFunctionById(id) || null;
  }

  /**
   * Delete a function
   */
  deleteFunction(id: string): void {
    this.storageManager.deleteFunction(id);
  }

  /**
   * Increment usage count for a function
   */
  incrementUsage(id: string): void {
    this.storageManager.incrementUsage(id);
  }

  /**
   * Get functions that have custom commands
   */
  getFunctionsWithCustomCommands(): SavedFunction[] {
    return this.getAllFunctions().filter(f => f.customCommand);
  }
}
