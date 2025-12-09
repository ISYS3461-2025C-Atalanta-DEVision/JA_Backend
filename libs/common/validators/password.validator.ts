import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Password validation rules
 * Based on OWASP recommendations
 */
export interface PasswordValidationOptions {
  minLength?: number; // default: 8
  maxLength?: number; // default: 128
  requireUppercase?: boolean; // default: true
  requireLowercase?: boolean; // default: true
  requireNumber?: boolean; // default: true
  requireSpecial?: boolean; // default: false
}

const DEFAULT_OPTIONS: Required<PasswordValidationOptions> = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
};

/**
 * Validate password strength
 */
export function validatePassword(
  password: string,
  options: PasswordValidationOptions = {},
): { valid: boolean; errors: string[] } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < opts.minLength) {
    errors.push(`Password must be at least ${opts.minLength} characters`);
  }

  if (password.length > opts.maxLength) {
    errors.push(`Password must be at most ${opts.maxLength} characters`);
  }

  if (opts.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (opts.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (opts.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (opts.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const commonWeakPasswords = [
    'password',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
    'admin123',
    'letmein',
    'welcome',
  ];
  if (commonWeakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Custom decorator for password validation
 */
export function IsStrongPassword(
  options?: PasswordValidationOptions,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const result = validatePassword(value, options);
          return result.valid;
        },
        defaultMessage(args: ValidationArguments) {
          const result = validatePassword(args.value, options);
          return result.errors.join(', ');
        },
      },
    });
  };
}
