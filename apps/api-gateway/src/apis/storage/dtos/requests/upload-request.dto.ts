import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StorageFolder } from '@storage/enums';

export class UploadRequestDto {
  @ApiProperty({
    enum: StorageFolder,
    description: 'Storage folder (avatar, cv, job, post)',
    example: StorageFolder.AVATAR,
  })
  @IsEnum(StorageFolder, {
    message: 'Invalid folder. Must be: avatar, cv, job, or post',
  })
  folder: StorageFolder;
}
