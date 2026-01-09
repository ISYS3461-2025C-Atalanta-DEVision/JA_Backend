import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsNotEmpty()
  @ApiProperty({ description: "The account current password", example: "SecurePass123!", required: true })
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @ApiProperty({ description: "Password must be at least 8 characters long, contain at least one number and one special character", example: "EvenMoreSecurePass456!", required: true })
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
  @IsString()
  newPassword: string
}
