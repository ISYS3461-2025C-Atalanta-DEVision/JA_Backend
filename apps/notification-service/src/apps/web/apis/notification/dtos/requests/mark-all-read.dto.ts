import { IsString, IsNotEmpty } from "class-validator";

export class MarkAllReadDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string;
}
