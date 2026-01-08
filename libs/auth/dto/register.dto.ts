import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsAlpha,
  Length,
  MaxLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsPhoneIntl } from "@auth/decorators/phoneValidator.decorator";

export class RegisterDto {
  @ApiProperty({ example: "John Doe", required: true })
  @IsString()
  @IsNotEmpty({ message: "Name is required" })
  @MinLength(2)
  name: string;

  @ApiProperty({ example: "john@example.com", required: true })
  @IsNotEmpty({ message: "Email is required" })
  @IsEmail({}, { message: "Invalid email format" })
  @MaxLength(254, { message: "Email must be less than 255 characters" })
  email: string;

  @ApiProperty({ example: "SecurePass123!", required: true })
  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @Matches(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
  })
  @Matches(/\d/, {
    message: "Password must contain at least one number",
  })
  @Matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, {
    message: "Password must contain at least one special character",
  })
  password: string;

  @ApiProperty({
    example: "VN",
    required: true,
    description: "ISO 3166-1 alpha-2 country code",
  })
  @IsString()
  @IsNotEmpty({ message: "Country is required" })
  @IsAlpha()
  @Length(2, 2, { message: "Country code must be exactly 2 characters" })
  country: string;

  @ApiProperty({ example: "+84901234567", required: false })
  @IsPhoneIntl({ message: "Invalid international phone number" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: "123 Main St", required: false })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ example: "Ho Chi Minh City", required: false })
  @IsOptional()
  @IsString()
  city?: string;
}
