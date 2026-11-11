import React, { useState, useRef, useEffect } from 'react';
import { Keyboard, Barcode, Hash, Check, Plus, Layers, Sparkles } from 'lucide-react';
import { InventoryItem, Language } from '../types/inventory';
import { t } from '../utils/translations';

interface ManualInputSectionProps {
  language: Language;
  activeItem: InventoryItem | null;
  inventory: InventoryItem[];
  onSubmitItem: (code: string, name: string, category?: string) => void;
  onSubmitSerial: (serial: string) => void;
  onOpenBatchModal: () => void;
  focusSerialTrigger?: number;
}

export const ManualInputSection: React.FC<ManualInputSectionProps> = ({
  language,
  activeItem,
  inventory,
  onSubmitItem,
  onSubmitSerial,
  onOpenBatchModal,
  focusSerialTrigger
}) => {
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [serialInput, setSerialInput] = useState('');
  const [suggestions, setSuggestions] = useState<InventoryItem[]>([]);

  const itemCodeInputRef = useRef<HTMLInputElement>(null);
  const serialInputRef = useRef<HTMLInputElement>(null);

  // When active item changes or focusSerialTrigger fires, auto focus serial input
  useEffect(() => {
    if (activeItem && serialInputRef.current) {
      serialInputRef.current.focus();
    }
  }, [activeItem, focusSerialTrigger]);

  // When user types item code, auto-suggest or fill known item name
  const handleItemCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setItemCode(val);

    if (val.trim().length > 1) {
      const matches = inventory.filter(
        (i) =>
          i.code.toLowerCase().includes(val.toLowerCase()) ||
          i.name.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(matches.slice(0, 4));

      // If exact code match found, fill name
      const exact = inventory.find((i) => i.code.toLowerCase() === val.trim().toLowerCase());
      if (exact && !itemName) {
        setItemName(exact.name);
        if (exact.category) setItemCategory(exact.category);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectItemSuggestion = (item: InventoryItem) => {
    setItemCode(item.code);
    setItemName(item.name);
    if (item.category) setItemCategory(item.category);
    setSuggestions([]);
  };

  const handleItemSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedCode = itemCode.trim();
    if (!trimmedCode) return;

    onSubmitItem(trimmedCode, itemName.trim(), itemCategory.trim());
    setItemCode('');
    setItemName('');
    setItemCategory('');
    setSuggestions([]);
  };

  const handleSerialSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedSerial = serialInput.trim();
    if (!trimmedSerial) return;

    onSubmitSerial(trimmedSerial);
    setSerialInput('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Keyboard className="w-4 h-4 text-emerald-400" />
            <span>{t(language, 'manualInputTitle')}</span>
          </h2>
          {activeItem && (
            <span className="text-[11px] text-emerald-400/90 font-medium bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              Active: {activeItem.code}
            </span>
          )}
        </div>

        {/* Step 1: Item Code & Name */}
        <form onSubmit={handleItemSubmit} className="space-y-3">
          <div className="space-y-1.5 relative">
            <label className="text-xs text-slate-400 font-medium block">
              {t(language, 'itemCodeLabel')}
            </label>
            <div className="relative">
              <Barcode className="w-4 h-4 absolute left-3 top-3 text-slate-500 pointer-events-none" />
              <input
                ref={itemCodeInputRef}
                type="text"
                value={itemCode}
                onChange={handleItemCodeChange}
                placeholder={t(language, 'itemCodePlaceholder')}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden divide-y divide-slate-800">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItemSuggestion(item)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/80 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-blue-400 font-semibold mr-2">{item.code}</span>
                      <span className="text-slate-300">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.serials.length} units
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block">
                {t(language, 'itemNameLabel')}
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={t(language, 'itemNamePlaceholder')}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block">
                {t(language, 'category')} (Optional)
              </label>
              <input
                type="text"
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                placeholder="e.g. Audio, Electronics..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-750 active:scale-[0.99] border border-slate-700 text-slate-200 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>{t(language, 'setActiveBtn')}</span>
          </button>
        </form>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-600 bg-slate-900 px-2 w-max mx-auto">
            Serial Number Entry
          </div>
        </div>

        {/* Step 2: Serial Number Input */}
        <form onSubmit={handleSerialSubmit} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400 font-medium">
              {t(language, 'serialInputLabel')}
            </label>
            <button
              type="button"
              onClick={onOpenBatchModal}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3 h-3" />
              <span>{t(language, 'batchAddBtn')}</span>
            </button>
          </div>

          <div className="relative">
            <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-500 pointer-events-none" />
            <input
              ref={serialInputRef}
              type="text"
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              placeholder={t(language, 'serialPlaceholder')}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-20 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t(language, 'addSerialBtn')}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            {language === 'si' 
              ? 'Enter ඔබන්න හෝ Add ක්ලික් කරන්න. අනුපිටපත් (duplicates) ස්වයංක්‍රීයව හඳුනා ගැනේ.' 
              : 'Press Enter or click Add. Global duplicate prevention will instantly alert if serial exists.'}
          </p>
        </form>
      </div>
    </div>
  );
};
