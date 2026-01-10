import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

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
    example: "Here to find the best 401k deal possible",
    description: "Summary of the applicant objective on the platform",
  })
  @IsOptional()
  @IsString()
  objectiveSummary?: string;

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
    example: ["66c1f3b2e8f4c1a9b1111111", "66c1f3b2e8f4c1a9b2222222"],
    description: "Skill category IDs (ObjectId as strings)",
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillCategories?: string[];

  @ApiProperty({
    example: "HCM",
    description: "Province/city code",
    required: false,
  })
  @IsOptional()
  @IsString()
  addressProvinceCode?: string;
}
