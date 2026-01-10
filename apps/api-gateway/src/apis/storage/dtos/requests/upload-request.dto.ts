import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { StorageFolder } from "@storage/enums";

export class UploadRequestDto {
  @ApiProperty({
    enum: StorageFolder,
    description: "Storage folder (avatar, cv, cover-letter, job, post)",
    example: StorageFolder.AVATAR,
  })
  @IsEnum(StorageFolder, {
    message: "Invalid folder. Must be: avatar, cv, cover-letter, job, or post",
  })
  folder: StorageFolder;
}
