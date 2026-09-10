'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  isLoading = false,
  placeholder = 'Tovar nomi, kodi yoki shtrix-kodi...'
}) => {
  const [localVal, setLocalVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  // Debounce input updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localVal !== value) {
        onChange(localVal);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [localVal, onChange, value]);

  const handleClear = () => {
    setLocalVal('');
    onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="search-wrapper">
      <div className="search-icon">
        {isLoading ? (
          <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Search size={20} />
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        className="search-input-box"
        placeholder={placeholder}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />

      {localVal && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={handleClear}
          aria-label="Tozalash"
        >
          <X size={16} />
        </button>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
