import { UseGuards } from '@nestjs/common';
import { ApiKeyAuth } from './api-key-auth.decorator';
import { ApiKeyOrJwtGuard } from '../guards/api-key-or-jwt.guard';

// Mock @nestjs/common
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  applyDecorators: jest.fn((...decorators) => {
    // Return a function that applies all decorators
    return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
      decorators.forEach((decorator) => {
        if (typeof decorator === 'function') {
          decorator(target, propertyKey, descriptor);
        }
      });
    };
  }),
  UseGuards: jest.fn((guard) => {
    return () => ({ guard });
  }),
}));

describe('ApiKeyAuth Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should apply UseGuards with ApiKeyOrJwtGuard', () => {
    const decorator = ApiKeyAuth();

    expect(decorator).toBeDefined();
    expect(UseGuards).toHaveBeenCalledWith(ApiKeyOrJwtGuard);
  });

  it('should be a function', () => {
    const decorator = ApiKeyAuth();

    expect(typeof decorator).toBe('function');
  });
});
