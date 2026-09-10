'use client';

import React from 'react';
import { Product } from '@/lib/db';
import { Package, Hash, Barcode as BarcodeIcon, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

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
  // If decimal like 6.047, keep decimals, else integer
  if (num % 1 !== 0) {
    return num.toFixed(2);
  }
  return num.toString();
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClose }) => {
  const stockQty = product.remainder || 0;
  const isOutOfStock = stockQty <= 0;
  const isLowStock = stockQty > 0 && stockQty <= 5;
  const barcodesList = (product.barcodes || '')
    .split(',')
    .map(b => b.trim())
    .filter(Boolean);

  let stockClass = 'in-stock';
  let stockLabel = `${formatQuantity(stockQty)} dona mavjud`;

  if (isOutOfStock) {
    stockClass = 'out-of-stock';
    stockLabel = 'Qoldiq yoʻq (0 dona)';
  } else if (isLowStock) {
    stockClass = 'low-stock';
    stockLabel = `${formatQuantity(stockQty)} dona (kam qolgan)`;
  }

  return (
    <div className="product-card">
      <div className="product-meta-row">
        <div className="badge-code">
          <Hash size={13} style={{ display: 'inline', marginRight: 2, verticalAlign: -1 }} />
          KOD: {product.code || product.id}
        </div>

        <div className={`badge-stock ${stockClass}`}>
          {isOutOfStock ? (
            <AlertCircle size={14} />
          ) : isLowStock ? (
            <Clock size={14} />
          ) : (
            <CheckCircle2 size={14} />
          )}
          {stockLabel}
        </div>
      </div>

      <h2 className="product-name">{product.name}</h2>

      <div className="price-container">
        <span className="price-label">Sotuv Narxi</span>
        <div className="price-value">
          {formatPrice(product.price)}
          <span className="price-currency">soʻm</span>
        </div>
      </div>

      <div className="product-details-grid">
        <div className="detail-pill">
          <div className="detail-label">Doʻkondagi qoldiq</div>
          <div className="detail-val" style={{ color: isOutOfStock ? '#f43f5e' : '#10b981' }}>
            {formatQuantity(stockQty)} dona
          </div>
        </div>

        <div className="detail-pill">
          <div className="detail-label">Ichki ID</div>
          <div className="detail-val">#{product.id}</div>
        </div>

        {product.articul ? (
          <div className="detail-pill" style={{ gridColumn: 'span 2' }}>
            <div className="detail-label">Artikul</div>
            <div className="detail-val">{product.articul}</div>
          </div>
        ) : null}

        {barcodesList.length > 0 && (
          <div className="detail-pill" style={{ gridColumn: 'span 2' }}>
            <div className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <BarcodeIcon size={12} />
              Shtrix-kodlar ({barcodesList.length} ta)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
              {barcodesList.map((bc, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.04em',
                    color: '#94a3b8',
                  }}
                >
                  {bc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {product.deleted === 1 && (
        <div
          style={{
            marginTop: 12,
            padding: '6px 12px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: 8,
            color: '#fb7185',
            fontSize: '0.78rem',
            textAlign: 'center',
          }}
        >
          ⚠️ Ushbu tovar bazada arxivlangan/oʻchirilgan deb belgilangan
        </div>
      )}
    </div>
  );
};
