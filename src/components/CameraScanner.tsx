import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Box, Hash, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ScanTarget, Language } from '../types/inventory';
import { t } from '../utils/translations';

interface CameraScannerProps {
  scanTarget: ScanTarget;
  onSetScanTarget: (target: ScanTarget) => void;
  onScanSuccess: (decodedText: string) => void;
  language: Language;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  scanTarget,
  onSetScanTarget,
  onScanSuccess,
  language
}) => {
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  // Get cameras list on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer environment/back camera if found
          const backCam = devices.find((d) => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn('Could not list cameras:', err);
      });

    return () => {
      // Cleanup on unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
        });
      }
    };
  }, []);

  const handleScan = useCallback((decodedText: string) => {
    const trimmed = decodedText.trim();
    if (!trimmed) return;

    const now = Date.now();
    // Debounce duplicate reads of the exact same code within 1500ms
    if (trimmed === lastScanRef.current.text && now - lastScanRef.current.time < 1500) {
      return;
    }

    lastScanRef.current = { text: trimmed, time: now };
    onScanSuccess(trimmed);
  }, [onScanSuccess]);

  const startScanner = async () => {
    setIsStarting(true);
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.ITF
          ],
          verbose: false
        });
      }

      const cameraConfig = selectedCameraId
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: 'environment' };

      await scannerRef.current.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.8),
              height: Math.floor(minEdge * 0.6)
            };
          },
          aspectRatio: 1.333
        },
        handleScan,
        () => {
          // Frame error (no barcode in frame) - silent
        }
      );

      setIsCameraRunning(true);
      setIsStarting(false);

      // Check torch capability
      try {
        const capabilities = scannerRef.current.getRunningTrackCapabilities();
        if (capabilities && (capabilities as unknown as { torch?: boolean }).torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: unknown) {
      console.error('Failed to start camera scanner:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setCameraError(errMsg.includes('NotAllowedError') 
        ? 'Camera permission denied. Please allow camera access in browser.' 
        : `Camera error: ${errMsg}`);
      setIsCameraRunning(false);
      setIsStarting(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsCameraRunning(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !isCameraRunning) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as MediaTrackConstraintSet]
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header bar */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center space-x-2">
            <Camera className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {t(language, 'liveScanner')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasTorch && isCameraRunning && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-1.5 rounded-lg text-xs border transition-colors ${
                  torchOn
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Toggle Torch / Flashlight"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={isCameraRunning ? stopScanner : startScanner}
              disabled={isStarting}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isCameraRunning
                  ? 'bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border-rose-700/60'
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/30'
              }`}
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : isCameraRunning ? (
                <>
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>{t(language, 'stopCamera')}</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>{t(language, 'startCamera')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Camera Selector (if multiple available) */}
        {cameras.length > 1 && !isCameraRunning && (
          <div className="mb-2.5">
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-400 focus:outline-none focus:border-blue-500"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${c.id.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Viewfinder element */}
        <div className="relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800 min-h-[220px] flex items-center justify-center">
          <div id="qr-reader" className="w-full h-full" />

          {!isCameraRunning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs p-4 text-center space-y-2 pointer-events-none">
              <CameraOff className="w-8 h-8 text-slate-600" />
              <span>{t(language, 'cameraOff')}</span>
              <span className="text-[10px] text-slate-600 max-w-[200px]">
                Click "Start Camera" to scan 1D barcodes, UPC, EAN, or QR codes
              </span>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-x-2 bottom-2 bg-red-950/90 border border-red-700/60 p-2.5 rounded-lg text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Target Mode Segmented Selector */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <label className="text-xs text-slate-400 font-semibold mb-2 block">
          {t(language, 'directScansTo')}:
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSetScanTarget('item')}
            className={`px-3 py-2 text-xs rounded-xl font-medium flex items-center justify-center space-x-2 transition cursor-pointer border ${
              scanTarget === 'item'
                ? 'border-blue-500 bg-blue-600/20 text-blue-300 shadow-sm'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{t(language, 'itemBarcodeMode')}</span>
          </button>

          <button
            type="button"
            onClick={() => onSetScanTarget('serial')}
            className={`px-3 py-2 text-xs rounded-xl font-medium flex items-center justify-center space-x-2 transition cursor-pointer border ${
              scanTarget === 'serial'
                ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300 shadow-sm'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{t(language, 'serialNumberMode')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
