import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

/**
 * Token Revocation Service
 * Uses Redis to track revoked tokens for logout/invalidation
 *
 * Key patterns:
 * - revoked:access:{jti} - Revoked access token
 * - revoked:refresh:{jti} - Revoked refresh token
 * - user:tokens:{userId} - Set of active token JTIs for a user
 */
@Injectable()
export class TokenRevocationService implements OnModuleDestroy {
  private readonly logger = new Logger(TokenRevocationService.name);

  // Key prefixes
  private readonly REVOKED_ACCESS_PREFIX = 'revoked:access:';
  private readonly REVOKED_REFRESH_PREFIX = 'revoked:refresh:';
  private readonly USER_TOKENS_PREFIX = 'user:tokens:';

  // TTLs (in seconds)
  private readonly ACCESS_TOKEN_TTL = 30 * 60; // 30 minutes
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async onModuleDestroy() {
    // Graceful shutdown - close Redis connection
    await this.redis.quit();
  }

  /**
   * Revoke an access token
   * @param jti - JWT ID (unique token identifier)
   * @param userId - User ID for tracking
   */
  async revokeAccessToken(jti: string, userId?: string): Promise<void> {
    try {
      const key = `${this.REVOKED_ACCESS_PREFIX}${jti}`;
      await this.redis.setex(key, this.ACCESS_TOKEN_TTL, '1');

      if (userId) {
        const userKey = `${this.USER_TOKENS_PREFIX}${userId}`;
        await this.redis.srem(userKey, jti);
      }

      this.logger.debug(`Access token revoked: ${jti}`);
    } catch (error) {
      this.logger.error(`Failed to revoke access token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Revoke a refresh token
   * @param jti - JWT ID (unique token identifier)
   * @param userId - User ID for tracking
   */
  async revokeRefreshToken(jti: string, userId?: string): Promise<void> {
    try {
      const key = `${this.REVOKED_REFRESH_PREFIX}${jti}`;
      await this.redis.setex(key, this.REFRESH_TOKEN_TTL, '1');

      if (userId) {
        const userKey = `${this.USER_TOKENS_PREFIX}${userId}`;
        await this.redis.srem(userKey, jti);
      }

      this.logger.debug(`Refresh token revoked: ${jti}`);
    } catch (error) {
      this.logger.error(`Failed to revoke refresh token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if an access token is revoked
   */
  async isAccessTokenRevoked(jti: string): Promise<boolean> {
    try {
      const key = `${this.REVOKED_ACCESS_PREFIX}${jti}`;
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Failed to check access token revocation: ${error.message}`,
      );
      // Fail-safe: if Redis is down, don't block valid tokens
      return false;
    }
  }

  /**
   * Check if a refresh token is revoked
   */
  async isRefreshTokenRevoked(jti: string): Promise<boolean> {
    try {
      const key = `${this.REVOKED_REFRESH_PREFIX}${jti}`;
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Failed to check refresh token revocation: ${error.message}`,
      );
      // Fail-safe: if Redis is down, don't block valid tokens
      return false;
    }
  }

  /**
   * Revoke all tokens for a user (logout from all devices)
   * @param userId - User ID
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const userKey = `${this.USER_TOKENS_PREFIX}${userId}`;
      const jtis = await this.redis.smembers(userKey);

      if (jtis.length > 0) {
        const pipeline = this.redis.pipeline();

        // Revoke all access and refresh tokens
        for (const jti of jtis) {
          pipeline.setex(
            `${this.REVOKED_ACCESS_PREFIX}${jti}`,
            this.ACCESS_TOKEN_TTL,
            '1',
          );
          pipeline.setex(
            `${this.REVOKED_REFRESH_PREFIX}${jti}`,
            this.REFRESH_TOKEN_TTL,
            '1',
          );
        }

        // Clear user's token set
        pipeline.del(userKey);

        await pipeline.exec();
        this.logger.debug(
          `Revoked ${jtis.length} tokens for user: ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to revoke all user tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Register a new token for a user
   * @param jti - JWT ID
   * @param userId - User ID
   */
  async registerToken(jti: string, userId: string): Promise<void> {
    try {
      const userKey = `${this.USER_TOKENS_PREFIX}${userId}`;
      await this.redis.sadd(userKey, jti);
      // Set TTL on the user's token set (max refresh token lifetime)
      await this.redis.expire(userKey, this.REFRESH_TOKEN_TTL);
    } catch (error) {
      this.logger.error(`Failed to register token: ${error.message}`);
      // Non-critical, don't throw
    }
  }

  /**
   * Get count of active tokens for a user
   */
  async getActiveTokenCount(userId: string): Promise<number> {
    try {
      const userKey = `${this.USER_TOKENS_PREFIX}${userId}`;
      return await this.redis.scard(userKey);
    } catch (error) {
      this.logger.error(
        `Failed to get active token count: ${error.message}`,
      );
      return 0;
    }
  }
}
