import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FIREBASE_OPTIONS } from './firebase.constants';

// Mock firebase-admin before importing
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(() => ({
    auth: () => ({
      verifyIdToken: jest.fn(),
      getUser: jest.fn(),
    }),
  })),
  credential: {
    cert: jest.fn(),
  },
  app: jest.fn(),
}));

describe('FirebaseService', () => {
  let service: FirebaseService;

  describe('when not configured', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FirebaseService,
          {
            provide: FIREBASE_OPTIONS,
            useValue: {
              projectId: '',
              clientEmail: '',
              privateKey: '',
            },
          },
        ],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);
      service.onModuleInit();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should not be configured with empty credentials', () => {
      expect(service.isConfigured()).toBe(false);
    });

    it('should throw UnauthorizedException when verifying token without config', async () => {
      await expect(service.verifyIdToken('test-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('when configured', () => {
    let mockVerifyIdToken: jest.Mock;
    let mockGetUser: jest.Mock;

    beforeEach(async () => {
      // Reset mocks
      jest.clearAllMocks();

      mockVerifyIdToken = jest.fn();
      mockGetUser = jest.fn();

      // Update the mock to return our controlled functions
      const admin = require('firebase-admin');
      admin.apps = [];
      admin.initializeApp.mockReturnValue({
        auth: () => ({
          verifyIdToken: mockVerifyIdToken,
          getUser: mockGetUser,
        }),
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FirebaseService,
          {
            provide: FIREBASE_OPTIONS,
            useValue: {
              projectId: 'test-project',
              clientEmail: 'test@test.iam.gserviceaccount.com',
              privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
            },
          },
        ],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);
      service.onModuleInit();
    });

    it('should be configured with valid credentials', () => {
      expect(service.isConfigured()).toBe(true);
    });

    it('should verify valid ID token and return user info', async () => {
      const mockDecodedToken = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
        email_verified: true,
      };

      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const result = await service.verifyIdToken('valid-token');

      expect(result).toEqual({
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
        emailVerified: true,
      });
    });

    it('should handle token without name by using email prefix', async () => {
      const mockDecodedToken = {
        uid: 'firebase-uid-123',
        email: 'john@example.com',
        email_verified: true,
      };

      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const result = await service.verifyIdToken('valid-token');

      expect(result.name).toBe('john');
    });

    it('should throw UnauthorizedException on expired token', async () => {
      const error = new Error('Token expired');
      (error as any).code = 'auth/id-token-expired';
      mockVerifyIdToken.mockRejectedValue(error);

      await expect(service.verifyIdToken('expired-token')).rejects.toThrow(
        'Firebase token expired',
      );
    });

    it('should throw UnauthorizedException on revoked token', async () => {
      const error = new Error('Token revoked');
      (error as any).code = 'auth/id-token-revoked';
      mockVerifyIdToken.mockRejectedValue(error);

      await expect(service.verifyIdToken('revoked-token')).rejects.toThrow(
        'Firebase token revoked',
      );
    });

    it('should throw UnauthorizedException on invalid token', async () => {
      const error = new Error('Invalid token');
      (error as any).code = 'auth/argument-error';
      mockVerifyIdToken.mockRejectedValue(error);

      await expect(service.verifyIdToken('invalid-token')).rejects.toThrow(
        'Invalid Firebase token',
      );
    });

    it('should throw generic error for unknown Firebase errors', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Unknown error'));

      await expect(service.verifyIdToken('bad-token')).rejects.toThrow(
        'Firebase authentication failed',
      );
    });
  });
});
