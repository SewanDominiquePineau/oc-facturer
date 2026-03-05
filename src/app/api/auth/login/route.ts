import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getUserByEmail, updateLastLogin } from '@/lib/db/queries/users';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { checkRateLimit, resetRateLimit } from '@/lib/auth/rate-limit';
import type { JwtPayload } from '@/lib/auth/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const rateLimitKey = `login:${email.toLowerCase()}`;
    const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey);
    if (!allowed) {
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      return NextResponse.json(
        { success: false, message: `Trop de tentatives. Reessayez dans ${Math.ceil(retryAfterSec / 60)} min.` },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      );
    }

    const user = await getUserByEmail(email);
    if (!user || !user.mot_de_passe_hash) {
      return NextResponse.json(
        { success: false, message: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    if (!user.actif) {
      return NextResponse.json(
        { success: false, message: 'Compte desactive' },
        { status: 403 }
      );
    }

    const valid = await bcrypt.compare(password, user.mot_de_passe_hash);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    resetRateLimit(rateLimitKey);

    const payload: JwtPayload = {
      userId: user.id_utilisateur,
      email: user.email_utilisateur || '',
      nom: user.nom_utilisateur || '',
      accesAdv: user.acces_adv === 1,
      accesAdmin: user.acces_admin === 1,
    };

    const token = signAccessToken(payload);
    const refreshToken = signRefreshToken(user.id_utilisateur);

    await updateLastLogin(user.id_utilisateur);

    return NextResponse.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id_utilisateur,
        nom: user.nom_utilisateur,
        email: user.email_utilisateur,
        accesAdv: user.acces_adv === 1,
        accesAdmin: user.acces_admin === 1,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
