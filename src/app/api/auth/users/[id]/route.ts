import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { requireAdmin } from '@/lib/auth/middleware';
import {
  getUserById,
  updateUserActif,
  updateUserAccesAdv,
  updateUserAccesAdmin,
  updateUserPassword,
} from '@/lib/db/queries/users';
import { validateId, validatePassword, safeJson } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const invalid = validateId(params.id);
  if (invalid) return invalid;

  try {
    const user = await getUserById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    const { mot_de_passe_hash: _, ...safe } = user;
    return NextResponse.json({ success: true, data: safe });
  } catch (error) {
    console.error('GET /api/auth/users/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const invalid = validateId(params.id);
  if (invalid) return invalid;

  try {
    const body = await safeJson(request);
    if (body instanceof NextResponse) return body;

    const data = body as Record<string, unknown>;
    const user = await getUserById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    if (data.actif !== undefined) {
      const actif = data.actif === true || data.actif === 1 || data.actif === '1';
      await updateUserActif(params.id, actif);
    }
    if (data.accesAdv !== undefined) {
      const accesAdv = data.accesAdv === true || data.accesAdv === 1 || data.accesAdv === '1';
      await updateUserAccesAdv(params.id, accesAdv);
    }
    if (data.accesAdmin !== undefined) {
      const accesAdmin = data.accesAdmin === true || data.accesAdmin === 1 || data.accesAdmin === '1';
      await updateUserAccesAdmin(params.id, accesAdmin);
    }
    if (typeof data.password === 'string' && data.password) {
      const pwdCheck = validatePassword(data.password);
      if (!pwdCheck.valid) {
        return NextResponse.json(
          { success: false, message: `Mot de passe invalide: ${pwdCheck.errors.join(', ')}` },
          { status: 400 }
        );
      }
      const hash = await bcrypt.hash(data.password, 10);
      await updateUserPassword(params.id, hash);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/auth/users/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
