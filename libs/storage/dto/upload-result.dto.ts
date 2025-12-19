import { ApiProperty } from '@nestjs/swagger';

export class UploadResultDto {
  @ApiProperty({
    description: 'CDN URL of the uploaded file',
    example: 'https://cdn.example.com/avatar/1734567890123_a1b2c3.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'S3 key of the uploaded file',
    example: 'avatar/1734567890123_a1b2c3.jpg',
  })
  key: string;

  @ApiProperty({
    description: 'Storage folder',
    example: 'avatar',
  })
  folder: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 102400,
  })
  size: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  mimeType: string;
}
