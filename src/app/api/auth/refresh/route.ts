import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/db/queries/users';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import type { JwtPayload } from '@/lib/auth/types';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token requis' },
        { status: 400 }
      );
    }

    let decoded: { userId: string };
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Refresh token invalide ou expiré' },
        { status: 401 }
      );
    }

    const user = await getUserById(decoded.userId);
    if (!user || !user.actif) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur introuvable ou désactivé' },
        { status: 401 }
      );
    }

    const payload: JwtPayload = {
      userId: user.id_utilisateur,
      email: user.email_utilisateur || '',
      nom: user.nom_utilisateur || '',
      accesAdv: user.acces_adv === 1,
      accesAdmin: user.acces_admin === 1,
    };

    const newToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(user.id_utilisateur);

    return NextResponse.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('POST /api/auth/refresh error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
