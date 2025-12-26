# DevUtils Manager

Your personal utility functions library, always at your fingertips.

## Features

DevUtils Manager helps developers save, organize, and reuse utility functions across projects. Build your personal knowledge base of code snippets and boost your productivity.

### Sidebar Panel
- Dedicated sidebar with your function library
- Hierarchical view organized by categories
- Quick access to all your saved functions
- Right-click context menu for actions

### Categories & Organization
- Organize functions into categories (folders)
- Predefined categories: General, Utils, API, UI Components, Database, Auth, Testing
- Create custom categories
- Rename or delete custom categories
- Move functions between categories

### Save Functions
- Select any code snippet
- Right-click and choose "DevUtils: Save Function"
- Add a name and description
- Select a category
- Automatically detects the programming language

### Edit Functions
- Edit function name, description, or code
- Change category
- Edit all properties at once
- Access from sidebar context menu or details panel

### Browse Your Library
- View all saved functions in the sidebar tree
- Click to view detailed information
- See usage statistics
- Filter by category

### Insert Functions
- Quick insert with `Ctrl+Alt+I`
- Insert from sidebar context menu
- Insert from details panel
- Automatic usage tracking

### Export & Import
- Export all functions to JSON file
- Import functions from backup
- Handle duplicates: Skip, Replace, or Keep Both
- Includes custom categories

### Custom Commands & Keyboard Shortcuts
- Create custom VS Code commands for your saved functions
- Configure personalized keyboard shortcuts
- Execute your functions directly from the command palette
- Platform-specific shortcuts (Windows/Linux and macOS)
- Context-aware shortcuts with "when" conditions

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `DevUtils: Save Function` | `Ctrl+Alt+S` | Save selected code as a utility function |
| `DevUtils: Show My Functions` | `Ctrl+Alt+F` | Browse your function library |
| `DevUtils: Insert Function` | `Ctrl+Alt+I` | Insert a saved function at cursor |
| `DevUtils: Configure Custom Command` | - | Set up custom commands and shortcuts |
| `DevUtils: Export Functions` | - | Export all functions to JSON file |
| `DevUtils: Import Functions` | - | Import functions from JSON file |

> **Note:** On macOS, use `Cmd` instead of `Ctrl`

## Usage

### Saving a Function

1. Select the code you want to save
2. Press `Ctrl+Alt+S` or right-click and select "DevUtils: Save Function"
3. Enter a name (e.g., "formatDate", "fetchWithRetry")
4. Optionally add a description
5. Select a category (or create a new one)
6. Optionally create a custom command
7. Done! Your function is saved locally

### Using the Sidebar

1. Click the DevUtils icon in the activity bar (left sidebar)
2. Browse functions organized by category
3. Click a function to view details
4. Right-click for actions: Edit, Insert, Delete

### Editing a Function

1. Right-click a function in the sidebar
2. Select "Edit Function"
3. Choose what to edit: Name, Description, Category, Code, or All
4. Make your changes and confirm

### Organizing with Categories

- Functions are organized in expandable folders
- Right-click a custom category to rename or delete it
- When saving/editing, you can select or create categories
- Deleting a category moves its functions to "General"

### Exporting Functions

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "DevUtils: Export Functions"
3. Choose save location
4. All functions and custom categories are exported

### Importing Functions

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "DevUtils: Import Functions"
3. Select your JSON file
4. Choose how to handle duplicates:
   - **Skip**: Keep existing, ignore duplicates
   - **Replace**: Overwrite with imported
   - **Keep Both**: Rename imported functions

### Creating Custom Commands

When saving a function, you can:

1. Choose to create a custom command
2. Enter a command name (e.g., "myDateFormatter")
3. Optionally configure a keyboard shortcut
4. Set platform-specific shortcuts for Mac
5. Add "when" conditions for context-aware shortcuts

Your custom command will be available as `devutils-manager.custom.yourCommandName` in the command palette!

## Requirements

- Visual Studio Code v1.105.0 or higher

## Storage

All functions are stored locally in your VS Code global storage directory. Your data stays on your machine and is never sent anywhere.

## Known Issues

None at the moment. Report issues at [GitHub Issues](https://github.com/abraham-diaz/devutils-manager/issues)

## Release Notes

### 0.3.0

Major feature update - Organization & Portability

- **Sidebar Panel**: Dedicated activity bar icon with function tree view
- **Categories**: Organize functions in folders with predefined and custom categories
- **Edit Functions**: Full editing support for name, description, code, and category
- **Export/Import**: Backup and restore functions with JSON files
- **Duplicate Handling**: Smart import with skip, replace, or keep both options
- **Improved UI**: Hierarchical tree with category folders and function counts

### 0.2.0

- Code refactoring and improvements
- Bug fixes

### 0.1.0

Custom Commands & Keyboard Shortcuts

- **Custom Commands**: Create VS Code commands for your saved functions
- **Keyboard Shortcuts**: Configure personalized shortcuts with platform-specific support
- **Enhanced UI**: Guided setup for commands and shortcuts during function save
- **Command Configuration**: New command to configure/edit commands for existing functions
- **Improved Details View**: Function details now show custom command and keyboard shortcut info

### 0.0.1

Initial release of DevUtils Manager

- Save code snippets as reusable functions
- Browse and search your function library
- Insert functions with keyboard shortcuts
- View detailed function information
- Usage tracking for each function

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC
