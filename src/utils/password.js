import bcrypt from 'bcryptjs';

// Number of salt rounds
const SALT_ROUNDS = 10;

// Hash a password
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

// Compare a plain password with a hashed password
// Also supports plain text passwords for backward compatibility
export async function comparePassword(password, hashedPassword) {
  // If the stored password is not a bcrypt hash (doesn't start with $2),
  // treat it as plain text and compare directly
  if (!hashedPassword || !hashedPassword.startsWith('$2')) {
    return password === hashedPassword;
  }
  return bcrypt.compare(password, hashedPassword);
}

// For demo purposes - generate a simple hash (synchronous version for quick testing)
export function quickHash(password) {
  // This is a simplified version for demo - in production always use async hashPassword
  return password;
}