import { NextRequest, NextResponse } from 'next/server';
import { getProductByBarcode, getProductByCode, searchProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get('barcode');
    const code = searchParams.get('code');
    const query = searchParams.get('q');

    if (barcode) {
      const product = getProductByBarcode(barcode);
      return NextResponse.json({
        success: true,
        data: product ? [product] : [],
        type: 'barcode'
      });
    }

    if (code) {
      const num = parseInt(code, 10);
      if (!isNaN(num)) {
        const product = getProductByCode(num);
        return NextResponse.json({
          success: true,
          data: product ? [product] : [],
          type: 'code'
        });
      }
    }

    if (query) {
      const results = searchProducts(query);
      return NextResponse.json({
        success: true,
        data: results,
        type: 'search'
      });
    }

    return NextResponse.json({
      success: true,
      data: [],
      type: 'empty'
    });
  } catch (err: any) {
    console.error('Search API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
