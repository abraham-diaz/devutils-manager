import * as vscode from 'vscode';
import { StorageManager } from '../storage';
import { SavedFunction } from '../models';

interface EditOption {
  label: string;
  description: string;
  field: 'name' | 'description' | 'code' | 'category' | 'all';
}

export async function editFunctionCommand(
  func: SavedFunction,
  storageManager: StorageManager,
  onUpdated?: () => void
): Promise<void> {
  const options: EditOption[] = [
    { label: '$(edit) Edit Name', description: `Current: ${func.name}`, field: 'name' },
    { label: '$(note) Edit Description', description: func.description || 'No description', field: 'description' },
    { label: '$(folder) Change Category', description: `Current: ${func.category}`, field: 'category' },
    { label: '$(code) Edit Code', description: 'Open code in editor', field: 'code' },
    { label: '$(checklist) Edit All', description: 'Edit name, description, category and code', field: 'all' }
  ];

  const selected = await vscode.window.showQuickPick(options, {
    placeHolder: `Edit "${func.name}" - Select what to edit`,
    title: 'Edit Function'
  });

  if (!selected) {
    return;
  }

  const updates: Partial<SavedFunction> = {};

  if (selected.field === 'name' || selected.field === 'all') {
    const newName = await vscode.window.showInputBox({
      prompt: 'Enter new function name',
      value: func.name,
      validateInput: (value) => {
        if (!value || value.trim() === '') {
          return 'Name is required';
        }
        return null;
      }
    });

    if (newName === undefined) {
      return; // Cancelled
    }
    updates.name = newName.trim();
  }

  if (selected.field === 'description' || selected.field === 'all') {
    const newDescription = await vscode.window.showInputBox({
      prompt: 'Enter new description (optional)',
      value: func.description || '',
      placeHolder: 'Brief description of what this function does'
    });

    if (newDescription === undefined) {
      return; // Cancelled
    }
    updates.description = newDescription.trim() || undefined;
  }

  if (selected.field === 'category' || selected.field === 'all') {
    const newCategory = await selectCategory(storageManager, func.category);
    if (newCategory === undefined) {
      return; // Cancelled
    }
    updates.category = newCategory;
  }

  if (selected.field === 'code' || selected.field === 'all') {
    const newCode = await editCodeInEditor(func);
    if (newCode === undefined) {
      return; // Cancelled
    }
    updates.code = newCode;
  }

  // Apply updates
  if (Object.keys(updates).length > 0) {
    storageManager.updateFunction(func.id, updates);
    vscode.window.showInformationMessage(`Function "${updates.name || func.name}" updated successfully`);

    if (onUpdated) {
      onUpdated();
    }
  }
}

async function editCodeInEditor(func: SavedFunction): Promise<string | undefined> {
  // Create a temporary document with the function code
  const document = await vscode.workspace.openTextDocument({
    content: func.code,
    language: func.language
  });

  const editor = await vscode.window.showTextDocument(document, {
    preview: false,
    viewColumn: vscode.ViewColumn.Active
  });

  // Show instruction message
  const result = await vscode.window.showInformationMessage(
    `Editing code for "${func.name}". Make your changes and click "Save Changes" when done.`,
    { modal: false },
    'Save Changes',
    'Cancel'
  );

  if (result === 'Save Changes') {
    const newCode = editor.document.getText();

    // Close the temporary document without saving to disk
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

    return newCode;
  }

  // Close without saving
  await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  return undefined;
}

async function selectCategory(
  storageManager: StorageManager,
  currentCategory: string
): Promise<string | undefined> {
  const categories = storageManager.getCategories();

  const items = [
    ...categories.map(cat => ({
      label: cat === currentCategory ? `$(check) ${cat}` : cat,
      description: cat === currentCategory ? '(current)' : '',
      value: cat
    })),
    {
      label: '$(add) Create New Category...',
      description: 'Add a custom category',
      value: '__new__'
    }
  ];

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select new category',
    title: 'Change Category'
  });

  if (!selected) {
    return undefined;
  }

  if (selected.value === '__new__') {
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

    if (!newCategory) {
      return undefined;
    }

    storageManager.addCategory(newCategory.trim());
    return newCategory.trim();
  }

  return selected.value;
}
