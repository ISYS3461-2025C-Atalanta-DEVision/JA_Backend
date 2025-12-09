import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let configService: ConfigService;

  const createMockExecutionContext = (headers: Record<string, string> = {}): ExecutionContext => {
    const mockRequest = {
      headers,
      ip: '127.0.0.1',
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
  };

  describe('when API_KEY is configured', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeyGuard,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'API_KEY') return 'test-api-key-12345';
                return undefined;
              }),
            },
          },
        ],
      }).compile();

      guard = module.get<ApiKeyGuard>(ApiKeyGuard);
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should allow request with valid API key', () => {
      const context = createMockExecutionContext({
        'x-api-key': 'test-api-key-12345',
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      const request = context.switchToHttp().getRequest();
      expect(request.apiKeyAuth).toBe(true);
      expect(request.authType).toBe('apiKey');
    });

    it('should reject request with invalid API key', () => {
      const context = createMockExecutionContext({
        'x-api-key': 'wrong-api-key',
      });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
      const request = context.switchToHttp().getRequest();
      expect(request.apiKeyAuth).toBeUndefined();
      expect(request.authType).toBeUndefined();
    });

    it('should reject request without API key', () => {
      const context = createMockExecutionContext({});

      const result = guard.canActivate(context);

      expect(result).toBe(false);
      const request = context.switchToHttp().getRequest();
      expect(request.apiKeyAuth).toBeUndefined();
      expect(request.authType).toBeUndefined();
    });

    it('should reject request with empty API key', () => {
      const context = createMockExecutionContext({
        'x-api-key': '',
      });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should be case-sensitive for API key validation', () => {
      const context = createMockExecutionContext({
        'x-api-key': 'TEST-API-KEY-12345', // Different case
      });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });

  describe('when API_KEY is not configured', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeyGuard,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
        ],
      }).compile();

      guard = module.get<ApiKeyGuard>(ApiKeyGuard);
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should reject request with API key when not configured', () => {
      const context = createMockExecutionContext({
        'x-api-key': 'any-api-key',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('API Key authentication not configured');
    });

    it('should reject request without API key when not configured', () => {
      const context = createMockExecutionContext({});

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });

  describe('header name handling', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeyGuard,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'API_KEY') return 'test-api-key-12345';
                return undefined;
              }),
            },
          },
        ],
      }).compile();

      guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    });

    it('should read from lowercase x-api-key header', () => {
      const context = createMockExecutionContext({
        'x-api-key': 'test-api-key-12345',
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle Express header normalization', () => {
      // Express normalizes headers to lowercase
      const context = createMockExecutionContext({
        'x-api-key': 'test-api-key-12345',
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
