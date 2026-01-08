import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateApplicantDto {
  @ApiProperty({
    example: "John Doe",
    description: "Full name of the applicant",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: "john@example.com", description: "Email address" })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "+84901234567",
    description: "Phone number",
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: "123 Main St, District 1",
    description: "Full address",
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: "https://d2a765vgwhyp2i.cloudfront.net/toni-infante-vivi-w1.jpg",
    description: "CDN url of the avatar",
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    example: "HCM",
    description: "Province/city code",
    required: false,
  })
  @IsOptional()
  @IsString()
  addressProvinceCode?: string;
}
