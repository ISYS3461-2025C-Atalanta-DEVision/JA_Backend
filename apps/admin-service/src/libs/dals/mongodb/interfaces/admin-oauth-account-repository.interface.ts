import { IBaseMongoRepository } from "./base-repository.interface";
import { AdminOAuthAccount } from "../schemas";

export interface TokenData {
  accessToken: string;
  accessTokenExp: Date;
  refreshTokenHash: string;
  refreshTokenExp: Date;
}

export interface IAdminOAuthAccountRepository
  extends IBaseMongoRepository<AdminOAuthAccount> {
  findByProviderAndId(
    provider: string,
    providerId: string,
  ): Promise<AdminOAuthAccount | null>;
  findByAdminId(adminId: string): Promise<AdminOAuthAccount[]>;
  findByAdminIdAndProvider(
    adminId: string,
    provider: string,
  ): Promise<AdminOAuthAccount | null>;
  findByEmail(email: string): Promise<AdminOAuthAccount[]>;
  storeTokens(
    adminId: string,
    provider: string,
    tokenData: TokenData,
  ): Promise<void>;
  getRefreshTokenHash(
    adminId: string,
    provider: string,
  ): Promise<string | null>;
  clearTokens(adminId: string, provider: string): Promise<void>;
  clearAllTokens(adminId: string): Promise<void>;
  updateProfile(
    provider: string,
    providerId: string,
    updates: Partial<AdminOAuthAccount>,
  ): Promise<void>;
  updateByAdminAndProvider(
    adminId: string,
    provider: string,
    updates: Partial<AdminOAuthAccount>,
  ): Promise<void>;
  deleteByProvider(provider: string, providerId: string): Promise<boolean>;
}
