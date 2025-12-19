import { StorageFolder } from '../enums';

export interface FileValidationRule {
  mimeTypes: string[];
  maxSize: number;
}

export const FILE_VALIDATION: Record<StorageFolder, FileValidationRule> = {
  [StorageFolder.AVATAR]: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  [StorageFolder.CV]: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  [StorageFolder.JOB]: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/avif'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  [StorageFolder.POST]: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'image/avif'],
    maxSize: 25 * 1024 * 1024, // 25MB
  },
};
