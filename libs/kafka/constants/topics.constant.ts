/**
 * Kafka Topics for DEVision Job Matching System
 *
 * Naming convention: {domain}.{entity}.{action}
 * - domain: subscription, profile, job, matching, notification, dlq
 * - entity: premium, ja (job applicant), jm (job manager), search-profile
 * - action: created, updated, expired, completed, pending, sent, failed
 */

// ===========================================
// Subscription Topics
// ===========================================
export const TOPIC_SUBSCRIPTION_PREMIUM_JA_CREATED =
  'subscription.premium.ja.created';
export const TOPIC_SUBSCRIPTION_PREMIUM_JA_EXPIRED =
  'subscription.premium.ja.expired';
export const TOPIC_SUBSCRIPTION_PREMIUM_JM_CREATED =
  'subscription.premium.jm.created';
export const TOPIC_SUBSCRIPTION_PREMIUM_JM_EXPIRED =
  'subscription.premium.jm.expired';

// ===========================================
// Profile Topics
// ===========================================
export const TOPIC_PROFILE_JA_SEARCH_PROFILE_UPDATED =
  'profile.ja.search-profile.updated';
export const TOPIC_PROFILE_JM_SEARCH_PROFILE_UPDATED =
  'profile.jm.search-profile.updated';

// ===========================================
// Job Topics
// ===========================================
export const TOPIC_JOB_CREATED = 'job.created';
export const TOPIC_JOB_UPDATED = 'job.updated';
export const TOPIC_JOB_CLOSED = 'job.closed';

// ===========================================
// Matching Topics
// ===========================================
export const TOPIC_MATCHING_JM_TO_JA_COMPLETED = 'matching.jm-to-ja.completed';
export const TOPIC_MATCHING_JA_TO_JM_COMPLETED = 'matching.ja-to-jm.completed';




