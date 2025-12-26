import * as vscode from 'vscode';
import { StorageManager } from '../storage';
import { SavedFunction, DEFAULT_CATEGORIES } from '../models';

// Union type for tree items
export type TreeItem = CategoryTreeItem | FunctionTreeItem;

export class CategoryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly categoryName: string,
    public readonly count: number,
    public readonly isCustom: boolean
  ) {
    super(
      categoryName,
      count > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed
    );

    this.description = `(${count})`;
    this.iconPath = new vscode.ThemeIcon('folder');
    this.contextValue = isCustom ? 'customCategory' : 'defaultCategory';
    this.tooltip = `${categoryName} - ${count} function${count !== 1 ? 's' : ''}`;
  }
}

export class FunctionTreeItem extends vscode.TreeItem {
  constructor(
    public readonly func: SavedFunction
  ) {
    super(func.name, vscode.TreeItemCollapsibleState.None);

    this.tooltip = this.buildTooltip();
    this.description = func.language;
    this.iconPath = this.getLanguageIcon();
    this.contextValue = 'savedFunction';

    // Click abre los detalles
    this.command = {
      command: 'devutils-manager.viewFunctionDetails',
      title: 'View Details',
      arguments: [func]
    };
  }

  private buildTooltip(): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${this.func.name}**\n\n`);
    if (this.func.description) {
      md.appendMarkdown(`${this.func.description}\n\n`);
    }
    md.appendMarkdown(`- Language: ${this.func.language}\n`);
    md.appendMarkdown(`- Category: ${this.func.category}\n`);
    md.appendMarkdown(`- Used: ${this.func.usageCount} times\n`);
    md.appendMarkdown(`- Created: ${new Date(this.func.createdAt).toLocaleDateString()}`);
    return md;
  }

  private getLanguageIcon(): vscode.ThemeIcon {
    const iconMap: Record<string, string> = {
      'javascript': 'symbol-method',
      'typescript': 'symbol-method',
      'python': 'symbol-method',
      'java': 'symbol-method',
      'csharp': 'symbol-method',
      'cpp': 'symbol-method',
      'c': 'symbol-method',
      'go': 'symbol-method',
      'rust': 'symbol-method',
      'php': 'symbol-method',
      'ruby': 'symbol-method',
      'swift': 'symbol-method',
      'kotlin': 'symbol-method',
      'html': 'symbol-misc',
      'css': 'symbol-color',
      'scss': 'symbol-color',
      'json': 'symbol-namespace',
      'xml': 'symbol-namespace',
      'yaml': 'symbol-namespace',
      'markdown': 'markdown',
      'sql': 'database',
      'shellscript': 'terminal',
      'powershell': 'terminal',
      'bat': 'terminal'
    };

    const iconName = iconMap[this.func.language.toLowerCase()] || 'symbol-snippet';
    return new vscode.ThemeIcon(iconName);
  }
}

export class FunctionsTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> =
    new vscode.EventEmitter<TreeItem | undefined | null | void>();

  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private storageManager: StorageManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]> {
    if (!element) {
      // Root level: return categories
      return Promise.resolve(this.getCategories());
    }

    if (element instanceof CategoryTreeItem) {
      // Category level: return functions in this category
      return Promise.resolve(this.getFunctionsInCategory(element.categoryName));
    }

    // Function level: no children
    return Promise.resolve([]);
  }

  private getCategories(): CategoryTreeItem[] {
    const categoriesWithCount = this.storageManager.getCategoriesWithCount();

    // Filter to only show categories that have functions or are default
    const items = categoriesWithCount
      .filter(cat => cat.count > 0 || DEFAULT_CATEGORIES.includes(cat.name))
      .map(cat => new CategoryTreeItem(cat.name, cat.count, cat.isCustom));

    return items;
  }

  private getFunctionsInCategory(category: string): FunctionTreeItem[] {
    const functions = this.storageManager.getFunctionsByCategory(category);

    // Sort by name
    const sorted = [...functions].sort((a, b) => a.name.localeCompare(b.name));

    return sorted.map(func => new FunctionTreeItem(func));
  }
}
