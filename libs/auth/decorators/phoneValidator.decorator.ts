import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { PhoneNumberUtil, PhoneNumberFormat } from "google-libphonenumber";

const phoneUtil = PhoneNumberUtil.getInstance();

export function IsPhoneIntl(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value) return true;
          try {
            const num = phoneUtil.parse(value);
            return phoneUtil.isValidNumber(num);
          } catch {
            return false;
          }
        },
        defaultMessage(): string {
          return "Phone number must be a valid international format";
        },
      },
    });
  };
}
