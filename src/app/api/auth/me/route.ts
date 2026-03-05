import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  return NextResponse.json({
    success: true,
    user: {
      id: user.userId,
      nom: user.nom,
      email: user.email,
      accesAdv: user.accesAdv,
      accesAdmin: user.accesAdmin,
    },
  });
}
