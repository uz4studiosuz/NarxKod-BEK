'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Product } from '@/lib/db';
import { ProductCard, formatPrice } from '@/components/ProductCard';
import { SearchBar } from '@/components/SearchBar';
import { NumericKeypad } from '@/components/NumericKeypad';
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
  ShoppingBag,
  Hash
} from 'lucide-react';
import { playErrorBeep } from '@/lib/audio';

// Dynamic import for BarcodeScanner to ensure it runs only in client/browser (no SSR issues)
const BarcodeScanner = dynamic(
  () => import('@/components/BarcodeScanner').then(mod => mod.BarcodeScanner),
  { ssr: false }
);

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'scan' | 'search' | 'history'>('scan');
  const [searchMode, setSearchMode] = useState<'code' | 'text'>('code');
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

  // Barcode scan handler with useCallback to avoid re-renders
  const handleScanSuccess = useCallback(async (barcode: string) => {
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
  }, [saveToHistory]);

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
  }, [handleScanSuccess]);

  return (
    <main className="app-container">
      {/* Minimalist Clean Header */}
      <header className="app-header">
        <div className="brand-badge">
          <div className="brand-logo-icon">
            <ShoppingBag size={18} />
          </div>
          <div>
            <h1 className="brand-title">NarxKod BEK</h1>
            <div className="brand-subtitle">
              BEK MARKET • 11 172 tovar
            </div>
          </div>
        </div>
      </header>

      {/* Clean Minimalist Tabs */}
      <nav className="tab-bar" aria-label="Boʻlimlar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('scan');
            setCameraActive(true);
          }}
        >
          <Scan size={17} />
          <span>Skaner</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('search');
            setCameraActive(false);
          }}
        >
          <Search size={17} />
          <span>Qidiruv</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('history');
            setCameraActive(false);
          }}
        >
          <History size={17} />
          <span>Tarix {history.length > 0 ? `(${history.length})` : ''}</span>
        </button>
      </nav>

      {/* SEARCH TAB CONTENT */}
      {activeTab === 'search' && (
        <div className="content-section">
          {/* Mode Switch: Raqam (Kalkulyator) vs Soʻz (Klaviatura) */}
          <div className="search-mode-switch">
            <button
              type="button"
              className={`mode-switch-btn ${searchMode === 'code' ? 'active' : ''}`}
              onClick={() => {
                setSearchMode('code');
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <Hash size={16} />
              <span>Raqam bilan (Kod)</span>
            </button>

            <button
              type="button"
              className={`mode-switch-btn ${searchMode === 'text' ? 'active' : ''}`}
              onClick={() => {
                setSearchMode('text');
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <Search size={16} />
              <span>Soʻz bilan (Nom)</span>
            </button>
          </div>

          {searchMode === 'code' ? (
            <NumericKeypad
              value={searchQuery}
              onChange={handleSearch}
            />
          ) : (
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              onClear={() => handleSearch('')}
              isLoading={isSearching}
              placeholder="Tovar nomini yozing (masalan: orbit, non)..."
            />
          )}

          {searchQuery.trim() && (
            <div className="results-count-label">
              Natijalar: {searchResults.length} ta tovar topildi
            </div>
          )}

          {searchResults.length > 0 ? (
            <div className="search-list">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="search-item-card"
                  onClick={() => saveToHistory(item)}
                >
                  {/* 1. ASOSIY: NOMI */}
                  <div className="item-title">{item.name}</div>

                  {/* 2. ASOSIY: SOTUV NARXI */}
                  <div className="item-main-row">
                    <div className="item-price">
                      {formatPrice(item.price)} <span className="item-price-unit">soʻm</span>
                    </div>
                  </div>

                  {/* 3. IKKILAMCHI: KOD VA SHTRIX-KOD */}
                  <div className="item-meta-row">
                    <span className="item-meta-pill">Kod: {item.code || item.id}</span>
                    {item.barcodes && (
                      <span className="item-meta-pill font-mono">
                        Shtrix: {item.barcodes.split(',')[0]}
                      </span>
                    )}
                    {item.articul && (
                      <span className="item-meta-pill">Art: {item.articul}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim() && !isSearching ? (
            <div className="empty-state">
              <Package className="empty-icon" size={36} />
              <div className="empty-title">Tovar topilmadi</div>
              <div className="empty-text">
                "{searchQuery}" boʻyicha tovar topilmadi. Qidiruv kodini yoki nomini qayta tekshiring.
              </div>
            </div>
          ) : !searchQuery.trim() ? (
            <div className="empty-state">
              {searchMode === 'code' ? (
                <>
                  <Hash className="empty-icon" size={36} />
                  <div className="empty-title">Raqamli kod orqali qidirish</div>
                  <div className="empty-text">
                    Kalkulyator tugmachalarini bosib tovar ichki kodini (masalan: <b>10006</b>) tering.
                  </div>
                </>
              ) : (
                <>
                  <Search className="empty-icon" size={36} />
                  <div className="empty-title">Tovar nomini qidirish</div>
                  <div className="empty-text">
                    Klaviaturadan tovar nomini yozing (masalan: <b>non</b>, <b>orbit</b>, <b>cola</b>).
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* SCANNER TAB CONTENT */}
      {activeTab === 'scan' && (
        <div className="content-section">
          <BarcodeScanner
            isActive={cameraActive}
            onToggleActive={setCameraActive}
            onScanSuccess={handleScanSuccess}
          />

          {notFoundBarcode && (
            <div className="not-found-alert">
              <AlertCircle size={20} className="alert-icon" />
              <div>
                <div className="alert-title">Tovar topilmadi</div>
                <div className="alert-desc">
                  Shtrix-kod: <code>{notFoundBarcode}</code> bazada mavjud emas.
                </div>
              </div>
            </div>
          )}

          {selectedProduct ? (
            <div className="scanned-result-wrap">
              <div className="scanned-label">Skanerlangan tovar:</div>
              <ProductCard product={selectedProduct} />
            </div>
          ) : (
            <div className="empty-state">
              <Scan className="empty-icon" size={36} />
              <div className="empty-title">Shtrix-kodni kameraga tuting</div>
              <div className="empty-text">
                Kamera tovar shtrix-kodini avtomatik taniydi va uning nomi, narxi hamda qoldigʻi chiqadi.
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB CONTENT */}
      {activeTab === 'history' && (
        <div className="content-section">
          <div className="history-header-bar">
            <span className="history-title">Koʻrilgan tovarlar tarixi</span>
            {history.length > 0 && (
              <button
                type="button"
                className="clear-btn"
                onClick={clearHistory}
              >
                <Trash2 size={13} />
                Tozalash
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div className="search-list">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="search-item-card"
                  onClick={() => {
                    setSelectedProduct(item);
                    setActiveTab('scan');
                  }}
                >
                  <div className="item-title">{item.name}</div>
                  <div className="item-main-row">
                    <div className="item-price">
                      {formatPrice(item.price)} <span className="item-price-unit">soʻm</span>
                    </div>
                  </div>
                  <div className="item-meta-row">
                    <span className="item-meta-pill">Kod: {item.code || item.id}</span>
                    {item.barcodes && (
                      <span className="item-meta-pill font-mono">
                        Shtrix: {item.barcodes.split(',')[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <History className="empty-icon" size={36} />
              <div className="empty-title">Tarix boʻsh</div>
              <div className="empty-text">
                Skaner yoki qidiruv orqali tekshirilgan tovarlar roʻyxati bu yerda saqlanadi.
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
