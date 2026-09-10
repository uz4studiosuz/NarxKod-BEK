'use client';

import React from 'react';
import { Product } from '@/lib/db';

interface ProductCardProps {
  product: Product;
  onClose?: () => void;
}

export function formatPrice(num: number): string {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('uz-UZ').format(Math.round(num));
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const barcodesList = (product.barcodes || '')
    .split(',')
    .map(b => b.trim())
    .filter(Boolean);

  return (
    <div className="product-card-clean">
      {/* 1. ASOSIY: NOMI */}
      <div className="product-header-block">
        <h2 className="product-title-main">{product.name}</h2>
      </div>

      {/* 2. ASOSIY: SOTUV NARXI */}
      <div className="product-price-highlight-card">
        <span className="price-tag-sub">Sotuv narxi</span>
        <div className="price-amount-clean">
          {formatPrice(product.price)} <span className="price-unit">soʻm</span>
        </div>
      </div>

      {/* 3. IKKILAMCHI MA'LUMOTLAR */}
      <div className="product-secondary-meta">
        <div className="meta-item">
          <span className="meta-label">Ichki kod:</span>
          <span className="meta-value font-mono">{product.code || product.id}</span>
        </div>

        {product.articul ? (
          <div className="meta-item">
            <span className="meta-label">Artikul:</span>
            <span className="meta-value">{product.articul}</span>
          </div>
        ) : null}

        {barcodesList.length > 0 && (
          <div className="meta-item barcode-item">
            <span className="meta-label">Shtrix-kod:</span>
            <span className="meta-value font-mono">
              {barcodesList.join(', ')}
            </span>
          </div>
        )}
      </div>

      {product.deleted === 1 && (
        <div className="product-archived-notice">
          Eslatma: Ushbu tovar bazada arxivlangan deb belgilangan
        </div>
      )}
    </div>
  );
};
