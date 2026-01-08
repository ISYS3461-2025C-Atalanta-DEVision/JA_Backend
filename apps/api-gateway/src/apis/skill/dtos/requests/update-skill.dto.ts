import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsBoolean } from "class-validator";

export class UpdateSkillDto {
  @ApiProperty({
    example: "TypeScript",
    description: "Skill name",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: "A typed superset of JavaScript",
    description: "Skill description",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: "typescript-icon",
    description: "Icon identifier",
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    example: true,
    description: "Whether the skill is active",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
