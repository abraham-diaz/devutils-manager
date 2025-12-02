import * as vscode from 'vscode';
import { SavedFunction } from '../models';
import { StorageManager } from '../storage';
import { escapeHtml } from '../utils/helpers';

export class FunctionDetailsView {
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private storageManager: StorageManager,
    private onFunctionDeleted?: () => void
  ) {}

  public show(func: SavedFunction): void {
    this.panel = vscode.window.createWebviewPanel(
      'functionDetails',
      `Function: ${func.name}`,
      vscode.ViewColumn.Two,
      {
        enableScripts: true
      }
    );

    this.panel.webview.html = this.getHtml(func);

    // Manejar mensajes del webview
    this.panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'delete':
            await this.handleDelete(func);
            break;
          case 'insert':
            await this.handleInsert(func);
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  private async handleDelete(func: SavedFunction): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      `Are you sure you want to delete "${func.name}"?`,
      { modal: true },
      'Delete'
    );

    if (confirm === 'Delete') {
      this.storageManager.deleteFunction(func.id);
      this.panel?.dispose();
      vscode.window.showInformationMessage(
        `Function "${func.name}" deleted successfully`
      );

      // Notificar que la función fue eliminada
      if (this.onFunctionDeleted) {
        this.onFunctionDeleted();
      }
    }
  }

  private async handleInsert(func: SavedFunction): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const position = editor.selection.active;
      await editor.edit(editBuilder => {
        editBuilder.insert(position, func.code);
      });
      this.storageManager.incrementUsage(func.id);
      vscode.window.showInformationMessage(`Inserted function: ${func.name}`);
    } else {
      vscode.window.showErrorMessage('No active editor');
    }
  }

  private getHtml(func: SavedFunction): string {
    const createdDate = new Date(func.createdAt).toLocaleString();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Function Details</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
          }
          .header {
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          h1 {
            margin: 0 0 10px 0;
            color: var(--vscode-foreground);
          }
          .meta {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
          }
          .section {
            margin: 20px 0;
          }
          .section-title {
            font-weight: bold;
            color: var(--vscode-foreground);
            margin-bottom: 8px;
          }
          .description {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            margin-bottom: 15px;
          }
          pre {
            background-color: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            overflow-x: auto;
          }
          code {
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            font-size: 0.85em;
            margin-right: 8px;
          }
          .actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
          }
          .btn {
            padding: 8px 16px;
            border: 1px solid var(--vscode-button-border);
            border-radius: 2px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: 13px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
          }
          .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }
          .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
          }
          .btn-danger {
            background-color: transparent;
            color: var(--vscode-errorForeground);
            border-color: var(--vscode-errorForeground);
          }
          .btn-danger:hover {
            background-color: var(--vscode-inputValidation-errorBackground);
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${func.name}</h1>
          <div class="meta">
            <span class="badge">${func.language}</span>
            <span>Created: ${createdDate}</span>
            <span> | Used: ${func.usageCount} times</span>
          </div>
        </div>

        ${func.description ? `
          <div class="section">
            <div class="section-title">Description</div>
            <div class="description">${func.description}</div>
          </div>
        ` : ''}

        ${func.customCommand ? `
          <div class="section">
            <div class="section-title">Custom Command</div>
            <div><code>devutils-manager.custom.${func.customCommand}</code></div>
          </div>
        ` : ''}

        ${func.keybinding ? `
          <div class="section">
            <div class="section-title">Keyboard Shortcut</div>
            <div>
              <div><strong>Key:</strong> <code>${func.keybinding.key}</code></div>
              ${func.keybinding.mac ? `<div><strong>Mac:</strong> <code>${func.keybinding.mac}</code></div>` : ''}
              ${func.keybinding.when ? `<div><strong>When:</strong> <code>${func.keybinding.when}</code></div>` : ''}
            </div>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Code</div>
          <pre><code>${escapeHtml(func.code)}</code></pre>
        </div>

        ${func.tags.length > 0 ? `
          <div class="section">
            <div class="section-title">Tags</div>
            <div>${func.tags.map(tag => `<span class="badge">${tag}</span>`).join('')}</div>
          </div>
        ` : ''}

        <div class="actions">
          <button class="btn btn-primary" onclick="insertFunction()">
            <span>$(insert)</span> Insert Function
          </button>
          <button class="btn btn-danger" onclick="deleteFunction()">
            <span>$(trash)</span> Delete Function
          </button>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          function insertFunction() {
            vscode.postMessage({
              command: 'insert'
            });
          }

          function deleteFunction() {
            vscode.postMessage({
              command: 'delete'
            });
          }
        </script>
      </body>
      </html>
    `;
  }
}
