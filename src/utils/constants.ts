/**
 * Command IDs for the extension
 */
export const COMMANDS = {
  SAVE_FUNCTION: 'devutils-manager.saveFunction',
  SHOW_FUNCTIONS: 'devutils-manager.showFunctions',
  INSERT_FUNCTION: 'devutils-manager.insertFunction',
  CONFIGURE_COMMAND: 'devutils-manager.configureCommand',
  CUSTOM_PREFIX: 'devutils-manager.custom.'
} as const;

/**
 * Keyboard shortcuts
 */
export const KEYBINDINGS = {
  SAVE: { windows: 'ctrl+alt+s', mac: 'cmd+alt+s' },
  SHOW: { windows: 'ctrl+alt+f', mac: 'cmd+alt+f' },
  INSERT: { windows: 'ctrl+alt+i', mac: 'cmd+alt+i' }
} as const;

/**
 * UI Messages
 */
export const MESSAGES = {
  NO_ACTIVE_EDITOR: 'No active editor',
  NO_CODE_SELECTED: 'No code selected',
  NO_FUNCTIONS_SAVED: 'No functions saved yet',
  FUNCTION_SAVED: (name: string) => `✅ Function "${name}" saved successfully!`,
  FUNCTION_SAVED_WITH_COMMAND: (name: string, cmd: string) =>
    `✅ Function "${name}" saved with command "devutils-manager.custom.${cmd}"!`,
  FUNCTION_INSERTED: (name: string) => `Inserted function: ${name}`,
  COMMAND_CONFIGURED: (name: string) => `✅ Custom command configured for "${name}"!`,
  ERROR_SAVING: (error: unknown) => `Error saving function: ${error}`
} as const;

/**
 * Input prompts and placeholders
 */
export const PROMPTS = {
  FUNCTION_NAME: {
    prompt: 'Enter a name for this function',
    placeholder: 'e.g., formatDate, fetchWithRetry'
  },
  DESCRIPTION: {
    prompt: 'Enter a description (optional)',
    placeholder: 'What does this function do?'
  },
  CUSTOM_COMMAND: {
    prompt: 'Enter a command name (will be prefixed with "devutils-manager.custom.")',
    placeholder: 'e.g., myFormatDate, quickSort'
  },
  KEYBOARD_SHORTCUT: {
    prompt: 'Enter keyboard shortcut (e.g., ctrl+shift+k)',
    placeholder: 'ctrl+shift+k'
  },
  MAC_SHORTCUT: {
    prompt: 'Enter Mac keyboard shortcut (optional, leave empty to use same as above)',
    placeholder: 'cmd+shift+k'
  },
  WHEN_CONDITION: {
    prompt: 'Enter "when" condition (optional, e.g., editorTextFocus)',
    placeholder: 'editorTextFocus'
  }
} as const;
