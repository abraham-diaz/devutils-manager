# Change Log

All notable changes to the "devutils-manager" extension will be documented in this file.

## [0.3.0] - 2025-12-26

### Added
- **Sidebar Panel**: Dedicated activity bar icon with hierarchical function tree view
  - Custom SVG icon in the activity bar
  - Functions organized by category folders
  - Click to view details, right-click for actions
- **Categories System**: Organize functions into folders
  - Predefined categories: General, Utils, API, UI Components, Database, Auth, Testing
  - Create, rename, and delete custom categories
  - Move functions between categories
  - Category count displayed in tree view
- **Edit Functions**: Full editing support for saved functions
  - Edit name, description, code, or category individually
  - Edit all properties at once
  - Access from sidebar context menu or details panel
- **Export Functions**: Backup your function library
  - Export all functions and custom categories to JSON
  - Choose save location with file dialog
- **Import Functions**: Restore or share functions
  - Import from JSON backup files
  - Smart duplicate handling: Skip, Replace, or Keep Both
  - Automatic category import

### Improved
- Tree view with expandable category folders
- Functions automatically migrated to "General" category
- Better organization and navigation

## [0.2.0] - 2025-12-02

### Changed
- Code refactoring and structure improvements
- Bug fixes and optimizations

## [0.1.0] - 2025-11-29

### Added
- **Custom Commands**: Create custom VS Code commands for your saved functions
  - Map any saved function to a custom command (e.g., `devutils-manager.custom.myFormatDate`)
  - Execute functions directly through the command palette with custom names
- **Keyboard Shortcuts**: Configure custom keyboard shortcuts for your functions
  - Set platform-specific shortcuts (Windows/Linux and Mac)
  - Configure "when" conditions for context-aware shortcuts
  - Easy setup with guided UI and automatic keybinding configuration
- **Command Configuration UI**: New command to configure/edit custom commands and shortcuts for existing functions
  - `DevUtils: Configure Custom Command` - Set up custom commands and shortcuts for saved functions
  - Validates command names to prevent duplicates
  - Pre-fills existing values when editing
- **Enhanced Function Details**: Function details panel now shows custom command and keyboard shortcut information

### Improved
- Extension now registers dynamic commands on activation for all saved functions with custom commands
- Better user experience with step-by-step configuration during function save
- Added helper to open Keyboard Shortcuts settings directly from the extension

### Optimized
- Optimized extension icon (38% smaller file size for faster loading)

## [0.0.1] - 2025-11-06

### Added
- Save code snippets as reusable functions with name and description
- Browse saved functions with searchable QuickPick interface
- Insert saved functions at cursor position with smart search
- View detailed function information in side panel (code, description, stats)
- Automatic programming language detection
- Usage tracking for each function
- Local storage in VS Code global storage directory
- Keyboard shortcuts:
  - `Ctrl+Alt+S` - Save selected code as function
  - `Ctrl+Alt+F` - Show all saved functions
  - `Ctrl+Alt+I` - Insert function at cursor
- Context menu integration for saving functions