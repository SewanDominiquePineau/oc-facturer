import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';
import type { JwtPayload } from './types';

export function requireAuth(request: NextRequest): JwtPayload | NextResponse {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Token manquant' }, { status: 401 });
  }

  try {
    return verifyAccessToken(authHeader.slice(7));
  } catch {
    return NextResponse.json({ success: false, message: 'Token invalide ou expiré' }, { status: 401 });
  }
}

export function requireAdmin(request: NextRequest): JwtPayload | NextResponse {
  const result = requireAuth(request);
  if (result instanceof NextResponse) return result;

  if (!result.accesAdmin) {
    return NextResponse.json({ success: false, message: 'Accès réservé aux administrateurs' }, { status: 403 });
  }
  return result;
}

export function requireAccesAdv(request: NextRequest): JwtPayload | NextResponse {
  const result = requireAuth(request);
  if (result instanceof NextResponse) return result;

  if (!result.accesAdv) {
    return NextResponse.json({ success: false, message: 'Accès ADV requis' }, { status: 403 });
  }
  return result;
}
