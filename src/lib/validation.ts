import { NextRequest, NextResponse } from 'next/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function validateId(id: string): NextResponse | null {
  if (!id || !isValidUUID(id)) {
    return NextResponse.json(
      { success: false, message: 'ID invalide (UUID attendu)' },
      { status: 400 }
    );
  }
  return null;
}

export async function safeJson<T = Record<string, unknown>>(request: NextRequest): Promise<T | NextResponse> {
  try {
    return await request.json() as T;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Corps JSON invalide' },
      { status: 400 }
    );
  }
}

export function safePagination(params: URLSearchParams): { page: number; pageSize: number } {
  const rawPage = parseInt(params.get('page') || '1', 10);
  const rawSize = parseInt(params.get('pageSize') || params.get('limit') || '50', 10);
  return {
    page: Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1,
    pageSize: Number.isFinite(rawSize) ? Math.min(200, Math.max(1, rawSize)) : 50,
  };
}

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) errors.push('Au moins 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule');
  if (!/[a-z]/.test(password)) errors.push('Au moins une minuscule');
  if (!/[0-9]/.test(password)) errors.push('Au moins un chiffre');

  return { valid: errors.length === 0, errors };
}
