import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Hash a password using PBKDF2 with a unique salt
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against a stored PBKDF2 salt:hash string
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(':')
    if (!salt || !originalHash) return false
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'))
  } catch (err) {
    return false
  }
}
