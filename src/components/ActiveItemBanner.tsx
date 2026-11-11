import React from 'react';
import { X, Layers, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { InventoryItem, Language } from '../types/inventory';
import { t } from '../utils/translations';

interface ActiveItemBannerProps {
  activeItem: InventoryItem | null;
  language: Language;
  onClearActive: () => void;
  onOpenBatchModal: () => void;
  onEditItem: (item: InventoryItem) => void;
}

export const ActiveItemBanner: React.FC<ActiveItemBannerProps> = ({
  activeItem,
  language,
  onClearActive,
  onOpenBatchModal,
  onEditItem
}) => {
  if (!activeItem) {
    return (
      <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-4 transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">
              {language === 'si' ? 'සක්‍රීය භාණ්ඩයක් තෝරාගෙන නැත' : 'No Active Target Item Selected'}
            </p>
            <p className="text-[11px] text-slate-500">
              {language === 'si' 
                ? 'කරුණාකර පහතින් භාණ්ඩයක් ස්කෑන් කරන්න හෝ ලැයිස්තුවෙන් තෝරාගන්න' 
                : 'Scan or select an item below to begin serial counting'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentCount = activeItem.serials.length;
  const targetCount = activeItem.targetCount;
  const isTargetMet = typeof targetCount === 'number' && targetCount > 0 && currentCount >= targetCount;
  const progressPercent = typeof targetCount === 'number' && targetCount > 0 
    ? Math.min(100, Math.round((currentCount / targetCount) * 100)) 
    : null;

  return (
    <div className="bg-gradient-to-r from-blue-950/70 via-indigo-950/50 to-slate-900/80 border border-blue-500/40 rounded-2xl p-4 shadow-xl transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left side: Item details */}
        <div className="space-y-1.5 min-w-[200px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30 whitespace-nowrap">
              {t(language, 'activeTargetItem')}
            </span>
            <span className="font-mono text-xs font-semibold text-blue-200 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/60">
              {activeItem.code}
            </span>
            {activeItem.category && (
              <span className="text-[11px] text-slate-400">
                · {activeItem.category}
              </span>
            )}
            {activeItem.location && (
              <span className="text-[11px] text-slate-400">
                · {activeItem.location}
              </span>
            )}
          </div>
          
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>{activeItem.name}</span>
            {isTargetMet && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{t(language, 'targetMet')}</span>
              </span>
            )}
          </h2>

          {/* Progress bar if target is set */}
          {targetCount !== undefined && targetCount !== null && targetCount > 0 && (
            <div className="w-full max-w-xs space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Progress: {currentCount} / {targetCount} units</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-300 ${
                    currentCount >= targetCount ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right side: Count & Action buttons */}
        <div className="flex items-center gap-3 ml-auto sm:ml-0">
          <div className="text-right bg-slate-950/70 border border-slate-800 px-3.5 py-2 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium">
              {t(language, 'currentSerials')}
            </span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                {currentCount}
              </span>
              {typeof targetCount === 'number' && targetCount > 0 && (
                <span className="text-xs text-slate-500 font-mono">
                  / {targetCount}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={onOpenBatchModal}
              className="text-slate-300 hover:text-white px-2.5 py-1.5 text-xs bg-slate-800/80 hover:bg-slate-750 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Batch Import Serials"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Bulk Add</span>
            </button>

            <button
              onClick={onClearActive}
              className="text-slate-400 hover:text-slate-200 px-2.5 py-1.5 text-xs bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Switch Target Item"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t(language, 'changeItem')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
