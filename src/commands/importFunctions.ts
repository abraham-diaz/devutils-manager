import * as vscode from 'vscode';
import * as fs from 'fs';
import { StorageManager } from '../storage';
import { SavedFunction } from '../models';
import { generateId } from '../utils/helpers';
import { ExportData } from './exportFunctions';

type DuplicateStrategy = 'skip' | 'replace' | 'keepBoth';

export async function importFunctionsCommand(
  storageManager: StorageManager,
  onImported?: () => void
): Promise<void> {
  // Show open dialog
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: {
      'DevUtils Export': ['json'],
      'All Files': ['*']
    },
    title: 'Import Functions'
  });

  if (!uris || uris.length === 0) {
    return; // Cancelled
  }

  const filePath = uris[0].fsPath;

  try {
    // Read and parse file
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content) as ExportData;

    // Validate format
    if (!data.functions || !Array.isArray(data.functions)) {
      vscode.window.showErrorMessage('Invalid file format: missing functions array');
      return;
    }

    if (data.functions.length === 0) {
      vscode.window.showWarningMessage('No functions found in the file');
      return;
    }

    // Check for duplicates
    const existingFunctions = storageManager.getAllFunctions();
    const existingNames = new Set(existingFunctions.map(f => f.name.toLowerCase()));
    const duplicates = data.functions.filter(f => existingNames.has(f.name.toLowerCase()));

    let strategy: DuplicateStrategy = 'skip';

    if (duplicates.length > 0) {
      const choice = await vscode.window.showQuickPick([
        {
          label: '$(arrow-right) Skip Duplicates',
          description: `Keep existing, skip ${duplicates.length} duplicate(s)`,
          value: 'skip' as DuplicateStrategy
        },
        {
          label: '$(sync) Replace Duplicates',
          description: 'Overwrite existing functions with imported ones',
          value: 'replace' as DuplicateStrategy
        },
        {
          label: '$(copy) Keep Both',
          description: 'Rename imported functions to avoid conflicts',
          value: 'keepBoth' as DuplicateStrategy
        }
      ], {
        placeHolder: `Found ${duplicates.length} duplicate function(s). How do you want to handle them?`,
        title: 'Handle Duplicates'
      });

      if (!choice) {
        return; // Cancelled
      }

      strategy = choice.value;
    }

    // Import functions
    const result = importFunctions(storageManager, data, strategy);

    // Import custom categories
    if (data.customCategories && Array.isArray(data.customCategories)) {
      for (const category of data.customCategories) {
        storageManager.addCategory(category); // Will skip if exists
      }
    }

    // Show result
    const messages: string[] = [];
    if (result.imported > 0) {
      messages.push(`${result.imported} imported`);
    }
    if (result.replaced > 0) {
      messages.push(`${result.replaced} replaced`);
    }
    if (result.skipped > 0) {
      messages.push(`${result.skipped} skipped`);
    }

    vscode.window.showInformationMessage(
      `Import complete: ${messages.join(', ')}`
    );

    if (onImported) {
      onImported();
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      vscode.window.showErrorMessage('Invalid JSON file');
    } else {
      vscode.window.showErrorMessage(`Error importing functions: ${error}`);
    }
  }
}

interface ImportResult {
  imported: number;
  replaced: number;
  skipped: number;
}

function importFunctions(
  storageManager: StorageManager,
  data: ExportData,
  strategy: DuplicateStrategy
): ImportResult {
  const existingFunctions = storageManager.getAllFunctions();
  const existingByName = new Map(existingFunctions.map(f => [f.name.toLowerCase(), f]));

  const result: ImportResult = {
    imported: 0,
    replaced: 0,
    skipped: 0
  };

  for (const func of data.functions) {
    const existingFunc = existingByName.get(func.name.toLowerCase());

    if (existingFunc) {
      // Handle duplicate
      switch (strategy) {
        case 'skip':
          result.skipped++;
          break;

        case 'replace':
          // Update existing function with imported data
          storageManager.updateFunction(existingFunc.id, {
            code: func.code,
            language: func.language,
            description: func.description,
            tags: func.tags,
            category: func.category || 'General',
            customCommand: func.customCommand,
            keybinding: func.keybinding
          });
          result.replaced++;
          break;

        case 'keepBoth':
          // Create with new name
          const newName = generateUniqueName(func.name, existingByName);
          const newFunc: SavedFunction = {
            ...func,
            id: generateId(),
            name: newName,
            createdAt: new Date().toISOString(),
            usageCount: 0,
            category: func.category || 'General'
          };
          storageManager.addFunction(newFunc);
          existingByName.set(newName.toLowerCase(), newFunc);
          result.imported++;
          break;
      }
    } else {
      // No duplicate, import directly
      const newFunc: SavedFunction = {
        ...func,
        id: generateId(),
        createdAt: new Date().toISOString(),
        usageCount: 0,
        category: func.category || 'General'
      };
      storageManager.addFunction(newFunc);
      existingByName.set(func.name.toLowerCase(), newFunc);
      result.imported++;
    }
  }

  return result;
}

function generateUniqueName(baseName: string, existingNames: Map<string, SavedFunction>): string {
  let counter = 1;
  let newName = `${baseName} (imported)`;

  while (existingNames.has(newName.toLowerCase())) {
    counter++;
    newName = `${baseName} (imported ${counter})`;
  }

  return newName;
}
