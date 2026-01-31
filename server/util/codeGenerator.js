import crypto from 'crypto';

export function generateReadableCode(prefix) {
  const token = crypto.randomBytes(4).toString('hex').toUpperCase();
  return prefix ? `${prefix}-${token}` : token;
}