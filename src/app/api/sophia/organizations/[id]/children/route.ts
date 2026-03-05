import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { GET_ORGANIZATIONS_CHILDREN } from '@/lib/sophia/queries';
import { requireAuth } from '@/lib/auth/middleware';
import { validateId } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  const invalid = validateId(params.id);
  if (invalid) return invalid;

  try {
    const client = getSophiaClient();
    const result = await client.executeGraphQL(GET_ORGANIZATIONS_CHILDREN, {
      parentOrganizationId: params.id,
    });

    const organizations = result?.organization?.getOrganizations?.organizations || [];

    return NextResponse.json({ success: true, data: organizations, count: organizations.length });
  } catch (error) {
    console.error(`GET /api/sophia/organizations/${params.id}/children error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
