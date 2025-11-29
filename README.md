# DevUtils Manager

Your personal utility functions library, always at your fingertips.

## Features

DevUtils Manager helps developers save, organize, and reuse utility functions across projects. Build your personal knowledge base of code snippets and boost your productivity.

### Save Functions
- Select any code snippet
- Right-click and choose "DevUtils: Save Function"
- Add a name and description
- Automatically detects the programming language

### Browse Your Library
- View all saved functions with a searchable quick pick menu
- See detailed information including usage statistics
- Filter by name, language, or description

### Insert Functions
- Quick insert with `Ctrl+Alt+I`
- Search and preview before inserting
- Automatic usage tracking

### Custom Commands & Keyboard Shortcuts (NEW!)
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
| `DevUtils: Configure Custom Command` | - | Set up custom commands and shortcuts for saved functions |

> **Note:** On macOS, use `Cmd` instead of `Ctrl`

## Usage

### Saving a Function

1. Select the code you want to save
2. Press `Ctrl+Alt+S` or right-click and select "DevUtils: Save Function"
3. Enter a name (e.g., "formatDate", "fetchWithRetry")
4. Optionally add a description
5. Done! Your function is saved locally

### Inserting a Function

1. Place your cursor where you want to insert code
2. Press `Ctrl+Alt+I`
3. Search for your function by name or description
4. Press Enter to insert

### Viewing Functions

1. Press `Ctrl+Alt+F` to see all your saved functions
2. Select any function to view its details in a side panel
3. See code, description, language, usage statistics, and custom commands

### Creating Custom Commands (NEW!)

When saving a function, you can now:

1. Choose to create a custom command
2. Enter a command name (e.g., "myDateFormatter")
3. Optionally configure a keyboard shortcut
4. Set platform-specific shortcuts for Mac
5. Add "when" conditions for context-aware shortcuts

Your custom command will be available as `devutils-manager.custom.yourCommandName` in the command palette!

### Configuring Commands for Existing Functions

1. Press `Ctrl+Shift+P` and search for "DevUtils: Configure Custom Command"
2. Select the function you want to configure
3. Set up the command name and keyboard shortcut
4. Choose to open Keyboard Shortcuts settings or copy the config

## Requirements

- Visual Studio Code v1.105.0 or higher

## Storage

All functions are stored locally in your VS Code global storage directory. Your data stays on your machine and is never sent anywhere.

## Known Issues

None at the moment. Report issues at [GitHub Issues](https://github.com/abraham-diaz/devutils-manager/issues)

## Release Notes

### 0.1.0

Major feature update - Custom Commands & Keyboard Shortcuts

- **Custom Commands**: Create VS Code commands for your saved functions
- **Keyboard Shortcuts**: Configure personalized shortcuts with platform-specific support
- **Enhanced UI**: Guided setup for commands and shortcuts during function save
- **Command Configuration**: New command to configure/edit commands for existing functions
- **Improved Details View**: Function details now show custom command and keyboard shortcut info
- **Optimized**: Extension icon optimized for faster loading (38% smaller)

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
