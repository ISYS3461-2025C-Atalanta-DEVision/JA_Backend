/**
 * Redis PubSub Channel Constants
 */
export const REDIS_CHANNELS = {
  NOTIFICATION_REALTIME: "notification:realtime",
} as const;

export type RedisChannel = (typeof REDIS_CHANNELS)[keyof typeof REDIS_CHANNELS];
