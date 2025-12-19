import { ApiProperty } from '@nestjs/swagger';

export class DeleteResultDto {
  @ApiProperty({
    description: 'Indicates if the deletion was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'S3 key of the deleted file',
    example: 'avatar/1734567890123_a1b2c3.jpg',
  })
  deletedKey: string;
}
