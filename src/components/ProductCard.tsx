'use client';

import React from 'react';
import { Product } from '@/lib/db';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClose?: () => void;
}

export function formatPrice(num: number): string {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('uz-UZ').format(Math.round(num));
}

export function formatQuantity(num: number): string {
  if (num === null || num === undefined) return '0';
  if (num % 1 !== 0) {
    return num.toFixed(2);
  }
  return num.toString();
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const stockQty = product.remainder || 0;
  const isOutOfStock = stockQty <= 0;
  const isLowStock = stockQty > 0 && stockQty <= 5;
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

      {/* 2. ASOSIY: NARXI VA QOLDIQ */}
      <div className="product-primary-row">
        <div className="product-price-box">
          <span className="price-tag-sub">Sotuv narxi</span>
          <div className="price-amount-clean">
            {formatPrice(product.price)} <span className="price-unit">soʻm</span>
          </div>
        </div>

        <div className="product-stock-box">
          <span className="price-tag-sub">Doʻkondagi qoldiq</span>
          {isOutOfStock ? (
            <div className="stock-badge-clean out-of-stock">
              <AlertCircle size={14} />
              <span>0 dona (Mavjud emas)</span>
            </div>
          ) : isLowStock ? (
            <div className="stock-badge-clean low-stock">
              <AlertTriangle size={14} />
              <span>{formatQuantity(stockQty)} dona (Oz qolgan)</span>
            </div>
          ) : (
            <div className="stock-badge-clean in-stock">
              <CheckCircle2 size={14} />
              <span>{formatQuantity(stockQty)} dona mavjud</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. IKKILAMCHI MA'LUMOTLAR (Keyingi oʻrinda) */}
      <div className="product-secondary-meta">
        <div className="meta-item">
          <span className="meta-label">Kod:</span>
          <span className="meta-value">{product.code || product.id}</span>
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
