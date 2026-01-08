import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { StorageModuleConfig } from "./interfaces";
import { StorageFolder } from "./enums";
import { UploadResultDto, DeleteResultDto } from "./dto";
import { FILE_VALIDATION } from "./constants";

export const STORAGE_CONFIG = "STORAGE_CONFIG";

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;

  constructor(
    @Inject(STORAGE_CONFIG)
    private readonly config: StorageModuleConfig,
  ) {
    // Validate required configuration (fail fast)
    this.validateConfig();

    this.s3Client = new S3Client({
      region: this.config.s3Region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  async upload(
    file: Express.Multer.File,
    folder: StorageFolder,
  ): Promise<UploadResultDto> {
    // Validate file type and size
    this.validateFile(file, folder);

    // Generate S3 key: {folder}/{timestamp}_{randomId}.{ext}
    const key = this.generateKey(file, folder);

    this.logger.log(`Uploading file to S3: ${key}`);

    try {
      const command = new PutObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`S3 upload failed: ${key}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
    }

    // Build CDN URL
    const url = `${this.config.cdnBaseUrl}/${key}`;

    this.logger.log(`File uploaded successfully: ${url}`);

    return {
      url,
      key,
      folder,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async delete(cdnUrl: string): Promise<DeleteResultDto> {
    const key = this.extractKeyFromUrl(cdnUrl);

    this.logger.log(`Deleting file from S3: ${key}`);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.s3Bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`S3 delete failed: ${key}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to delete file: ${error.message}`,
      );
    }

    this.logger.log(`File deleted successfully: ${key}`);

    return {
      success: true,
      deletedKey: key,
    };
  }

  extractKeyFromUrl(cdnUrl: string): string {
    // Extract S3 key from CDN URL
    // Example: https://cdn.example.com/avatar/123_abc.jpg -> avatar/123_abc.jpg
    try {
      const url = new URL(cdnUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      if (!key) {
        throw new BadRequestException("Invalid CDN URL: no key found");
      }
      return key;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Invalid CDN URL format: ${cdnUrl}`);
    }
  }

  private validateConfig(): void {
    const requiredFields = [
      { key: "s3Bucket", name: "AWS_S3_BUCKET" },
      { key: "accessKeyId", name: "AWS_ACCESS_KEY_ID" },
      { key: "secretAccessKey", name: "AWS_SECRET_ACCESS_KEY" },
      { key: "cdnBaseUrl", name: "CDN_BASE_URL" },
    ];

    for (const field of requiredFields) {
      if (!this.config[field.key as keyof StorageModuleConfig]) {
        throw new Error(
          `Storage configuration error: ${field.name} environment variable is required`,
        );
      }
    }
  }

  private validateFile(file: Express.Multer.File, folder: StorageFolder): void {
    const validation = FILE_VALIDATION[folder];

    if (!validation) {
      throw new BadRequestException(`Invalid folder: ${folder}`);
    }

    // Check MIME type
    if (!validation.mimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type for ${folder}. Allowed: ${validation.mimeTypes.join(", ")}`,
      );
    }

    // Check file size
    if (file.size > validation.maxSize) {
      const maxSizeMB = validation.maxSize / 1024 / 1024;
      throw new BadRequestException(
        `File too large for ${folder}. Max size: ${maxSizeMB}MB`,
      );
    }
  }

  private generateKey(
    file: Express.Multer.File,
    folder: StorageFolder,
  ): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    // Fix: handle files without extension properly
    const parts = file.originalname.split(".");
    const ext = parts.length > 1 ? parts.pop() : "bin";
    return `${folder}/${timestamp}_${randomId}.${ext}`;
  }
}
