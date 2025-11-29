import { FunctionService } from '../services/FunctionService';
import { isValidCommandName } from '../utils/helpers';

/**
 * Validators for user input
 */
export class InputValidators {
  constructor(private functionService: FunctionService) {}

  /**
   * Validate function name
   */
  validateFunctionName(value: string): string | null {
    if (!value || value.trim().length === 0) {
      return 'Name is required';
    }
    return null;
  }

  /**
   * Validate command name
   */
  validateCommandName(value: string, excludeId?: string): string | null {
    if (!value || value.trim().length === 0) {
      return 'Command name is required';
    }

    if (!isValidCommandName(value)) {
      return 'Command name can only contain letters, numbers, hyphens, and underscores';
    }

    if (this.functionService.isCommandNameTaken(value.trim(), excludeId)) {
      const existingFunc = this.functionService
        .getAllFunctions()
        .find(f => f.customCommand === value.trim() && f.id !== excludeId);
      return `Command "${value}" already exists for function "${existingFunc?.name}"`;
    }

    return null;
  }

  /**
   * Validate keyboard shortcut
   */
  validateKeyboardShortcut(value: string): string | null {
    if (!value || value.trim().length === 0) {
      return 'Keyboard shortcut is required';
    }
    return null;
  }
}
