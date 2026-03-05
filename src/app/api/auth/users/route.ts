import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { requireAdmin } from '@/lib/auth/middleware';
import { getAllUsers, createUser, getUserByEmail } from '@/lib/db/queries/users';
import { isValidEmail, validatePassword } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  try {
    const users = await getAllUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('GET /api/auth/users error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { nom, email, password, accesAdv, accesAdmin } = await request.json();

    if (!nom || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nom, email et mot de passe requis' },
        { status: 400 }
      );
    }

    if (typeof nom !== 'string' || nom.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Le nom doit contenir au moins 2 caracteres' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      return NextResponse.json(
        { success: false, message: `Mot de passe invalide: ${pwdCheck.errors.join(', ')}` },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Cet email est deja utilise' },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    await createUser({
      id,
      nom: nom.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      accesAdv: accesAdv ?? false,
      accesAdmin: accesAdmin ?? false,
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/auth/users error:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
