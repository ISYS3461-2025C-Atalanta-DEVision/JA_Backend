import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseMongoRepository } from './base.repository';
import { AdminOAuthAccount } from '../schemas';
import { IAdminOAuthAccountRepository, TokenData } from '../interfaces';

@Injectable()
export class AdminOAuthAccountRepository
  extends BaseMongoRepository<AdminOAuthAccount>
  implements IAdminOAuthAccountRepository
{
  constructor(
    @InjectModel(AdminOAuthAccount.name)
    model: Model<AdminOAuthAccount>,
  ) {
    super(model);
  }

  async findByProviderAndId(
    provider: string,
    providerId: string,
  ): Promise<AdminOAuthAccount | null> {
    return (await this.model
      .findOne({ provider, providerId })
      .lean()
      .exec()) as AdminOAuthAccount | null;
  }

  async findByAdminId(adminId: string): Promise<AdminOAuthAccount[]> {
    return (await this.model
      .find({ adminId })
      .lean()
      .exec()) as AdminOAuthAccount[];
  }

  async findByAdminIdAndProvider(
    adminId: string,
    provider: string,
  ): Promise<AdminOAuthAccount | null> {
    return (await this.model
      .findOne({ adminId, provider })
      .lean()
      .exec()) as AdminOAuthAccount | null;
  }

  async findByEmail(email: string): Promise<AdminOAuthAccount[]> {
    return (await this.model
      .find({ email })
      .lean()
      .exec()) as AdminOAuthAccount[];
  }

  /**
   * Store tokens for an admin's provider account
   * Creates account if not exists, updates if exists
   */
  async storeTokens(
    adminId: string,
    provider: string,
    tokenData: TokenData,
  ): Promise<void> {
    const existing = await this.findByAdminIdAndProvider(adminId, provider);

    if (existing) {
      await this.model
        .updateOne(
          { adminId, provider },
          {
            $set: {
              accessToken: tokenData.accessToken,
              accessTokenExp: tokenData.accessTokenExp,
              refreshTokenHash: tokenData.refreshTokenHash,
              refreshTokenExp: tokenData.refreshTokenExp,
              lastRefreshAt: new Date(),
            },
          },
        )
        .exec();
    } else {
      // For email provider, create OAuth account if not exists
      await this.model.create({
        adminId,
        provider,
        providerId: adminId, // For email provider, use adminId as providerId
        accessToken: tokenData.accessToken,
        accessTokenExp: tokenData.accessTokenExp,
        refreshTokenHash: tokenData.refreshTokenHash,
        refreshTokenExp: tokenData.refreshTokenExp,
        lastRefreshAt: new Date(),
      });
    }
  }

  /**
   * Get refresh token hash for validation
   */
  async getRefreshTokenHash(
    adminId: string,
    provider: string,
  ): Promise<string | null> {
    const account = await this.findByAdminIdAndProvider(adminId, provider);
    return account?.refreshTokenHash || null;
  }

  /**
   * Clear tokens for a specific provider (logout from provider)
   */
  async clearTokens(adminId: string, provider: string): Promise<void> {
    await this.model
      .updateOne(
        { adminId, provider },
        {
          $set: {
            accessToken: null,
            accessTokenExp: null,
            refreshTokenHash: null,
            refreshTokenExp: null,
          },
        },
      )
      .exec();
  }

  /**
   * Clear all tokens for an admin (logout from all providers)
   */
  async clearAllTokens(adminId: string): Promise<void> {
    await this.model
      .updateMany(
        { adminId },
        {
          $set: {
            accessToken: null,
            accessTokenExp: null,
            refreshTokenHash: null,
            refreshTokenExp: null,
          },
        },
      )
      .exec();
  }

  async updateProfile(
    provider: string,
    providerId: string,
    updates: Partial<AdminOAuthAccount>,
  ): Promise<void> {
    await this.model
      .updateOne({ provider, providerId }, { $set: updates })
      .exec();
  }

  /**
   * Update oauth account by adminId and provider
   * Used to sync providerId (Firebase UID) and profile updates
   */
  async updateByAdminAndProvider(
    adminId: string,
    provider: string,
    updates: Partial<AdminOAuthAccount>,
  ): Promise<void> {
    await this.model.updateOne({ adminId, provider }, { $set: updates }).exec();
  }

  async deleteByProvider(
    provider: string,
    providerId: string,
  ): Promise<boolean> {
    const result = await this.model
      .deleteOne({ provider, providerId })
      .exec();
    return result.deletedCount > 0;
  }
}
