import jwt from 'jsonwebtoken';

export function getUserFromRequest(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { id: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}
