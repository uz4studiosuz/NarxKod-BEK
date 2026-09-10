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

      {/* 3. KODLARI: NARXNING TAGIDA (Ichki kod va Shtrix-kodi) */}
      <div className="product-codes-row">
        <div className="code-card">
          <span className="code-card-label">Ichki kod</span>
          <span className="code-card-val font-mono">{product.code || product.id}</span>
        </div>

        <div className="code-card">
          <span className="code-card-label">Shtrix-kod</span>
          <span className="code-card-val font-mono">
            {barcodesList.length > 0 ? barcodesList[0] : '-'}
          </span>
        </div>
      </div>

      {/* Qoʻshimcha maʼlumotlar (agar artikul yoki boshqa shtrix-kodlar boʻlsa) */}
      {(product.articul || barcodesList.length > 1) && (
        <div className="product-extra-meta">
          {product.articul && (
            <div className="extra-meta-item">
              <span className="extra-meta-label">Artikul:</span>
              <span className="extra-meta-val">{product.articul}</span>
            </div>
          )}
          {barcodesList.length > 1 && (
            <div className="extra-meta-item">
              <span className="extra-meta-label">Qoʻshimcha shtrix-kodlar:</span>
              <span className="extra-meta-val font-mono">{barcodesList.slice(1).join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {product.deleted === 1 && (
        <div className="product-archived-notice">
          Eslatma: Ushbu tovar bazada arxivlangan deb belgilangan
        </div>
      )}
    </div>
  );
};
