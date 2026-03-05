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
import { validatePassword } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

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

  try {
    const body = await request.json();
    const user = await getUserById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    if (body.actif !== undefined) {
      const actif = body.actif === true || body.actif === 1 || body.actif === '1';
      await updateUserActif(params.id, actif);
    }
    if (body.accesAdv !== undefined) {
      const accesAdv = body.accesAdv === true || body.accesAdv === 1 || body.accesAdv === '1';
      await updateUserAccesAdv(params.id, accesAdv);
    }
    if (body.accesAdmin !== undefined) {
      const accesAdmin = body.accesAdmin === true || body.accesAdmin === 1 || body.accesAdmin === '1';
      await updateUserAccesAdmin(params.id, accesAdmin);
    }
    if (body.password) {
      const pwdCheck = validatePassword(body.password);
      if (!pwdCheck.valid) {
        return NextResponse.json(
          { success: false, message: `Mot de passe invalide: ${pwdCheck.errors.join(', ')}` },
          { status: 400 }
        );
      }
      const hash = await bcrypt.hash(body.password, 10);
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
