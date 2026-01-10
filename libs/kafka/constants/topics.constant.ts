/**
 * Kafka Topics for DEVision Job Matching System
 *
 * Naming convention: {domain}.{entity}.{action}
 * - domain: subscription, profile, job, matching, notification, dlq
 * - entity: premium, ja (job applicant), jm (job manager), search-profile
 * - action: created, updated, expired, completed, pending, sent, failed
 */

// ===========================================
// Job application Topics
// ===========================================
export const TOPIC_APPLICATION_CREATED =
  "applicant_apply_job";

// ===========================================
// Subscription Topics
// ===========================================
export const TOPIC_SUBSCRIPTION_PREMIUM_JA_CREATED =
  "subscription.premium.ja.created";
export const TOPIC_SUBSCRIPTION_PREMIUM_JA_CLOSED =
  "subscription.premium.ja.closed";
export const TOPIC_SUBSCRIPTION_PREMIUM_JA_EXPIRED =
  "subscription.premium.ja.expired";

// ===========================================
// Profile Topics
// ===========================================
export const TOPIC_PROFILE_JA_SEARCH_PROFILE_CREATED =
  "profile.ja.search-profile.created";
export const TOPIC_PROFILE_JA_SEARCH_PROFILE_UPDATED =
  "profile.ja.search-profile.updated";
export const TOPIC_PROFILE_JM_SEARCH_PROFILE_CREATED =
  "profile.jm.search-profile.created";
export const TOPIC_PROFILE_JM_SEARCH_PROFILE_UPDATED =
  "profile.jm.search-profile.updated";

// ===========================================
// Job Topics
// ===========================================
export const TOPIC_JOB_CREATED = "job.created";
export const TOPIC_JOB_UPDATED = "job.updated";
