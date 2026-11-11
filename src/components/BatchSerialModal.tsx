import React, { useState, useMemo } from 'react';
import { X, Layers, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { InventoryItem, Language } from '../types/inventory';
import { t } from '../utils/translations';

interface BatchSerialModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem: InventoryItem | null;
  inventory: InventoryItem[];
  onAddBatchSerials: (itemCode: string, validSerials: string[]) => void;
  language: Language;
}

export const BatchSerialModal: React.FC<BatchSerialModalProps> = ({
  isOpen,
  onClose,
  activeItem,
  inventory,
  onAddBatchSerials,
  language
}) => {
  const [inputText, setInputText] = useState('');

  if (!isOpen || !activeItem) return null;

  // Parse lines or comma separated tokens
  const parsedSerials = useMemo(() => {
    if (!inputText.trim()) return [];
    return inputText
      .split(/[\n,\r\t]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [inputText]);

  // Analyze duplicates
  const analysis = useMemo(() => {
    const valid: string[] = [];
    const duplicatesInActive: string[] = [];
    const duplicatesInOther: Array<{ serial: string; itemCode: string; itemName: string }> = [];
    const seenInBatch = new Set<string>();

    const activeSet = new Set(activeItem.serials.map((s) => s.toLowerCase()));

    // Map other items
    const otherSerialMap = new Map<string, { code: string; name: string }>();
    inventory.forEach((it) => {
      if (it.code !== activeItem.code) {
        it.serials.forEach((ser) => {
          otherSerialMap.set(ser.toLowerCase(), { code: it.code, name: it.name });
        });
      }
    });

    parsedSerials.forEach((ser) => {
      const lower = ser.toLowerCase();
      if (seenInBatch.has(lower)) {
        // Repeated within batch input
        return;
      }
      seenInBatch.add(lower);

      if (activeSet.has(lower)) {
        duplicatesInActive.push(ser);
      } else if (otherSerialMap.has(lower)) {
        const match = otherSerialMap.get(lower)!;
        duplicatesInOther.push({ serial: ser, itemCode: match.code, itemName: match.name });
      } else {
        valid.push(ser);
      }
    });

    return {
      valid,
      duplicatesInActive,
      duplicatesInOther
    };
  }, [parsedSerials, activeItem, inventory]);

  const handleImport = () => {
    if (analysis.valid.length === 0) return;
    onAddBatchSerials(activeItem.code, analysis.valid);
    setInputText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'si' ? 'තොග වශයෙන් Serials ඇතුළත් කිරීම' : 'Batch Import Serial Numbers'}
              </h3>
              <p className="text-xs text-slate-400">
                Target: <span className="text-white font-medium">{activeItem.name}</span> ({activeItem.code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1.5">
              {language === 'si' 
                ? 'Serial අංක පෙළ මෙහි Paste කරන්න (එක් පේළියකට එකක් හෝ කොමාවෙන් වෙන් කර):'
                : 'Paste serial numbers here (one per line or comma-separated):'}
            </label>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={"SN-00192841\nSN-00192842\nSN-00192843"}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 leading-relaxed placeholder:text-slate-600"
            />
          </div>

          {/* Analysis preview */}
          {parsedSerials.length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-300">
                  Total Parsed: <span className="text-white font-mono">{parsedSerials.length}</span>
                </span>
                <span className="text-emerald-400">
                  Ready to Add: <span className="font-mono">{analysis.valid.length}</span>
                </span>
              </div>

              {analysis.duplicatesInActive.length > 0 && (
                <div className="flex items-start gap-2 text-amber-400 text-[11px] pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    {analysis.duplicatesInActive.length} serials already exist in this item and will be skipped.
                  </span>
                </div>
              )}

              {analysis.duplicatesInOther.length > 0 && (
                <div className="flex items-start gap-2 text-red-400 text-[11px] pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    {analysis.duplicatesInOther.length} serials conflict with other items in inventory and will be skipped.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 flex items-center justify-end space-x-2 bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            {t(language, 'cancel')}
          </button>
          <button
            onClick={handleImport}
            disabled={analysis.valid.length === 0}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>
              {language === 'si'
                ? `Serials ${analysis.valid.length} ක් එකතු කරන්න`
                : `Import ${analysis.valid.length} Serials`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
