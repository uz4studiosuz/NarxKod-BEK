'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Flashlight, RefreshCw, AlertTriangle } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { playSuccessBeep, playErrorBeep } from '@/lib/audio';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  isActive,
  onToggleActive
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraCount, setCameraCount] = useState<number>(0);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    try {
      const container = document.getElementById('scanner-reader');
      if (!container) return;

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('scanner-reader', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          verbose: false
        });
      }

      // Check cameras
      try {
        const devices = await Html5Qrcode.getCameras();
        setCameraCount(devices.length);
      } catch (e) {
        console.debug('Error listing cameras:', e);
      }

      const qrCodeSuccessCallback = (decodedText: string) => {
        const now = Date.now();
        // Prevent duplicate spam within 1.2s for identical code
        if (
          decodedText === lastScannedCodeRef.current &&
          now - lastScannedTimeRef.current < 1200
        ) {
          return;
        }

        lastScannedCodeRef.current = decodedText;
        lastScannedTimeRef.current = now;

        playSuccessBeep();
        onScanSuccess(decodedText);
      };

      const qrCodeErrorCallback = () => {
        // Normal scanning frame misses, ignore
      };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.333333
        },
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );

      isRunningRef.current = true;

      // Check torch capability
      try {
        const capabilities = scannerRef.current.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setHasTorch(true);
        }
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Camera start error:', err);
      let msg = 'Kameraga ulanishda xatolik yuz berdi.';
      if (err?.name === 'NotAllowedError' || err?.toString().includes('Permission denied')) {
        msg = 'Kameradan foydalanishga ruxsat berilmadi. Iltimos brauzer sozlamalaridan kamera ruxsatini yoqing.';
      } else if (err?.name === 'NotFoundError') {
        msg = 'Qurilmada kamera topilmadi.';
      }
      setCameraError(msg);
      isRunningRef.current = false;
      onToggleActive(false);
    }
  }, [onScanSuccess, onToggleActive]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
        isRunningRef.current = false;
        setTorchOn(false);
      } catch (err) {
        console.error('Scanner stop error:', err);
      }
    }
  }, []);

  const toggleTorch = async () => {
    if (!scannerRef.current || !isRunningRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any]
      });
      setTorchOn(nextState);
    } catch (e) {
      console.error('Torch error:', e);
    }
  };

  useEffect(() => {
    if (isActive) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive, startScanner, stopScanner]);

  return (
    <div className="scanner-card">
      <div className="scanner-viewport">
        <div id="scanner-reader" className="scanner-video-container" />

        {isActive && !cameraError && (
          <div className="laser-guide">
            <div className="laser-box">
              <div className="laser-beam" />
            </div>
          </div>
        )}

        {cameraError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              textAlign: 'center',
              background: 'rgba(10, 13, 20, 0.95)',
              color: '#f87171'
            }}
          >
            <AlertTriangle size={36} style={{ marginBottom: 10 }} />
            <p style={{ fontSize: '0.9rem', lineHeight: 1.4, color: '#fca5a5' }}>
              {cameraError}
            </p>
          </div>
        )}

        {!isActive && !cameraError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(18, 24, 38, 0.9)',
              gap: 12
            }}
          >
            <CameraOff size={36} style={{ color: '#64748b' }} />
            <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
              Kamera toʻxtatilgan
            </p>
          </div>
        )}
      </div>

      <div className="scanner-controls">
        <button
          type="button"
          className="control-btn"
          onClick={() => onToggleActive(!isActive)}
        >
          {isActive ? (
            <>
              <CameraOff size={16} /> Kamerani toʻxtatish
            </>
          ) : (
            <>
              <Camera size={16} /> Kamerani yoqish
            </>
          )}
        </button>

        {hasTorch && isActive && (
          <button
            type="button"
            className={`control-btn ${torchOn ? 'active' : ''}`}
            onClick={toggleTorch}
            title="Fonar / Chiroq"
          >
            <Flashlight size={16} /> {torchOn ? 'Chiroq: Yoniq' : 'Chiroq'}
          </button>
        )}
      </div>
    </div>
  );
};
