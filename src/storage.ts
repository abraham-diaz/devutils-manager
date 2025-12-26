import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SavedFunction, DEFAULT_CATEGORIES } from './models';

export class StorageManager {
  private storagePath: string;
  private categoriesPath: string;
  private functions: SavedFunction[] = [];
  private customCategories: string[] = [];

  constructor(context: vscode.ExtensionContext) {
    const storageDir = context.globalStorageUri.fsPath;
    this.storagePath = path.join(storageDir, 'functions.json');
    this.categoriesPath = path.join(storageDir, 'categories.json');
    this.loadFunctions();
    this.loadCategories();
  }

  private loadFunctions(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        this.functions = JSON.parse(data);
        // Migrate old functions without category
        this.functions = this.functions.map(f => ({
          ...f,
          category: f.category || 'General'
        }));
      } else {
        const dir = path.dirname(this.storagePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        this.functions = [];
      }
    } catch (error) {
      console.error('Error loading functions:', error);
      this.functions = [];
    }
  }

  private loadCategories(): void {
    try {
      if (fs.existsSync(this.categoriesPath)) {
        const data = fs.readFileSync(this.categoriesPath, 'utf8');
        this.customCategories = JSON.parse(data);
      } else {
        this.customCategories = [];
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      this.customCategories = [];
    }
  }

  private saveCategories(): void {
    try {
      fs.writeFileSync(
        this.categoriesPath,
        JSON.stringify(this.customCategories, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Error saving categories:', error);
      throw error;
    }
  }

  private saveFunctions(): void {
    try {
      fs.writeFileSync(
        this.storagePath,
        JSON.stringify(this.functions, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Error saving functions:', error);
      throw error;
    }
  }

  public addFunction(func: SavedFunction): void {
    this.functions.push(func);
    this.saveFunctions();
  }

  public getAllFunctions(): SavedFunction[] {
    return this.functions;
  }

  public getFunctionById(id: string): SavedFunction | undefined {
    return this.functions.find(f => f.id === id);
  }

  public deleteFunction(id: string): void {
    this.functions = this.functions.filter(f => f.id !== id);
    this.saveFunctions();
  }

  public incrementUsage(id: string): void {
    const func = this.functions.find(f => f.id === id);
    if (func) {
      func.usageCount++;
      this.saveFunctions();
    }
  }

  public updateFunction(id: string, updates: Partial<SavedFunction>): void {
    const func = this.functions.find(f => f.id === id);
    if (func) {
      Object.assign(func, updates);
      this.saveFunctions();
    }
  }

  // Category management
  public getCategories(): string[] {
    return [...DEFAULT_CATEGORIES, ...this.customCategories];
  }

  public getCustomCategories(): string[] {
    return this.customCategories;
  }

  public addCategory(name: string): boolean {
    const allCategories = this.getCategories();
    if (allCategories.includes(name)) {
      return false; // Already exists
    }
    this.customCategories.push(name);
    this.saveCategories();
    return true;
  }

  public deleteCategory(name: string): void {
    // Don't allow deleting default categories
    if (DEFAULT_CATEGORIES.includes(name)) {
      return;
    }

    // Move functions to General
    this.functions.forEach(f => {
      if (f.category === name) {
        f.category = 'General';
      }
    });
    this.saveFunctions();

    // Remove custom category
    this.customCategories = this.customCategories.filter(c => c !== name);
    this.saveCategories();
  }

  public renameCategory(oldName: string, newName: string): boolean {
    // Don't allow renaming default categories
    if (DEFAULT_CATEGORIES.includes(oldName)) {
      return false;
    }

    const allCategories = this.getCategories();
    if (allCategories.includes(newName)) {
      return false; // New name already exists
    }

    // Update functions
    this.functions.forEach(f => {
      if (f.category === oldName) {
        f.category = newName;
      }
    });
    this.saveFunctions();

    // Update custom categories
    const index = this.customCategories.indexOf(oldName);
    if (index !== -1) {
      this.customCategories[index] = newName;
      this.saveCategories();
    }

    return true;
  }

  public getFunctionsByCategory(category: string): SavedFunction[] {
    return this.functions.filter(f => f.category === category);
  }

  public getCategoriesWithCount(): { name: string; count: number; isCustom: boolean }[] {
    const allCategories = this.getCategories();
    return allCategories.map(name => ({
      name,
      count: this.functions.filter(f => f.category === name).length,
      isCustom: !DEFAULT_CATEGORIES.includes(name)
    }));
  }
}