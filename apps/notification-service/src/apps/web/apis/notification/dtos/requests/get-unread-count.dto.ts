import { IsString, IsNotEmpty } from "class-validator";

export class GetUnreadCountDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string;
}
