import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { SEARCH_PRODUCTS } from '@/lib/sophia/queries';
import { transformProductCode } from '@/lib/sophia/transform';
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

    const transformedCode = transformProductCode(productCode);
    const client = getSophiaClient();

    const result = await client.executeGraphQL<{ contract?: { searchProducts?: unknown[] } }>(SEARCH_PRODUCTS, {
      organizationId: process.env.SOPHIA_ORGANIZATION_ID!,
      search: transformedCode,
    });

    const products = result?.contract?.searchProducts || [];

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      originalCode: productCode,
      transformedCode,
    });
  } catch (error: any) {
    console.error(`GET /api/sophia/products/search/${params.code} error:`, error);
    const detail = error?.response?.data || error?.message || 'Unknown error';
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error', detail },
      { status: 500 }
    );
  }
}
