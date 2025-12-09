import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import {
  parsePhoneNumber,
  isValidPhoneNumber,
  CountryCode,
} from 'libphonenumber-js';

/**
 * Phone validation options
 */
export interface PhoneValidationOptions {
  defaultCountry?: CountryCode; // Default country for parsing
  allowedCountries?: CountryCode[]; // Only allow specific countries
  requireCountryCode?: boolean; // Require + prefix
}

/**
 * Validate phone number using libphonenumber-js
 */
export function validatePhone(
  phone: string,
  options: PhoneValidationOptions = {},
): { valid: boolean; errors: string[]; formatted?: string; country?: string } {
  const errors: string[] = [];

  if (!phone || typeof phone !== 'string') {
    return { valid: false, errors: ['Phone number is required'] };
  }

  // Clean phone number
  const cleanedPhone = phone.trim();

  // Check if country code is required
  if (options.requireCountryCode && !cleanedPhone.startsWith('+')) {
    errors.push('Phone number must start with country code (e.g., +84)');
    return { valid: false, errors };
  }

  try {
    // Try to parse with default country
    const phoneNumber = parsePhoneNumber(
      cleanedPhone,
      options.defaultCountry || 'VN',
    );

    if (!phoneNumber) {
      errors.push('Invalid phone number format');
      return { valid: false, errors };
    }

    // Validate the parsed number
    if (!isValidPhoneNumber(cleanedPhone, options.defaultCountry || 'VN')) {
      errors.push('Phone number is not valid');
      return { valid: false, errors };
    }

    // Check if country is allowed
    const country = phoneNumber.country;
    if (
      options.allowedCountries &&
      country &&
      !options.allowedCountries.includes(country)
    ) {
      errors.push(
        `Phone number from ${country} is not allowed. Allowed: ${options.allowedCountries.join(', ')}`,
      );
      return { valid: false, errors };
    }

    return {
      valid: true,
      errors: [],
      formatted: phoneNumber.formatInternational(),
      country: country,
    };
  } catch (error) {
    errors.push('Invalid phone number format');
    return { valid: false, errors };
  }
}

/**
 * Format phone number to E.164 format
 * E.164: +[country code][subscriber number]
 */
export function formatPhoneE164(
  phone: string,
  defaultCountry: CountryCode = 'VN',
): string | null {
  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format('E.164');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Format phone number for display (international format)
 */
export function formatPhoneInternational(
  phone: string,
  defaultCountry: CountryCode = 'VN',
): string | null {
  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatInternational();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Custom decorator for phone validation
 */
export function IsValidPhone(
  options?: PhoneValidationOptions,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value) return true; // Let @IsOptional handle required check
          const result = validatePhone(value, options);
          return result.valid;
        },
        defaultMessage(args: ValidationArguments) {
          const result = validatePhone(args.value, options);
          return result.errors.join(', ');
        },
      },
    });
  };
}
