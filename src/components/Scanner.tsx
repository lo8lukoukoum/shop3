import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  active: boolean;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, active }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (active && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText);
        },
        (error) => {
          // console.warn(error);
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner", error);
        });
        scannerRef.current = null;
      }
    };
  }, [active, onScan]);

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div id="reader" className="w-full"></div>
      {!active && (
        <div className="p-8 text-center text-zinc-500">
          扫描器已关闭
        </div>
      )}
    </div>
  );
};
