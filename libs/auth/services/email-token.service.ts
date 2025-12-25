import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

export function generateEmailVerificationToken() {
  const rawToken = randomBytes(32).toString('hex');

  const hashedToken = createHash('sha256')
    .update(rawToken)
    .digest('hex');

  return {
    rawToken,
    hashedToken
  };
}
export function hashEmailVerificationToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
