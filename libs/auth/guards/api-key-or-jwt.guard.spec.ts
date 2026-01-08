import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { ApiKeyOrJwtGuard } from "./api-key-or-jwt.guard";

describe("ApiKeyOrJwtGuard", () => {
  let guard: ApiKeyOrJwtGuard;
  let reflector: Reflector;

  const createMockExecutionContext = (
    headers: Record<string, string> = {},
    isPublic = false,
  ): ExecutionContext => {
    const mockRequest = {
      headers,
      ip: "127.0.0.1",
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    return context;
  };

  describe("API Key authentication", () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeyOrJwtGuard,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === "API_KEY") return "test-api-key-12345";
                return undefined;
              }),
            },
          },
          {
            provide: Reflector,
            useValue: {
              getAllAndOverride: jest.fn(() => false), // Not public by default
            },
          },
        ],
      }).compile();

      guard = module.get<ApiKeyOrJwtGuard>(ApiKeyOrJwtGuard);
      reflector = module.get<Reflector>(Reflector);
    });

    it("should be defined", () => {
      expect(guard).toBeDefined();
    });

    it("should allow request with valid API key (no JWT)", async () => {
      const context = createMockExecutionContext({
        "x-api-key": "test-api-key-12345",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      const request = context.switchToHttp().getRequest();
      expect(request.apiKeyAuth).toBe(true);
      expect(request.authType).toBe("apiKey");
    });

    it("should reject request with invalid API key (and no JWT)", async () => {
      const context = createMockExecutionContext({
        "x-api-key": "wrong-api-key",
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        "Invalid API Key",
      );
    });

    it("should reject request with neither API key nor JWT", async () => {
      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        "Authentication required (JWT or API Key)",
      );
    });

    it("should handle empty API key and reject", async () => {
      const context = createMockExecutionContext({
        "x-api-key": "",
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("JWT authentication fallback", () => {
    let mockSuperCanActivate: jest.SpyInstance;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeyOrJwtGuard,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === "API_KEY") return "test-api-key-12345";
                return undefined;
              }),
            },
          },
          {
            provide: Reflector,
            useValue: {
              getAllAndOverride: jest.fn(() => false),
            },
          },
        ],
      }).compile();

      guard = module.get<ApiKeyOrJwtGuard>(ApiKeyOrJwtGuard);
      reflector = module.get<Reflector>(Reflector);

      // Mock the super.canActivate method from AuthGuard('jwt')
      mockSuperCanActivate = jest
        .spyOn(
          Object.getPrototypeOf(Object.getPrototypeOf(guard)),
          "canActivate",
        )
        .mockImplementation(() => Promise.resolve(true));
    });

    afterEach(() => {
      mockSuperCanActivate.mockRestore();
    });

    it("should allow request with valid JWT (no API key)", async () => {
      const context = createMockExecutionContext({
        authorization: "Bearer valid-jwt-token",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockSuperCanActivate).toHaveBeenCalledWith(context);
      const request = context.switchToHttp().getRequest();
      expect(request.authType).toBe("jwt");
    });

    it("should prefer API key over JWT when both provided and API key is valid", async () => {
      const context = createMockExecutionContext({
        "x-api-key": "test-api-key-12345",
        authorization: "Bearer valid-jwt-token",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      // Should not call JWT validation
      expect(mockSuperCanActivate).not.toHaveBeenCalled();
      const request = context.switchToHttp().getRequest();
      expect(request.authType).toBe("apiKey");
    });

    it("should fallback to JWT when API key is invalid", async () => {
      const context = createMockExecutionContext({
        "x-api-key": "wrong-api-key",
        authorization: "Bearer valid-jwt-token",
      });

      // API key is invalid, should throw before JWT fallback
      await expect(guard.canActivate(context)).rejects.toThrow(
        "Invalid API Key",
      );
    });

    it("should reject when JWT validation fails", async () => {
      mockSuperCanActivate.mockRejectedValue(
        new UnauthorizedException("Invalid JWT"),
      );

      const context = createMockExecutionContext({
        authorization: "Bearer invalid-jwt-token",
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("public routes", () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeyOrJwtGuard,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === "API_KEY") return "test-api-key-12345";
                return undefined;
              }),
            },
          },
          {
            provide: Reflector,
            useValue: {
              getAllAndOverride: jest.fn(() => true), // Route is public
            },
          },
        ],
      }).compile();

      guard = module.get<ApiKeyOrJwtGuard>(ApiKeyOrJwtGuard);
      reflector = module.get<Reflector>(Reflector);
    });

    it("should allow public routes without authentication", async () => {
      const context = createMockExecutionContext({});

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe("API key not configured", () => {
    let mockSuperCanActivate: jest.SpyInstance;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeyOrJwtGuard,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined), // API_KEY not configured
            },
          },
          {
            provide: Reflector,
            useValue: {
              getAllAndOverride: jest.fn(() => false),
            },
          },
        ],
      }).compile();

      guard = module.get<ApiKeyOrJwtGuard>(ApiKeyOrJwtGuard);

      mockSuperCanActivate = jest
        .spyOn(
          Object.getPrototypeOf(Object.getPrototypeOf(guard)),
          "canActivate",
        )
        .mockImplementation(() => Promise.resolve(true));
    });

    afterEach(() => {
      mockSuperCanActivate.mockRestore();
    });

    it("should fallback to JWT when API key provided but not configured", async () => {
      const context = createMockExecutionContext({
        "x-api-key": "any-key",
        authorization: "Bearer valid-jwt-token",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockSuperCanActivate).toHaveBeenCalled();
    });
  });

  describe("handleRequest method", () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeyOrJwtGuard,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(),
            },
          },
          {
            provide: Reflector,
            useValue: {
              getAllAndOverride: jest.fn(() => false),
            },
          },
        ],
      }).compile();

      guard = module.get<ApiKeyOrJwtGuard>(ApiKeyOrJwtGuard);
    });

    it("should return user when provided", () => {
      const mockUser = { id: "123", email: "test@example.com" };

      const result = guard.handleRequest(null, mockUser, null);

      expect(result).toEqual(mockUser);
    });

    it("should return undefined for API key auth (no user)", () => {
      const result = guard.handleRequest(null, undefined, null);

      expect(result).toBeUndefined();
    });

    it("should throw error when error is provided", () => {
      const error = new UnauthorizedException("Test error");

      expect(() => guard.handleRequest(error, null, null)).toThrow(error);
    });
  });
});
