'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Flashlight, RefreshCw, AlertCircle } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { playSuccessBeep } from '@/lib/audio';

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
  const isTransitioningRef = useRef<boolean>(false);
  const onScanSuccessRef = useRef(onScanSuccess);

  // Keep latest onScanSuccess reference without triggering re-renders
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  const stopScanner = useCallback(async () => {
    if (!scannerRef.current || !isRunningRef.current) return;
    try {
      isTransitioningRef.current = true;
      await scannerRef.current.stop();
      isRunningRef.current = false;
      setTorchOn(false);
    } catch (err) {
      console.warn('Scanner stop warning:', err);
    } finally {
      isTransitioningRef.current = false;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (isRunningRef.current || isTransitioningRef.current) return;
    
    setCameraError(null);
    setIsRetrying(true);
    isTransitioningRef.current = true;

    try {
      const container = document.getElementById('scanner-reader');
      if (!container) {
        isTransitioningRef.current = false;
        setIsRetrying(false);
        return;
      }

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

      const qrCodeSuccessCallback = (decodedText: string) => {
        const now = Date.now();
        // Prevent duplicate scan within 1.5 seconds for the same barcode
        if (
          decodedText === lastScannedCodeRef.current &&
          now - lastScannedTimeRef.current < 1500
        ) {
          return;
        }

        lastScannedCodeRef.current = decodedText;
        lastScannedTimeRef.current = now;

        playSuccessBeep();
        if (onScanSuccessRef.current) {
          onScanSuccessRef.current(decodedText);
        }
      };

      const qrCodeErrorCallback = () => {
        // Continuous frame analysis misses are normal, do nothing
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
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        msg = 'Kamera boshqa ilova tomonidan band qilingan yoki brauzer uni qulflab qoʻydi. Qayta ulash tugmasini bosing.';
      }
      setCameraError(msg);
      isRunningRef.current = false;
    } finally {
      isTransitioningRef.current = false;
      setIsRetrying(false);
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

  const handleRetry = async () => {
    setCameraError(null);
    await stopScanner();
    // Small delay to allow mobile OS media stream to completely release
    setTimeout(() => {
      startScanner();
    }, 200);
  };

  useEffect(() => {
    let isMounted = true;

    if (isActive) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      isMounted = false;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return (
    <div className="scanner-card">
      <div className="scanner-viewport">
        <div id="scanner-reader" className="scanner-video-container" />

        {isActive && !cameraError && (
          <div className="scanner-reticle-overlay">
            <div className="scanner-reticle-box">
              <span className="reticle-corner top-left" />
              <span className="reticle-corner top-right" />
              <span className="reticle-corner bottom-left" />
              <span className="reticle-corner bottom-right" />
              <div className="scanner-reticle-line" />
            </div>
            <div className="scanner-hint-tag">Shtrix-kodni rom ichiga qarating</div>
          </div>
        )}

        {cameraError && (
          <div className="scanner-message-overlay error">
            <AlertCircle size={32} className="text-danger" />
            <p className="scanner-error-text">{cameraError}</p>
            <button
              type="button"
              className="scanner-retry-btn"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
              {isRetrying ? 'Ulanmoqda...' : 'Kamerani qayta ulash'}
            </button>
          </div>
        )}

        {!isActive && !cameraError && (
          <div className="scanner-message-overlay">
            <CameraOff size={32} style={{ color: 'var(--text-secondary)' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
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
              <CameraOff size={15} /> Kamerani toʻxtatish
            </>
          ) : (
            <>
              <Camera size={15} /> Kamerani yoqish
            </>
          )}
        </button>

        {hasTorch && isActive && !cameraError && (
          <button
            type="button"
            className={`control-btn ${torchOn ? 'active' : ''}`}
            onClick={toggleTorch}
            title="Chiroq"
          >
            <Flashlight size={15} /> {torchOn ? 'Chiroq: Yoniq' : 'Chiroq'}
          </button>
        )}
      </div>
    </div>
  );
};
