import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseMongoRepository } from "./base.repository";
import { OAuthAccount } from "../schemas";
import { IOAuthAccountRepository, TokenData } from "../interfaces";

@Injectable()
export class OAuthAccountRepository
  extends BaseMongoRepository<OAuthAccount>
  implements IOAuthAccountRepository
{
  constructor(
    @InjectModel(OAuthAccount.name)
    model: Model<OAuthAccount>,
  ) {
    super(model);
  }

  async findByProviderAndId(
    provider: string,
    providerId: string,
  ): Promise<OAuthAccount | null> {
    return (await this.model
      .findOne({ provider, providerId })
      .lean()
      .exec()) as OAuthAccount | null;
  }

  async findByApplicantId(applicantId: string): Promise<OAuthAccount[]> {
    return (await this.model
      .find({ applicantId })
      .lean()
      .exec()) as OAuthAccount[];
  }

  async findByApplicantIdAndProvider(
    applicantId: string,
    provider: string,
  ): Promise<OAuthAccount | null> {
    return (await this.model
      .findOne({ applicantId, provider })
      .lean()
      .exec()) as OAuthAccount | null;
  }

  async findByEmail(email: string): Promise<OAuthAccount[]> {
    return (await this.model.find({ email }).lean().exec()) as OAuthAccount[];
  }

  /**
   * Store tokens for a applicant's provider account
   * Creates account if not exists, updates if exists
   */
  async storeTokens(
    applicantId: string,
    provider: string,
    tokenData: TokenData,
  ): Promise<void> {
    const existing = await this.findByApplicantIdAndProvider(
      applicantId,
      provider,
    );

    if (existing) {
      await this.model
        .updateOne(
          { applicantId, provider },
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
        applicantId,
        provider,
        providerId: applicantId, // For email provider, use applicantId as providerId
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
    applicantId: string,
    provider: string,
  ): Promise<string | null> {
    const account = await this.findByApplicantIdAndProvider(
      applicantId,
      provider,
    );
    return account?.refreshTokenHash || null;
  }

  /**
   * Clear tokens for a specific provider (logout from provider)
   */
  async clearTokens(applicantId: string, provider: string): Promise<void> {
    await this.model
      .updateOne(
        { applicantId, provider },
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
   * Clear all tokens for a applicant (logout from all providers)
   */
  async clearAllTokens(applicantId: string): Promise<void> {
    await this.model
      .updateMany(
        { applicantId },
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
    updates: Partial<OAuthAccount>,
  ): Promise<void> {
    await this.model
      .updateOne({ provider, providerId }, { $set: updates })
      .exec();
  }

  /**
   * Update oauth account by applicantId and provider
   * Used to sync providerId (Firebase UID) and profile updates
   */
  async updateByApplicantAndProvider(
    applicantId: string,
    provider: string,
    updates: Partial<OAuthAccount>,
  ): Promise<void> {
    await this.model
      .updateOne({ applicantId, provider }, { $set: updates })
      .exec();
  }

  async deleteByProvider(
    provider: string,
    providerId: string,
  ): Promise<boolean> {
    const result = await this.model.deleteOne({ provider, providerId }).exec();
    return result.deletedCount > 0;
  }
}
