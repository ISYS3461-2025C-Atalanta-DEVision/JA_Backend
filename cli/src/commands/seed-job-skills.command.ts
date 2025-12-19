import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { JobCategoryRepository } from '../../../apps/job-skill-service/src/libs/dals/mongodb/repositories/job-category.repository';
import { SkillRepository } from '../../../apps/job-skill-service/src/libs/dals/mongodb/repositories/skill.repository';
import {
  JOB_CATEGORIES,
  SKILLS_BY_CATEGORY,
} from '../data/job-skills.seed';

interface SeedJobSkillsOptions {
  force?: boolean;
  categoriesOnly?: boolean;
  skillsOnly?: boolean;
}

@Command({
  name: 'seed:job-skills',
  description: 'Seed job categories and skills into the database',
  options: { isDefault: false },
})
@Injectable()
export class SeedJobSkillsCommand extends CommandRunner {
  private readonly logger = new Logger(SeedJobSkillsCommand.name);

  constructor(
    private readonly jobCategoryRepo: JobCategoryRepository,
    private readonly skillRepo: SkillRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {
    super();
  }

  async run(
    passedParams: string[],
    options: SeedJobSkillsOptions,
  ): Promise<void> {
    const { force, categoriesOnly, skillsOnly } = options;

    // Validate conflicting options
    if (categoriesOnly && skillsOnly) {
      this.logger.error('Cannot use --categories-only and --skills-only together');
      process.exit(1);
    }

    try {
      this.logger.log('🌱 Seeding Job Categories & Skills...\n');

      // Force mode: delete all existing data
      if (force) {
        this.logger.warn('⚠️  Force mode: Deleting all existing data...');
        await this.deleteAllData();
      }

      // Track statistics
      const stats = {
        categoriesCreated: 0,
        categoriesSkipped: 0,
        skillsCreated: 0,
        skillsSkipped: 0,
      };

      // Map to store category name -> id for skill creation
      const categoryIdMap = new Map<string, string>();

      // Seed categories (unless skillsOnly)
      if (!skillsOnly) {
        this.logger.log('📁 Seeding Job Categories...');
        for (const category of JOB_CATEGORIES) {
          const existing = await this.jobCategoryRepo.findByName(category.name);

          if (existing) {
            this.logger.log(`   ⏭️  Skipped: ${category.name} (exists)`);
            stats.categoriesSkipped++;
            categoryIdMap.set(category.name, existing._id.toString());
          } else {
            const created = await this.jobCategoryRepo.create({
              name: category.name,
              slug: category.slug,
              icon: category.icon,
              description: category.description,
              isActive: true,
            });
            this.logger.log(`   ✅ Created: ${category.name}`);
            stats.categoriesCreated++;
            categoryIdMap.set(category.name, created._id.toString());
          }
        }
        this.logger.log('');
      } else {
        // Skills only mode: fetch existing categories
        this.logger.log('📁 Fetching existing categories...');
        for (const category of JOB_CATEGORIES) {
          const existing = await this.jobCategoryRepo.findByName(category.name);
          if (existing) {
            categoryIdMap.set(category.name, existing._id.toString());
          }
        }
      }

      // Seed skills (unless categoriesOnly)
      if (!categoriesOnly) {
        this.logger.log('🔧 Seeding Skills...');
        for (const [categoryName, skills] of Object.entries(SKILLS_BY_CATEGORY)) {
          const categoryId = categoryIdMap.get(categoryName);

          if (!categoryId) {
            this.logger.warn(
              `   ⚠️  Category "${categoryName}" not found, skipping skills`,
            );
            continue;
          }

          for (const skill of skills) {
            const existing = await this.skillRepo.findByName(skill.name);

            if (existing) {
              this.logger.log(`   ⏭️  Skipped: ${skill.name} (exists)`);
              stats.skillsSkipped++;
            } else {
              await this.skillRepo.create({
                name: skill.name,
                jobCategoryId: categoryId,
                icon: skill.icon,
                description: skill.description,
                isActive: true,
              });
              this.logger.log(`   ✅ Created: ${skill.name} → ${categoryName}`);
              stats.skillsCreated++;
            }
          }
        }
        this.logger.log('');
      }

      // Print summary
      this.logger.log('✨ Seed completed!');
      if (!skillsOnly) {
        this.logger.log(
          `   Categories: ${stats.categoriesCreated} created, ${stats.categoriesSkipped} skipped`,
        );
      }
      if (!categoriesOnly) {
        this.logger.log(
          `   Skills: ${stats.skillsCreated} created, ${stats.skillsSkipped} skipped`,
        );
      }
      this.logger.log('');

      process.exit(0);
    } catch (error) {
      this.logger.error(`Seed failed: ${error.message}`, error.stack);
      process.exit(1);
    }
  }

  /**
   * Delete all existing job categories and skills using bulk operations
   */
  private async deleteAllData(): Promise<void> {
    // Delete skills first (foreign key dependency) - bulk delete for O(1) performance
    const skillsResult = await this.connection.collection('skills').deleteMany({});
    this.logger.log(`   Deleted ${skillsResult.deletedCount} skills`);

    // Delete categories - bulk delete
    const categoriesResult = await this.connection.collection('job-categories').deleteMany({});
    this.logger.log(`   Deleted ${categoriesResult.deletedCount} categories\n`);
  }

  @Option({
    flags: '--force',
    description: 'Delete all existing data before seeding',
  })
  parseForce(): boolean {
    return true;
  }

  @Option({
    flags: '--categories-only',
    description: 'Only seed job categories (no skills)',
  })
  parseCategoriesOnly(): boolean {
    return true;
  }

  @Option({
    flags: '--skills-only',
    description: 'Only seed skills (requires categories to exist)',
  })
  parseSkillsOnly(): boolean {
    return true;
  }
}
