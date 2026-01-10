import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, IsBoolean, IsArray } from "class-validator";

export class UpdateApplicantDto {
  @ApiProperty({
    example: "John Doe",
    description: "Full name of the applicant",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: "john@example.com",
    description: "Email address",
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

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
    example: "66c1f3b2e8f4c1a9b1111111",
    description: "Highest Education degree of user",
    required: false,
  })
  @IsOptional()
  @IsString()
  highestEducation?: string;

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
    example: "VN",
    description: "Country 2 letters code",
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    example: true,
    description: "Whether the applicant is active",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: true,
    description: "Whether the applicant has subcribed for premiuim features",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiProperty({
    example: ["66c1f3b2e8f4c1a9b1111111", "66c1f3b2e8f4c1a9b2222222"],
    required: false,
    description: "Updated skill category IDs (ObjectId as strings)",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillCategories?: string[];

}
