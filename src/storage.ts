import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SavedFunction } from './models';

export class StorageManager {
  private storagePath: string;
  private functions: SavedFunction[] = [];

  constructor(context: vscode.ExtensionContext) {
    // Guardar en el globalStoragePath de VSCode
    this.storagePath = path.join(
      context.globalStorageUri.fsPath,
      'functions.json'
    );
    this.loadFunctions();
  }

  private loadFunctions(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        this.functions = JSON.parse(data);
      } else {
        // Crear el directorio si no existe
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
}