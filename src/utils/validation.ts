import { isValidCalendarUrl } from './calendarUrl';

// Common validation patterns
const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  URL: /^https?:\/\/.+/,
  VIDEO_URL: /^https?:\/\/((?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+|(?:www\.)?vimeo\.com\/[0-9]+|(?:www\.)?(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)[a-zA-Z0-9]+)$/,
  DISPLAY_NAME: /^[a-zA-Z0-9\s._-]{2,50}$/,
  PRICE: /^\d+(\.\d{1,2})?$/
};

// Validation error messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_VIDEO_URL: 'Please enter a valid YouTube, Vimeo, or Dailymotion URL',
  INVALID_DISPLAY_NAME: 'Display name can only contain letters, numbers, spaces, and ._-',
  INVALID_PRICE: 'Please enter a valid price',
  INVALID_CALENDAR_URL: 'Please enter a valid calendar URL',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  MAX_LENGTH: (max: number) => `Must be ${max} characters or less`,
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`
};

// Validation functions
export const validators = {
  required: (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return true;
    return !!value;
  },

  email: (value: string): boolean => {
    return PATTERNS.EMAIL.test(value);
  },

  url: (value: string): boolean => {
    return PATTERNS.URL.test(value);
  },

  videoUrl: (value: string): boolean => {
    return PATTERNS.VIDEO_URL.test(value);
  },

  displayName: (value: string): boolean => {
    return PATTERNS.DISPLAY_NAME.test(value);
  },

  price: (value: string | number): boolean => {
    return PATTERNS.PRICE.test(value.toString());
  },

  calendarUrl: (value: string): boolean => {
    return isValidCalendarUrl(value);
  },

  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },

  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  passwordMatch: (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword;
  }
};

// Types for validation rules
interface ValidationRule {
  validator: (value: any, ...args: any[]) => boolean;
  message: string;
  args?: any[];
}

interface ValidationRules {
  [key: string]: ValidationRule[];
}

// Main validation function
export function validateForm(data: Record<string, any>, rules: ValidationRules): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.entries(rules).forEach(([field, fieldRules]) => {
    // Skip validation if field doesn't exist in data
    if (!(field in data)) return;

    const value = data[field];

    for (const rule of fieldRules) {
      const isValid = rule.args 
        ? rule.validator(value, ...rule.args)
        : rule.validator(value);

      if (!isValid) {
        errors[field] = rule.message;
        break; // Stop on first error for this field
      }
    }
  });

  return errors;
}

// Helper to create validation rules
export function createValidationRules(field: string, ...rules: ValidationRule[]): ValidationRules {
  return { [field]: rules };
}

// Common validation rule sets
export const commonRules = {
  required: (message = VALIDATION_MESSAGES.REQUIRED): ValidationRule => ({
    validator: validators.required,
    message
  }),

  email: (message = VALIDATION_MESSAGES.INVALID_EMAIL): ValidationRule => ({
    validator: validators.email,
    message
  }),

  url: (message = VALIDATION_MESSAGES.INVALID_URL): ValidationRule => ({
    validator: validators.url,
    message
  }),

  videoUrl: (message = VALIDATION_MESSAGES.INVALID_VIDEO_URL): ValidationRule => ({
    validator: validators.videoUrl,
    message
  }),

  displayName: (message = VALIDATION_MESSAGES.INVALID_DISPLAY_NAME): ValidationRule => ({
    validator: validators.displayName,
    message
  }),

  price: (message = VALIDATION_MESSAGES.INVALID_PRICE): ValidationRule => ({
    validator: validators.price,
    message
  }),

  calendarUrl: (message = VALIDATION_MESSAGES.INVALID_CALENDAR_URL): ValidationRule => ({
    validator: validators.calendarUrl,
    message
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: validators.maxLength,
    message: message || VALIDATION_MESSAGES.MAX_LENGTH(max),
    args: [max]
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validator: validators.minLength,
    message: message || VALIDATION_MESSAGES.MIN_LENGTH(min),
    args: [min]
  }),

  passwordMatch: (confirmPassword: string, message = VALIDATION_MESSAGES.PASSWORDS_DONT_MATCH): ValidationRule => ({
    validator: validators.passwordMatch,
    message,
    args: [confirmPassword]
  })
};