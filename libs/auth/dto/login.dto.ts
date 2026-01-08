import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "john@example.com", required: true })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @ApiProperty({ example: "SecurePass123!", required: true })
  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  password: string;
}
