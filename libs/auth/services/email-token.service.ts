import { createHash, randomBytes } from 'crypto';

export function generateEmailVerificationToken() {
  const rawToken = randomBytes(32).toString('hex');

  const hashedToken = createHash('sha256')
    .update(rawToken)
    .digest('hex');

  return {
    rawToken,
    hashedToken,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
  };
}
export function hashEmailVerificationToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
