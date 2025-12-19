import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { StorageService, STORAGE_CONFIG } from './storage.service';
import { StorageFolder } from './enums';
import { StorageModuleConfig } from './interfaces';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

// Mock AWS SDK S3Client
jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn();
  return {
    S3Client: jest.fn(() => ({
      send: mockSend,
    })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
  };
});

describe('StorageService', () => {
  let service: StorageService;
  let s3ClientSendMock: jest.Mock;

  const mockConfig: StorageModuleConfig = {
    s3Region: 'us-east-1',
    s3Bucket: 'test-bucket',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    cdnBaseUrl: 'https://cdn.example.com',
  };

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: STORAGE_CONFIG,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);

    // Get reference to the mocked send function
    const S3ClientConstructor = S3Client as jest.MockedClass<typeof S3Client>;
    const mockInstance = S3ClientConstructor.mock.results[0]?.value;
    s3ClientSendMock = mockInstance?.send as jest.Mock;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload()', () => {
    describe('file type validation', () => {
      it('should accept valid JPEG for AVATAR folder', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'avatar.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024 * 1024, // 1MB
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.AVATAR);

        expect(result).toBeDefined();
        expect(result.mimeType).toBe('image/jpeg');
        expect(result.folder).toBe(StorageFolder.AVATAR);
      });

      it('should accept valid PNG for AVATAR folder', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'avatar.png',
          encoding: '7bit',
          mimetype: 'image/png',
          size: 1024 * 1024,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.AVATAR);

        expect(result.mimeType).toBe('image/png');
      });

      it('should accept valid WebP for AVATAR folder', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'avatar.webp',
          encoding: '7bit',
          mimetype: 'image/webp',
          size: 1024 * 1024,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.AVATAR);

        expect(result.mimeType).toBe('image/webp');
      });

      it('should reject invalid MIME type for AVATAR folder', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'document.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 1024 * 1024,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        await expect(
          service.upload(mockFile, StorageFolder.AVATAR),
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.upload(mockFile, StorageFolder.AVATAR),
        ).rejects.toThrow(
          'Invalid file type for avatar. Allowed: image/jpeg, image/png, image/webp',
        );
      });

      it('should accept valid PDF for CV folder', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'resume.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 5 * 1024 * 1024, // 5MB
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.CV);

        expect(result.mimeType).toBe('application/pdf');
        expect(result.folder).toBe(StorageFolder.CV);
      });

      it('should accept valid DOC for CV folder', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'resume.doc',
          encoding: '7bit',
          mimetype: 'application/msword',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.CV);

        expect(result.mimeType).toBe('application/msword');
      });

      it('should accept valid DOCX for CV folder', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'resume.docx',
          encoding: '7bit',
          mimetype:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 5 * 1024 * 1024,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.CV);

        expect(result.mimeType).toBe(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        );
      });

      it('should reject image for CV folder', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'image.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024 * 1024,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        await expect(service.upload(mockFile, StorageFolder.CV)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should accept valid video for POST folder', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'video.mp4',
          encoding: '7bit',
          mimetype: 'video/mp4',
          size: 10 * 1024 * 1024, // 10MB
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.POST);

        expect(result.mimeType).toBe('video/mp4');
        expect(result.folder).toBe(StorageFolder.POST);
      });

      it('should reject upload with invalid folder enum', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024 * 1024,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        // Cast invalid folder value
        const invalidFolder = 'invalid-folder' as StorageFolder;

        await expect(service.upload(mockFile, invalidFolder)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.upload(mockFile, invalidFolder)).rejects.toThrow(
          'Invalid folder: invalid-folder',
        );
      });
    });

    describe('file size validation', () => {
      it('should accept file within size limit for AVATAR (5MB)', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'avatar.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 4 * 1024 * 1024, // 4MB (under 5MB limit)
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.AVATAR);

        expect(result.size).toBe(4 * 1024 * 1024);
      });

      it('should reject file exceeding size limit for AVATAR (5MB)', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'avatar.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 6 * 1024 * 1024, // 6MB (over 5MB limit)
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        await expect(
          service.upload(mockFile, StorageFolder.AVATAR),
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.upload(mockFile, StorageFolder.AVATAR),
        ).rejects.toThrow('File too large for avatar. Max size: 5MB');
      });

      it('should accept file within size limit for CV (10MB)', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'resume.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 9 * 1024 * 1024, // 9MB (under 10MB limit)
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.CV);

        expect(result.size).toBe(9 * 1024 * 1024);
      });

      it('should reject file exceeding size limit for CV (10MB)', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'resume.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 11 * 1024 * 1024, // 11MB (over 10MB limit)
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        await expect(service.upload(mockFile, StorageFolder.CV)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.upload(mockFile, StorageFolder.CV)).rejects.toThrow(
          'File too large for cv. Max size: 10MB',
        );
      });

      it('should accept file within size limit for POST (25MB)', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'video.mp4',
          encoding: '7bit',
          mimetype: 'video/mp4',
          size: 20 * 1024 * 1024, // 20MB (under 25MB limit)
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.POST);

        expect(result.size).toBe(20 * 1024 * 1024);
      });

      it('should reject file exceeding size limit for POST (25MB)', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'video.mp4',
          encoding: '7bit',
          mimetype: 'video/mp4',
          size: 30 * 1024 * 1024, // 30MB (over 25MB limit)
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        await expect(
          service.upload(mockFile, StorageFolder.POST),
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.upload(mockFile, StorageFolder.POST),
        ).rejects.toThrow('File too large for post. Max size: 25MB');
      });
    });

    describe('S3 key generation', () => {
      it('should generate correct S3 key format with folder/timestamp_randomId.ext', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'profile.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024 * 1024,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.AVATAR);

        // Validate key format: folder/timestamp_randomId.ext
        expect(result.key).toMatch(/^avatar\/\d+_[a-z0-9]{6}\.jpg$/);
      });

      it('should preserve file extension in S3 key', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'document.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 1024 * 1024,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.CV);

        expect(result.key).toMatch(/\.pdf$/);
      });

      it('should handle file without extension by using bin fallback', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'filewithoutextension',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024 * 1024,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.AVATAR);

        // When no extension exists, use 'bin' fallback
        expect(result.key).toMatch(/^avatar\/\d+_[a-z0-9]{6}\.bin$/);
      });

      it('should use different folder prefixes correctly', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'image.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024 * 1024,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const avatarResult = await service.upload(mockFile, StorageFolder.AVATAR);
        expect(avatarResult.key).toMatch(/^avatar\//);

        const jobResult = await service.upload(mockFile, StorageFolder.JOB);
        expect(jobResult.key).toMatch(/^job\//);

        const postResult = await service.upload(mockFile, StorageFolder.POST);
        expect(postResult.key).toMatch(/^post\//);
      });
    });

    describe('S3 upload command', () => {
      it('should call S3Client.send with correct PutObjectCommand', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024 * 1024,
          buffer: Buffer.from('test-buffer-content'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        await service.upload(mockFile, StorageFolder.AVATAR);

        expect(PutObjectCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            Bucket: 'test-bucket',
            Key: expect.stringMatching(/^avatar\//),
            Body: mockFile.buffer,
            ContentType: 'image/jpeg',
          }),
        );

        expect(s3ClientSendMock).toHaveBeenCalledTimes(1);
      });

      it('should return correct UploadResultDto with CDN URL', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 102400, // 100KB
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        s3ClientSendMock.mockResolvedValue({});

        const result = await service.upload(mockFile, StorageFolder.AVATAR);

        expect(result).toEqual({
          url: expect.stringMatching(/^https:\/\/cdn\.example\.com\/avatar\//),
          key: expect.stringMatching(/^avatar\//),
          folder: StorageFolder.AVATAR,
          size: 102400,
          mimeType: 'image/jpeg',
        });
      });
    });
  });

  describe('delete()', () => {
    it('should extract key from CDN URL correctly', async () => {
      const cdnUrl = 'https://cdn.example.com/avatar/1734567890123_a1b2c3.jpg';

      s3ClientSendMock.mockResolvedValue({});

      const result = await service.delete(cdnUrl);

      expect(result.success).toBe(true);
      expect(result.deletedKey).toBe('avatar/1734567890123_a1b2c3.jpg');
    });

    it('should call S3Client.send with correct DeleteObjectCommand', async () => {
      const cdnUrl = 'https://cdn.example.com/cv/resume_file.pdf';

      s3ClientSendMock.mockResolvedValue({});

      await service.delete(cdnUrl);

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'cv/resume_file.pdf',
      });

      expect(s3ClientSendMock).toHaveBeenCalledTimes(1);
    });

    it('should handle nested folder paths in URL', async () => {
      const cdnUrl = 'https://cdn.example.com/post/2024/12/video.mp4';

      s3ClientSendMock.mockResolvedValue({});

      const result = await service.delete(cdnUrl);

      expect(result.deletedKey).toBe('post/2024/12/video.mp4');
    });

    it('should return DeleteResultDto with success status', async () => {
      const cdnUrl = 'https://cdn.example.com/job/image.png';

      s3ClientSendMock.mockResolvedValue({});

      const result = await service.delete(cdnUrl);

      expect(result).toEqual({
        success: true,
        deletedKey: 'job/image.png',
      });
    });
  });

  describe('extractKeyFromUrl()', () => {
    it('should extract key from valid HTTPS CDN URL', () => {
      const url = 'https://cdn.example.com/avatar/123_abc.jpg';
      const key = service.extractKeyFromUrl(url);

      expect(key).toBe('avatar/123_abc.jpg');
    });

    it('should extract key from HTTP CDN URL', () => {
      const url = 'http://cdn.example.com/cv/resume.pdf';
      const key = service.extractKeyFromUrl(url);

      expect(key).toBe('cv/resume.pdf');
    });

    it('should handle URL with query parameters', () => {
      const url = 'https://cdn.example.com/post/video.mp4?v=123';
      const key = service.extractKeyFromUrl(url);

      expect(key).toBe('post/video.mp4');
    });

    it('should handle URL with hash fragment', () => {
      const url = 'https://cdn.example.com/job/image.jpg#section';
      const key = service.extractKeyFromUrl(url);

      expect(key).toBe('job/image.jpg');
    });

    it('should handle nested folder paths', () => {
      const url = 'https://cdn.example.com/folder1/folder2/folder3/file.txt';
      const key = service.extractKeyFromUrl(url);

      expect(key).toBe('folder1/folder2/folder3/file.txt');
    });

    it('should throw BadRequestException for invalid URL format', () => {
      const invalidUrl = 'not-a-valid-url';

      expect(() => service.extractKeyFromUrl(invalidUrl)).toThrow(
        BadRequestException,
      );

      expect(() => service.extractKeyFromUrl(invalidUrl)).toThrow(
        `Invalid CDN URL format: ${invalidUrl}`,
      );
    });

    it('should throw BadRequestException for URL with empty pathname', () => {
      const url = 'https://cdn.example.com/';

      expect(() => service.extractKeyFromUrl(url)).toThrow(BadRequestException);

      expect(() => service.extractKeyFromUrl(url)).toThrow(
        'Invalid CDN URL: no key found',
      );
    });

    it('should throw BadRequestException for URL with only slash', () => {
      const url = 'https://cdn.example.com';

      expect(() => service.extractKeyFromUrl(url)).toThrow(BadRequestException);
    });
  });

  describe('S3 error handling', () => {
    it('should throw InternalServerErrorException when S3 upload fails', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024 * 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      s3ClientSendMock.mockRejectedValue(new Error('S3 network error'));

      await expect(
        service.upload(mockFile, StorageFolder.AVATAR),
      ).rejects.toThrow(InternalServerErrorException);

      await expect(
        service.upload(mockFile, StorageFolder.AVATAR),
      ).rejects.toThrow('Failed to upload file: S3 network error');
    });

    it('should throw InternalServerErrorException when S3 delete fails', async () => {
      const cdnUrl = 'https://cdn.example.com/avatar/test.jpg';

      s3ClientSendMock.mockRejectedValue(new Error('S3 permission denied'));

      await expect(service.delete(cdnUrl)).rejects.toThrow(
        InternalServerErrorException,
      );

      await expect(service.delete(cdnUrl)).rejects.toThrow(
        'Failed to delete file: S3 permission denied',
      );
    });
  });

  describe('config validation', () => {
    it('should throw error when s3Bucket is missing', async () => {
      const invalidConfig: StorageModuleConfig = {
        ...mockConfig,
        s3Bucket: '',
      };

      await expect(
        Test.createTestingModule({
          providers: [
            StorageService,
            { provide: STORAGE_CONFIG, useValue: invalidConfig },
          ],
        }).compile(),
      ).rejects.toThrow(
        'Storage configuration error: AWS_S3_BUCKET environment variable is required',
      );
    });

    it('should throw error when accessKeyId is missing', async () => {
      const invalidConfig: StorageModuleConfig = {
        ...mockConfig,
        accessKeyId: '',
      };

      await expect(
        Test.createTestingModule({
          providers: [
            StorageService,
            { provide: STORAGE_CONFIG, useValue: invalidConfig },
          ],
        }).compile(),
      ).rejects.toThrow(
        'Storage configuration error: AWS_ACCESS_KEY_ID environment variable is required',
      );
    });

    it('should throw error when secretAccessKey is missing', async () => {
      const invalidConfig: StorageModuleConfig = {
        ...mockConfig,
        secretAccessKey: '',
      };

      await expect(
        Test.createTestingModule({
          providers: [
            StorageService,
            { provide: STORAGE_CONFIG, useValue: invalidConfig },
          ],
        }).compile(),
      ).rejects.toThrow(
        'Storage configuration error: AWS_SECRET_ACCESS_KEY environment variable is required',
      );
    });

    it('should throw error when cdnBaseUrl is missing', async () => {
      const invalidConfig: StorageModuleConfig = {
        ...mockConfig,
        cdnBaseUrl: '',
      };

      await expect(
        Test.createTestingModule({
          providers: [
            StorageService,
            { provide: STORAGE_CONFIG, useValue: invalidConfig },
          ],
        }).compile(),
      ).rejects.toThrow(
        'Storage configuration error: CDN_BASE_URL environment variable is required',
      );
    });
  });
});
