import { IsBoolean, IsDate, IsOptional } from "class-validator";

export class AddEmailHashDto {
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  emailVerificationToken?: string;

  @IsOptional()
  @IsDate()
  emailVerificationTokenExpires?: Date;
}
