// JWT Authentication utilities

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

// Simple JWT encode/decode (for demo purposes - use jsonwebtoken in production)
export function createToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  // Simple base64 encoding for demo
  return btoa(JSON.stringify(payload));
}

export function verifyToken(token) {
  try {
    const decoded = JSON.parse(atob(token));
    if (decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}