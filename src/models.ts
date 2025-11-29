export interface SavedFunction {
  id: string;
  name: string;
  code: string;
  language: string;
  description?: string;
  tags: string[];
  createdAt: string;
  usageCount: number;
  customCommand?: string; // e.g., "myCustomFunction"
  keybinding?: KeyBinding;
}

export interface KeyBinding {
  key: string; // e.g., "ctrl+shift+k"
  mac?: string; // e.g., "cmd+shift+k"
  when?: string; // e.g., "editorTextFocus"
}