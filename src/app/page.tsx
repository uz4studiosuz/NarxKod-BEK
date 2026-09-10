'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Product } from '@/lib/db';
import { ProductCard, formatPrice, formatQuantity } from '@/components/ProductCard';
import { SearchBar } from '@/components/SearchBar';
import { 
  Scan, 
  Search, 
  History, 
  Package, 
  Sparkles, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  Barcode as BarcodeIcon,
  ShoppingBag
} from 'lucide-react';
import { playErrorBeep } from '@/lib/audio';

// Dynamic import for BarcodeScanner to ensure it runs only in client/browser (no SSR issues)
const BarcodeScanner = dynamic(
  () => import('@/components/BarcodeScanner').then(mod => mod.BarcodeScanner),
  { ssr: false }
);

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'scan' | 'search' | 'history'>('scan');
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  const [history, setHistory] = useState<Product[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('narxkod_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('History parse error:', e);
    }
  }, []);

  const saveToHistory = useCallback((prod: Product) => {
    setHistory(prev => {
      const filtered = prev.filter(p => p.id !== prod.id);
      const updated = [prod, ...filtered].slice(0, 30);
      try {
        localStorage.setItem('narxkod_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('narxkod_history');
    } catch (e) {}
  };

  // Barcode scan handler
  const handleScanSuccess = async (barcode: string) => {
    setNotFoundBarcode(null);
    try {
      const res = await fetch(`/api/search?barcode=${encodeURIComponent(barcode)}`);
      const data = await res.json();

      if (data.success && data.data && data.data.length > 0) {
        const found = data.data[0];
        setSelectedProduct(found);
        saveToHistory(found);
      } else {
        setNotFoundBarcode(barcode);
        playErrorBeep();
      }
    } catch (err) {
      console.error('Scan lookup error:', err);
      setNotFoundBarcode(barcode);
      playErrorBeep();
    }
  };

  // Search input handler
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    saveToHistory(prod);
    // Switch to scan view or keep visible
    if (activeTab === 'search') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Keyboard barcode scanner support (for USB/Bluetooth physical scanners)
  const keyBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is actively typing in the search input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 100) {
        keyBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const code = keyBufferRef.current.trim();
        if (code.length >= 3) {
          handleScanSuccess(code);
        }
        keyBufferRef.current = '';
      } else if (e.key.length === 1) {
        keyBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="app-container">
      {/* Sticky Header */}
      <header className="app-header">
        <div className="brand-badge">
          <div className="brand-logo-icon">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h1 className="brand-title">NarxKod BEK</h1>
            <div className="brand-subtitle">
              <span className="live-dot" />
              BEK MARKET • 11 172 tovar
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tab-bar" aria-label="Boʻlimlar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('scan');
            setCameraActive(true);
          }}
        >
          <Scan size={18} />
          Skaner
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('search');
            setCameraActive(false);
          }}
        >
          <Search size={18} />
          Qidiruv
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('history');
            setCameraActive(false);
          }}
        >
          <History size={18} />
          Tarix ({history.length})
        </button>
      </nav>

      {/* SEARCH TAB CONTENT */}
      {activeTab === 'search' && (
        <>
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            onClear={() => handleSearch('')}
            isLoading={isSearching}
            placeholder="Tovar nomi, kodi (masalan: 10006)..."
          />

          <div className="content-section">
            {selectedProduct && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>
                  Tanlangan tovar:
                </div>
                <ProductCard product={selectedProduct} />
              </div>
            )}

            {searchQuery.trim() && (
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', padding: '0 4px', marginBottom: 4 }}>
                Natijalar: {searchResults.length} ta tovar topildi
              </div>
            )}

            {searchResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="search-result-item"
                    onClick={() => handleSelectProduct(item)}
                  >
                    <div className="result-main">
                      <div className="result-code-tag">KOD: {item.code || item.id}</div>
                      <div className="result-name">{item.name}</div>
                      {item.barcodes && (
                        <div className="result-barcode-hint">
                          Shtrix-kod: {item.barcodes.split(',')[0]}
                        </div>
                      )}
                    </div>

                    <div className="result-price-side">
                      <div className="result-price">{formatPrice(item.price)} soʻm</div>
                      <div
                        className="result-stock-sub"
                        style={{ color: item.remainder <= 0 ? '#f43f5e' : '#10b981' }}
                      >
                        {item.remainder <= 0 ? 'Qoldiq: 0' : `${formatQuantity(item.remainder)} dona`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim() && !isSearching ? (
              <div className="empty-state">
                <Package className="empty-icon" />
                <div className="empty-title">Tovar topilmadi</div>
                <div className="empty-text">
                  "{searchQuery}" soʻrovi boʻyicha hech qanday tovar topilmadi. Kod yoki nomni qayta tekshiring.
                </div>
              </div>
            ) : !searchQuery.trim() ? (
              <div className="empty-state">
                <Search className="empty-icon" />
                <div className="empty-title">Tovar qidirish</div>
                <div className="empty-text">
                  Yuqoridagi maydonga tovar nomi (masalan: <b>orbit</b>, <b>snikers</b>) yoki ichki kodini yozing.
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* SCANNER TAB CONTENT */}
      {activeTab === 'scan' && (
        <>
          <BarcodeScanner
            isActive={cameraActive}
            onToggleActive={setCameraActive}
            onScanSuccess={handleScanSuccess}
          />

          <div className="content-section">
            {notFoundBarcode && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1.5px solid rgba(244, 63, 94, 0.35)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: '#fda4af'
                }}
              >
                <AlertCircle size={22} style={{ flexShrink: 0, color: '#f43f5e' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                    Tovar topilmadi
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: 2 }}>
                    Shtrix-kod: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>{notFoundBarcode}</code> bazada mavjud emas.
                  </div>
                </div>
              </div>
            )}

            {selectedProduct ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Skanerlangan tovar natijasi:
                  </span>
                </div>
                <ProductCard product={selectedProduct} />
              </div>
            ) : (
              <div className="empty-state">
                <Scan className="empty-icon" />
                <div className="empty-title">Kamera orqali tovar shtrix-kodini nishonga oling</div>
                <div className="empty-text">
                  Shtrix-kod avtomatik tanilib, tovar narxi, kodi va doʻkondagi qoldigʻi darhol ekranda chiqadi.
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* HISTORY TAB CONTENT */}
      {activeTab === 'history' && (
        <div className="content-section history-section">
          <div className="section-header">
            <span className="section-title">Koʻrilgan tovarlar tarixi</span>
            {history.length > 0 && (
              <button
                type="button"
                className="clear-history-btn"
                onClick={clearHistory}
              >
                <Trash2 size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                Tozalash
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  className="search-result-item"
                  onClick={() => {
                    setSelectedProduct(item);
                    setActiveTab('scan');
                  }}
                >
                  <div className="result-main">
                    <div className="result-code-tag">KOD: {item.code || item.id}</div>
                    <div className="result-name">{item.name}</div>
                    <div className="result-barcode-hint">
                      {item.barcodes ? item.barcodes.split(',')[0] : 'Shtrix-kodsiz'}
                    </div>
                  </div>

                  <div className="result-price-side">
                    <div className="result-price">{formatPrice(item.price)} soʻm</div>
                    <div
                      className="result-stock-sub"
                      style={{ color: item.remainder <= 0 ? '#f43f5e' : '#10b981' }}
                    >
                      {item.remainder <= 0 ? 'Qoldiq: 0' : `${formatQuantity(item.remainder)} dona`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <History className="empty-icon" />
              <div className="empty-title">Tarix boʻsh</div>
              <div className="empty-text">
                Skaner yoki qidiruv orqali tekshirilgan tovarlar bu yerda avtomatik saqlanib boradi.
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
