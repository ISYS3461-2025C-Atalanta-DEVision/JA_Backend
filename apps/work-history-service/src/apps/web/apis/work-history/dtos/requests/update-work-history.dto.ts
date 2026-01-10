import {
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsDateString,
} from "class-validator";

export class UpdateWorkHistoryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsString()
  description?: string;
}
