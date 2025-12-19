import {
  Controller,
  Post,
  Delete,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ApiKeyAuth } from '@auth/decorators';
import { StorageService, UploadResultDto, DeleteResultDto } from '@storage/index';
import { UploadRequestDto } from '../dtos';

@Controller('storage')
@ApiTags('Storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiKeyAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload file to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'folder'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
        folder: {
          type: 'string',
          enum: ['avatar', 'cv', 'job', 'post'],
          description: 'Storage folder',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadResultDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or folder' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadRequestDto,
  ): Promise<UploadResultDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    this.logger.log(`Uploading file to folder: ${dto.folder}`);

    return this.storageService.upload(file, dto.folder);
  }

  @Delete()
  @ApiKeyAuth()
  @ApiOperation({ summary: 'Delete file from S3' })
  @ApiQuery({
    name: 'url',
    required: true,
    description: 'CDN URL of the file to delete',
    example: 'https://cdn.example.com/avatar/1734567890123_a1b2c3.jpg',
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    type: DeleteResultDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid URL' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async delete(@Query('url') url: string): Promise<DeleteResultDto> {
    if (!url) {
      throw new BadRequestException('URL query parameter is required');
    }

    this.logger.log(`Deleting file: ${url}`);

    return this.storageService.delete(url);
  }
}
