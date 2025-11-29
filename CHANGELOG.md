# Change Log

All notable changes to the "devutils-manager" extension will be documented in this file.

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