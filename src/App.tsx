import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X, 
  History, 
  Sparkles,
  QrCode,
  ScanLine
} from 'lucide-react';
import { InventoryItem, ScanTarget, Language, ScanLog, ToastMessage } from './types/inventory';
import { playAudioFeedback } from './utils/audio';
import { 
  loadStoredInventory, 
  saveStoredInventory, 
  loadStoredActiveId, 
  saveStoredActiveId, 
  loadStoredLogs, 
  saveStoredLogs, 
  loadSoundSetting, 
  saveSoundSetting, 
  loadLangSetting, 
  saveLangSetting,
  SAMPLE_INVENTORY 
} from './utils/storage';
import { t } from './utils/translations';
import { Header } from './components/Header';
import { ActiveItemBanner } from './components/ActiveItemBanner';
import { CameraScanner } from './components/CameraScanner';
import { ManualInputSection } from './components/ManualInputSection';
import { StockSummaryTable } from './components/StockSummaryTable';
import { BatchSerialModal } from './components/BatchSerialModal';
import { ItemEditModal } from './components/ItemEditModal';
import { PrintReportModal } from './components/PrintReportModal';
import { ActivityLogModal } from './components/ActivityLogModal';

export default function App() {
  // Persistence state
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadStoredInventory());
  const [activeItemId, setActiveItemId] = useState<string | null>(() => loadStoredActiveId());
  const [logs, setLogs] = useState<ScanLog[]>(() => loadStoredLogs());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadSoundSetting());
  const [language, setLanguage] = useState<Language>(() => loadLangSetting());

  // Scanner state
  const [scanTarget, setScanTarget] = useState<ScanTarget>('item');
  const [focusSerialTrigger, setFocusSerialTrigger] = useState(0);

  // Modals state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync state to LocalStorage
  useEffect(() => {
    saveStoredInventory(inventory);
  }, [inventory]);

  useEffect(() => {
    saveStoredActiveId(activeItemId);
  }, [activeItemId]);

  useEffect(() => {
    saveStoredLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveSoundSetting(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    saveLangSetting(language);
  }, [language]);

  // Active Item Helper
  const activeItem = useMemo(() => {
    if (!activeItemId) return null;
    return inventory.find((item) => item.id === activeItemId || item.code.toLowerCase() === activeItemId.toLowerCase()) || null;
  }, [inventory, activeItemId]);

  // Toast Notification Trigger
  const notify = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const addLog = useCallback((logData: Omit<ScanLog, 'id' | 'timestamp'>) => {
    const newLog: ScanLog = {
      ...logData,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs((prev) => [newLog, ...prev]);
  }, []);

  // Set / Change Active Item by Code or create new
  const handleSetItem = useCallback((rawCode: string, rawName?: string, category?: string) => {
    const code = rawCode.trim();
    if (!code) {
      notify(t(language, 'itemCodeRequired'), 'error');
      playAudioFeedback('error', soundEnabled);
      return;
    }

    const lowerCode = code.toLowerCase();
    const existingIndex = inventory.findIndex((i) => i.code.toLowerCase() === lowerCode);

    if (existingIndex >= 0) {
      // Existing item
      const item = inventory[existingIndex];
      setActiveItemId(item.id);
      setScanTarget('serial');
      notify(t(language, 'activeItemSet', { name: item.name }), 'success');
      playAudioFeedback('success', soundEnabled);
      setFocusSerialTrigger((c) => c + 1);
      addLog({
        type: 'item_selected',
        itemCode: item.code,
        itemName: item.name,
        detail: `Selected item: ${item.name}`
      });
    } else {
      // Create new item
      const name = rawName?.trim() || `Item (${code})`;
      const newItem: InventoryItem = {
        id: `item-${Date.now()}`,
        code,
        name,
        category: category?.trim() || undefined,
        serials: [],
        createdAt: new Date().toLocaleDateString(),
        updatedAt: new Date().toLocaleTimeString()
      };
      setInventory((prev) => [newItem, ...prev]);
      setActiveItemId(newItem.id);
      setScanTarget('serial');
      notify(t(language, 'activeItemSet', { name: newItem.name }), 'success');
      playAudioFeedback('success', soundEnabled);
      setFocusSerialTrigger((c) => c + 1);
      addLog({
        type: 'item_created',
        itemCode: newItem.code,
        itemName: newItem.name,
        detail: `Created new item: ${newItem.name}`
      });
    }
  }, [inventory, language, soundEnabled, notify, addLog]);

  // Clear active item
  const handleClearActive = useCallback(() => {
    setActiveItemId(null);
    setScanTarget('item');
    playAudioFeedback('click', soundEnabled);
  }, [soundEnabled]);

  // Submit Serial Number with Global Duplicate Check
  const handleSubmitSerial = useCallback((rawSerial: string) => {
    if (!activeItem) {
      notify(t(language, 'noActiveItem'), 'error');
      playAudioFeedback('error', soundEnabled);
      return;
    }

    const serial = rawSerial.trim();
    if (!serial) {
      notify(t(language, 'serialRequired'), 'error');
      playAudioFeedback('error', soundEnabled);
      return;
    }

    const lowerSerial = serial.toLowerCase();

    // 1. Check duplicate in active item
    if (activeItem.serials.some((s) => s.toLowerCase() === lowerSerial)) {
      playAudioFeedback('duplicate', soundEnabled);
      notify(t(language, 'duplicateInCurrent'), 'error');
      addLog({
        type: 'duplicate_blocked',
        itemCode: activeItem.code,
        itemName: activeItem.name,
        detail: `Duplicate serial blocked: "${serial}"`,
        isError: true
      });
      return;
    }

    // 2. Check duplicate across other items in inventory
    const duplicateInOther = inventory.find(
      (item) => item.id !== activeItem.id && item.serials.some((s) => s.toLowerCase() === lowerSerial)
    );

    if (duplicateInOther) {
      playAudioFeedback('duplicate', soundEnabled);
      notify(
        t(language, 'duplicateFoundInItem', {
          serial,
          itemName: duplicateInOther.name,
          itemCode: duplicateInOther.code
        }),
        'error'
      );
      addLog({
        type: 'duplicate_blocked',
        itemCode: activeItem.code,
        itemName: activeItem.name,
        detail: `Duplicate! "${serial}" already exists in ${duplicateInOther.name} (${duplicateInOther.code})`,
        isError: true
      });
      return;
    }

    // 3. Serial is valid! Add it to active item
    const updatedSerials = [...activeItem.serials, serial];
    const updatedItem: InventoryItem = {
      ...activeItem,
      serials: updatedSerials,
      updatedAt: new Date().toLocaleTimeString()
    };

    setInventory((prev) => prev.map((item) => (item.id === activeItem.id ? updatedItem : item)));
    playAudioFeedback('success', soundEnabled);
    notify(t(language, 'serialAddedSuccess', { serial }), 'success');
    addLog({
      type: 'serial_added',
      itemCode: activeItem.code,
      itemName: activeItem.name,
      detail: `Added serial: "${serial}" (#${updatedSerials.length})`
    });

    // Check if target count is met
    if (
      typeof activeItem.targetCount === 'number' &&
      activeItem.targetCount > 0 &&
      updatedSerials.length === activeItem.targetCount
    ) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  }, [activeItem, inventory, language, soundEnabled, notify, addLog]);

  // Camera scan dispatcher
  const handleScanSuccess = useCallback((decodedText: string) => {
    if (scanTarget === 'item') {
      handleSetItem(decodedText);
    } else {
      handleSubmitSerial(decodedText);
    }
  }, [scanTarget, handleSetItem, handleSubmitSerial]);

  // Remove individual serial
  const handleRemoveSerial = useCallback((itemCode: string, serialIndex: number) => {
    setInventory((prev) =>
      prev.map((it) => {
        if (it.code.toLowerCase() === itemCode.toLowerCase()) {
          const removedSerial = it.serials[serialIndex];
          const newSerials = [...it.serials];
          newSerials.splice(serialIndex, 1);
          notify(t(language, 'serialRemoved', { serial: removedSerial }), 'info');
          playAudioFeedback('clear', soundEnabled);
          addLog({
            type: 'serial_removed',
            itemCode: it.code,
            itemName: it.name,
            detail: `Removed serial: "${removedSerial}"`
          });
          return {
            ...it,
            serials: newSerials,
            updatedAt: new Date().toLocaleTimeString()
          };
        }
        return it;
      })
    );
  }, [language, soundEnabled, notify, addLog]);

  // Delete entire item
  const handleDeleteItem = useCallback((itemCode: string) => {
    const it = inventory.find((i) => i.code === itemCode);
    if (!it) return;

    if (window.confirm(t(language, 'confirmDeleteItem', { name: it.name, code: it.code }))) {
      setInventory((prev) => prev.filter((i) => i.code !== itemCode));
      if (activeItemId === it.id || activeItemId === it.code) {
        setActiveItemId(null);
      }
      notify(`Item "${it.name}" deleted`, 'info');
      playAudioFeedback('clear', soundEnabled);
    }
  }, [inventory, activeItemId, language, soundEnabled, notify]);

  // Save edited item
  const handleSaveItemEdit = useCallback((updated: InventoryItem) => {
    setInventory((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    notify(`Saved changes to "${updated.name}"`, 'success');
    playAudioFeedback('success', soundEnabled);
  }, [soundEnabled, notify]);

  // Batch serial import
  const handleBatchAddSerials = useCallback((itemCode: string, validSerials: string[]) => {
    setInventory((prev) =>
      prev.map((it) => {
        if (it.code.toLowerCase() === itemCode.toLowerCase()) {
          const combined = [...it.serials, ...validSerials];
          return {
            ...it,
            serials: combined,
            updatedAt: new Date().toLocaleTimeString()
          };
        }
        return it;
      })
    );
    notify(
      t(language, 'batchSuccess', {
        count: validSerials.length,
        duplicates: 0
      }),
      'success'
    );
    playAudioFeedback('success', soundEnabled);
    addLog({
      type: 'serial_added',
      itemCode,
      itemName: activeItem?.name || itemCode,
      detail: `Batch imported ${validSerials.length} serials`
    });
  }, [language, soundEnabled, activeItem, notify, addLog]);

  // Clear all inventory
  const handleClearAll = useCallback(() => {
    if (window.confirm(t(language, 'confirmClearAll'))) {
      setInventory([]);
      setActiveItemId(null);
      notify('All inventory counts cleared', 'info');
      playAudioFeedback('clear', soundEnabled);
    }
  }, [language, soundEnabled, notify]);

  // Load sample data
  const handleLoadSample = useCallback(() => {
    setInventory(SAMPLE_INVENTORY);
    setActiveItemId(SAMPLE_INVENTORY[0].id);
    notify(t(language, 'sampleLoaded'), 'success');
    playAudioFeedback('success', soundEnabled);
  }, [language, soundEnabled, notify]);

  // Restore backup
  const handleImportBackup = useCallback((imported: InventoryItem[]) => {
    setInventory(imported);
    if (imported.length > 0) {
      setActiveItemId(imported[0].id);
    }
    playAudioFeedback('success', soundEnabled);
  }, [soundEnabled]);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled((prev) => !prev)}
        inventory={inventory}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onImportBackup={handleImportBackup}
        onNotify={notify}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Active Target Item Banner */}
        <ActiveItemBanner
          activeItem={activeItem}
          language={language}
          onClearActive={handleClearActive}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          onEditItem={(item) => setEditingItem(item)}
        />

        {/* 2-Column Split: Camera Scanner & Manual Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Camera Scanner */}
          <CameraScanner
            scanTarget={scanTarget}
            onSetScanTarget={setScanTarget}
            onScanSuccess={handleScanSuccess}
            language={language}
          />

          {/* Manual Input Form */}
          <ManualInputSection
            language={language}
            activeItem={activeItem}
            inventory={inventory}
            onSubmitItem={handleSetItem}
            onSubmitSerial={handleSubmitSerial}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            focusSerialTrigger={focusSerialTrigger}
          />
        </div>

        {/* Stock Inventory Table */}
        <StockSummaryTable
          language={language}
          inventory={inventory}
          activeItem={activeItem}
          onSelectActive={(code) => handleSetItem(code)}
          onRemoveSerial={handleRemoveSerial}
          onDeleteItem={handleDeleteItem}
          onEditItem={(item) => setEditingItem(item)}
          onClearAll={handleClearAll}
          onLoadSample={handleLoadSample}
          onNotify={notify}
        />

        {/* Quick Activity Button in Footer */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-900">
          <div className="flex items-center space-x-2">
            <ScanLine className="w-3.5 h-3.5 text-blue-500/80" />
            <span>Smart Stock Counter & Serial Tracker · Web Audio & Hardware Ready</span>
          </div>

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="hover:text-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>{t(language, 'recentLogs')} ({logs.length})</span>
          </button>
        </div>
      </main>

      {/* Toast Notifications Overlay */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-xl text-xs flex items-center space-x-2.5 shadow-2xl transition-all duration-200 border animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-600 text-red-200'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span className="flex-1 font-medium">{toast.text}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Modals */}
      <BatchSerialModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        activeItem={activeItem}
        inventory={inventory}
        onAddBatchSerials={handleBatchAddSerials}
        language={language}
      />

      <ItemEditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleSaveItemEdit}
        language={language}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        inventory={inventory}
        language={language}
      />

      <ActivityLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        logs={logs}
        onClearLogs={() => setLogs([])}
        language={language}
      />
    </div>
  );
}
