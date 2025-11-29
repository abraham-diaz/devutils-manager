import { SavedFunction } from '../models';
import { escapeHtml, formatDate } from '../utils/helpers';

/**
 * Generates HTML views for function details
 */
export class FunctionDetailsView {
  /**
   * Generate HTML for function details panel
   */
  static generateHtml(func: SavedFunction): string {
    const createdDate = formatDate(func.createdAt);

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
    </body>
    </html>
  `;
  }
}
