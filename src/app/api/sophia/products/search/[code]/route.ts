import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { SEARCH_PRODUCTS } from '@/lib/sophia/queries';
import { getProductCodeVariants } from '@/lib/sophia/transform';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const productCode = decodeURIComponent(params.code);

    if (!productCode || productCode.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Code produit trop court (min 2 caracteres)' },
        { status: 400 }
      );
    }

    const variants = getProductCodeVariants(productCode);
    const client = getSophiaClient();

    const organizationId = process.env.SOPHIA_ORGANIZATION_ID;
    if (!organizationId) return NextResponse.json({ success: false, message: 'Configuration serveur manquante' }, { status: 500 });

    // Essayer chaque variante, s'arreter des qu'on a des resultats
    let products: unknown[] = [];
    let usedVariant = variants[0];

    for (const variant of variants) {
      const result = await client.executeGraphQL<{ contract?: { searchProducts?: unknown[] } }>(SEARCH_PRODUCTS, {
        organizationId,
        search: variant,
      });
      const found = result?.contract?.searchProducts || [];
      if (found.length > 0) {
        products = found;
        usedVariant = variant;
        break;
      }
    }

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      originalCode: productCode,
      transformedCode: usedVariant,
    });
  } catch (error: unknown) {
    console.error('GET /api/sophia/products/search/[code] error:', error);
    const errMsg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { success: false, message: errMsg },
      { status: 500 }
    );
  }
}
