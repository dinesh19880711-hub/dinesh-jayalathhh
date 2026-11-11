import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { InventoryItem, Language } from '../types/inventory';
import { t } from '../utils/translations';

interface StockSummaryTableProps {
  language: Language;
  inventory: InventoryItem[];
  activeItem: InventoryItem | null;
  onSelectActive: (code: string) => void;
  onRemoveSerial: (itemCode: string, serialIndex: number) => void;
  onDeleteItem: (itemCode: string) => void;
  onEditItem: (item: InventoryItem) => void;
  onClearAll: () => void;
  onLoadSample: () => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const StockSummaryTable: React.FC<StockSummaryTableProps> = ({
  language,
  inventory,
  activeItem,
  onSelectActive,
  onRemoveSerial,
  onDeleteItem,
  onEditItem,
  onClearAll,
  onLoadSample,
  onNotify
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'with-serials' | 'empty'>('all');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (code: string) => {
    setExpandedItems((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const expandAll = () => {
    const allExpanded = filteredItems.reduce((acc, it) => {
      acc[it.code] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedItems(allExpanded);
  };

  const collapseAll = () => {
    setExpandedItems({});
  };

  const handleCopySerials = (item: InventoryItem) => {
    if (item.serials.length === 0) return;
    const text = item.serials.join('\n');
    navigator.clipboard.writeText(text);
    onNotify(t(language, 'serialsCopied'), 'success');
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return inventory.filter((item) => {
      // Filter tab
      if (filterMode === 'with-serials' && item.serials.length === 0) return false;
      if (filterMode === 'empty' && item.serials.length > 0) return false;

      // Search text
      if (!query) return true;
      const matchCode = item.code.toLowerCase().includes(query);
      const matchName = item.name.toLowerCase().includes(query);
      const matchCategory = item.category?.toLowerCase().includes(query);
      const matchSerial = item.serials.some((s) => s.toLowerCase().includes(query));
      return matchCode || matchName || matchCategory || matchSerial;
    });
  }, [inventory, searchQuery, filterMode]);

  const totalUnits = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.serials.length, 0);
  }, [inventory]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header and Counters */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <ClipboardList className="w-4 h-4 text-blue-400" />
            <span>{t(language, 'stockSummaryTitle')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t(language, 'stockSummarySubtitle')}
          </p>
        </div>

        {/* Statistics & Actions */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <div className="text-xs text-slate-400">
              {t(language, 'totalItems')}:{' '}
              <span className="font-bold text-white font-mono">{inventory.length}</span>
            </div>
            <div className="text-xs text-slate-400 border-l border-slate-800 pl-4">
              {t(language, 'totalUnits')}:{' '}
              <span className="font-bold text-emerald-400 font-mono">{totalUnits}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {inventory.length === 0 ? (
              <button
                onClick={onLoadSample}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t(language, 'loadSampleData')}</span>
              </button>
            ) : (
              <button
                onClick={onClearAll}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 bg-slate-950/60 hover:bg-red-950/30 border border-slate-800 hover:border-red-800/40 transition cursor-pointer flex items-center gap-1"
                title="Clear All Inventory"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t(language, 'clearAll')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(language, 'searchPlaceholder')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t(language, 'filterAll')}
            </button>
            <button
              onClick={() => setFilterMode('with-serials')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                filterMode === 'with-serials'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t(language, 'filterWithSerials')}
            </button>
            <button
              onClick={() => setFilterMode('empty')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                filterMode === 'empty'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t(language, 'filterWithoutSerials')}
            </button>
          </div>

          {filteredItems.length > 0 && (
            <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
              <button
                onClick={expandAll}
                className="px-2 py-1 hover:text-slate-200 hover:underline cursor-pointer"
              >
                Expand all
              </button>
              <span>·</span>
              <button
                onClick={collapseAll}
                className="px-2 py-1 hover:text-slate-200 hover:underline cursor-pointer"
              >
                Collapse all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">{t(language, 'tableColCode')}</th>
              <th className="py-3 px-4">{t(language, 'tableColName')}</th>
              <th className="py-3 px-4 text-center">{t(language, 'tableColCount')}</th>
              <th className="py-3 px-4">{t(language, 'tableColSerials')}</th>
              <th className="py-3 px-4 text-right">{t(language, 'tableColActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="max-w-xs mx-auto space-y-3">
                    <p>{t(language, 'emptyTable')}</p>
                    {inventory.length === 0 && (
                      <button
                        onClick={onLoadSample}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t(language, 'loadSampleData')}</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isActive = activeItem?.code === item.code;
                const isExpanded = !!expandedItems[item.code];
                const targetMet = typeof item.targetCount === 'number' && item.targetCount > 0 && item.serials.length >= item.targetCount;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isActive
                        ? 'bg-blue-950/30 hover:bg-blue-950/40'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Item Code */}
                    <td className="py-3 px-4 font-mono font-semibold text-blue-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isActive && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"
                            title="Active Item"
                          />
                        )}
                        <span>{item.code}</span>
                      </div>
                    </td>

                    {/* Item Name & Meta */}
                    <td className="py-3 px-4 min-w-[200px]">
                      <div className="font-medium text-slate-200">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                        {item.category && <span>{item.category}</span>}
                        {item.category && item.location && <span>·</span>}
                        {item.location && <span>{item.location}</span>}
                        {(item.category || item.location) && <span>·</span>}
                        <span>{item.updatedAt}</span>
                      </div>
                    </td>

                    {/* Count & Target badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold font-mono text-xs">
                          {item.serials.length}
                        </span>
                        {typeof item.targetCount === 'number' && item.targetCount > 0 && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              targetMet
                                ? 'bg-emerald-900/40 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                            title={`Target: ${item.targetCount}`}
                          >
                            /{item.targetCount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Serials accordion */}
                    <td className="py-3 px-4 min-w-[220px]">
                      {item.serials.length === 0 ? (
                        <span className="text-slate-600 text-xs italic">
                          No serials scanned
                        </span>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.code)}
                              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                              )}
                              <span>
                                {isExpanded
                                  ? t(language, 'hideSerials')
                                  : `${t(language, 'viewSerials')} (${item.serials.length})`}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopySerials(item)}
                              className="text-slate-500 hover:text-slate-300 p-0.5"
                              title={t(language, 'copySerials')}
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Expanded serial list */}
                          {isExpanded && (
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1 pt-1 animate-in fade-in duration-150">
                              {item.serials.map((s, idx) => (
                                <div
                                  key={`${s}-${idx}`}
                                  className="flex items-center justify-between bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-[11px] font-mono hover:border-slate-700 transition-colors"
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="text-slate-500 text-[10px]">
                                      #{idx + 1}
                                    </span>
                                    <span className="text-slate-200 truncate">{s}</span>
                                  </div>
                                  <button
                                    onClick={() => onRemoveSerial(item.code, idx)}
                                    className="text-slate-500 hover:text-red-400 ml-2 p-0.5 transition-colors cursor-pointer"
                                    title="Remove this serial"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectActive(item.code)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                            isActive
                              ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                              : 'bg-slate-800 hover:bg-slate-700 text-blue-300 border-slate-700'
                          }`}
                          title="Select as active item to add serials"
                        >
                          <Plus className="w-3 h-3" />
                          <span className="hidden sm:inline">Active</span>
                        </button>

                        <button
                          onClick={() => onEditItem(item)}
                          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
                          title={t(language, 'editItem')}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => onDeleteItem(item.code)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg bg-slate-800/40 hover:bg-red-950/40 border border-slate-800 hover:border-red-800/40 transition cursor-pointer"
                          title={t(language, 'deleteItem')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
