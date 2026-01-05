/**
 * Base Kafka Event interface
 * All events should extend this interface
 */
export interface IKafkaEvent<T = unknown> {
  /** Unique event identifier (UUID) */
  eventId: string;

  /** Event type identifier */
  eventType: string;

  /** ISO timestamp when event was created */
  timestamp: string;

  /** Event payload */
  payload: T;

  /** Optional metadata */
  metadata?: {
    /** Source service that produced the event */
    source?: string;
    /** Correlation ID for tracing */
    correlationId?: string;
    /** User ID who triggered the event */
    userId?: string;
    /** Retry count for failed events */
    retryCount?: number;
  };
}

/**
 * Kafka message with topic information
 */
export interface IKafkaMessage<T = unknown> {
  topic: string;
  partition?: number;
  key?: string;
  value: IKafkaEvent<T>;
  headers?: Record<string, string>;
}

/**
 * Dead Letter Queue event wrapper
 */
export interface IDLQEvent<T = unknown> {
  originalEvent: IKafkaEvent<T>;
  error: {
    message: string;
    stack?: string;
    code?: string;
  };
  failedAt: string;
  retryCount: number;
  originalTopic: string;
}
