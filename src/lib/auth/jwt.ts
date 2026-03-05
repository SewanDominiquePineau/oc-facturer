import jwt from 'jsonwebtoken';
import type { JwtPayload } from './types';

function getAccessSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET environment variable is not set');
  return s;
}

function getRefreshSecret(): string {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  return s;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getAccessSecret(), { expiresIn: '1h' });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, getRefreshSecret(), { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getAccessSecret()) as JwtPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, getRefreshSecret()) as { userId: string };
}
