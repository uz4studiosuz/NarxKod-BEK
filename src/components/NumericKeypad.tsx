'use client';

import React from 'react';
import { Delete, RotateCcw, Search, Hash } from 'lucide-react';

interface NumericKeypadProps {
  value: string;
  onChange: (val: string) => void;
  onSearch?: () => void;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  value,
  onChange,
  onSearch
}) => {
  const handleDigit = (digit: string) => {
    // Subtle haptic feedback for phone touch
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch (e) {}
    }

    if (value.length < 15) {
      const next = value + digit;
      onChange(next);
    }
  };

  const handleBackspace = () => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch (e) {}
    }
    if (value.length > 0) {
      const next = value.slice(0, -1);
      onChange(next);
    }
  };

  const handleClear = () => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch (e) {}
    }
    onChange('');
  };

  return (
    <div className="keypad-widget">
      {/* 1. Raqamli ekran / Display */}
      <div className="keypad-display">
        <div className="keypad-display-prefix">
          <Hash size={18} />
        </div>
        <div className={`keypad-display-text font-mono ${!value ? 'placeholder' : ''}`}>
          {value || 'Ichki kodni tering...'}
        </div>
        {value && (
          <button
            type="button"
            className="keypad-clear-pill"
            onClick={handleClear}
            title="Tozalash (C)"
          >
            C
          </button>
        )}
      </div>

      {/* 2. Kalkulyator tugmachalari */}
      <div className="keypad-grid">
        <button type="button" className="keypad-btn" onClick={() => handleDigit('1')}>1</button>
        <button type="button" className="keypad-btn" onClick={() => handleDigit('2')}>2</button>
        <button type="button" className="keypad-btn" onClick={() => handleDigit('3')}>3</button>

        <button type="button" className="keypad-btn" onClick={() => handleDigit('4')}>4</button>
        <button type="button" className="keypad-btn" onClick={() => handleDigit('5')}>5</button>
        <button type="button" className="keypad-btn" onClick={() => handleDigit('6')}>6</button>

        <button type="button" className="keypad-btn" onClick={() => handleDigit('7')}>7</button>
        <button type="button" className="keypad-btn" onClick={() => handleDigit('8')}>8</button>
        <button type="button" className="keypad-btn" onClick={() => handleDigit('9')}>9</button>

        <button
          type="button"
          className="keypad-btn keypad-fn-clear"
          onClick={handleClear}
          title="Tozalash"
        >
          C
        </button>

        <button type="button" className="keypad-btn" onClick={() => handleDigit('0')}>0</button>

        <button
          type="button"
          className="keypad-btn keypad-fn-delete"
          onClick={handleBackspace}
          title="Oʻchirish (Backspace)"
          disabled={!value}
        >
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
};
