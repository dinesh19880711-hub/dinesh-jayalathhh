import React, { useState, useRef, useEffect } from 'react';
import { 
  Boxes, 
  FileSpreadsheet, 
  Volume2, 
  VolumeX, 
  Printer, 
  Download, 
  Upload, 
  Languages,
  ChevronDown
} from 'lucide-react';
import { Language, InventoryItem } from '../types/inventory';
import { t } from '../utils/translations';
import { exportInventoryToExcel, exportInventoryToCsv, exportBackupJson } from '../utils/export';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  inventory: InventoryItem[];
  onOpenPrintModal: () => void;
  onImportBackup: (items: InventoryItem[]) => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  soundEnabled,
  onSoundToggle,
  inventory,
  onOpenPrintModal,
  onImportBackup,
  onNotify
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExcelExport = () => {
    if (inventory.length === 0) {
      onNotify(t(language, 'exportNoData'), 'error');
      return;
    }
    exportInventoryToExcel(inventory);
    onNotify(t(language, 'exportSuccess'), 'success');
  };

  const handleCsvExport = () => {
    if (inventory.length === 0) {
      onNotify(t(language, 'exportNoData'), 'error');
      return;
    }
    exportInventoryToCsv(inventory);
    onNotify(t(language, 'csvSuccess'), 'success');
  };

  const handleJsonBackup = () => {
    if (inventory.length === 0) {
      onNotify(t(language, 'exportNoData'), 'error');
      return;
    }
    exportBackupJson(inventory);
    onNotify('Backup file downloaded', 'success');
    setMenuOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportBackup(parsed);
          onNotify(`Restored ${parsed.length} items from backup!`, 'success');
        } else {
          onNotify('Invalid backup file format.', 'error');
        }
      } catch (err) {
        onNotify('Failed to read JSON backup file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setMenuOpen(false);
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-lg border border-blue-500/30 shadow-inner">
            <Boxes className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>{t(language, 'appTitle')}</span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t(language, 'appSubtitle')}
            </p>
          </div>
        </div>

        {/* Actions Zone */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={onSoundToggle}
            className={`p-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-slate-800/80 text-blue-400 border-slate-700 hover:bg-slate-700/80'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound Feedback'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline text-[11px]">{soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Language Toggle (EN / සිංහල) */}
          <button
            onClick={() => onLanguageChange(language === 'en' ? 'si' : 'en')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5 text-blue-400" />
            <span className="tracking-wide">{language === 'en' ? 'සිංහල' : 'English'}</span>
          </button>

          {/* Print Report */}
          <button
            onClick={onOpenPrintModal}
            className="hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 items-center gap-1.5 transition-colors"
            title={t(language, 'printReport')}
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">{t(language, 'printReport')}</span>
          </button>

          {/* Backup / Restore Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="More Actions"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Data</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    handleCsvExport();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t(language, 'exportCsv')}</span>
                </button>
                <button
                  onClick={handleJsonBackup}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Backup (.json)</span>
                </button>
                <label className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Restore from Backup</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json"
                    className="hidden"
                  />
                </label>
                <div className="border-t border-slate-800 my-1"></div>
                <button
                  onClick={() => {
                    onOpenPrintModal();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 sm:hidden"
                >
                  <Printer className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t(language, 'printReport')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary Action: Excel Export */}
          <button
            onClick={handleExcelExport}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition shadow-lg shadow-emerald-950 whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>{t(language, 'exportExcel')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
