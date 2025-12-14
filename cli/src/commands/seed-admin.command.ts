import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import { AdminApplicantRepository } from '../../../apps/admin-service/src/libs/dals/mongodb/repositories/admin-applicant.repository';
import { AdminOAuthAccountRepository } from '../../../apps/admin-service/src/libs/dals/mongodb/repositories/admin-oauth-account.repository';

interface SeedAdminOptions {
  email: string;
  password: string;
}

@Command({
  name: 'seed:admin',
  description: 'Seed an admin account with email and password',
  options: { isDefault: false },
})
@Injectable()
export class SeedAdminCommand extends CommandRunner {
  private readonly logger = new Logger(SeedAdminCommand.name);

  constructor(
    private readonly adminRepo: AdminApplicantRepository,
    private readonly oauthRepo: AdminOAuthAccountRepository,
  ) {
    super();
  }

  async run(
    passedParams: string[],
    options: SeedAdminOptions,
  ): Promise<void> {
    const { email, password } = options;

    try {
      // Validate inputs
      this.validateEmail(email);
      this.validatePassword(password);

      this.logger.log(`Seeding admin account for: ${email}`);

      // Check if admin already exists
      const existing = await this.adminRepo.findOne({ email: email.toLowerCase() });
      if (existing) {
        throw new ConflictException(`Admin with email ${email} already exists`);
      }

      // Hash password with Argon2id (same params as applicant-service)
      const passwordHash = await hash(password, {
        memoryCost: 19456, // ~19 MB (OWASP recommended)
        timeCost: 2,
        parallelism: 1,
        outputLen: 32,
      });

      // Create admin applicant
      const admin = await this.adminRepo.create({
        name: email.split('@')[0], // Use email prefix as default name
        email: email.toLowerCase(),
        passwordHash,
        emailVerified: false,
        isActive: true,
      });

      this.logger.log(`Admin created with ID: ${admin._id}`);

      // Create OAuth account for token storage (provider='email')
      await this.oauthRepo.create({
        adminId: admin._id.toString(),
        provider: 'email',
        providerId: email.toLowerCase(),
        email: email.toLowerCase(),
        name: email.split('@')[0],
      });

      this.logger.log(`OAuth account created for admin`);
      this.logger.log(`\nAdmin account seeded successfully!`);
      this.logger.log(`   Email: ${email}`);
      this.logger.log(`   ID: ${admin._id}\n`);

      process.exit(0);
    } catch (error) {
      this.logger.error(`Seed failed: ${error.message}`);

      if (error instanceof ConflictException) {
        this.logger.error(`   Duplicate email detected.`);
      }

      process.exit(1);
    }
  }

  @Option({
    flags: '--email <email>',
    description: 'Admin email address',
    required: true,
  })
  parseEmail(val: string): string {
    return val;
  }

  @Option({
    flags: '--password <password>',
    description: 'Admin password (min 8 characters)',
    required: true,
  })
  parsePassword(val: string): string {
    return val;
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * Validate password strength
   * Min 8 chars, at least one uppercase, one lowercase, one number
   */
  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      throw new Error(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    }
  }
}
