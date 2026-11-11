import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import { InventoryItem, Language } from '../types/inventory';
import { t } from '../utils/translations';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSave: (updatedItem: InventoryItem) => void;
  language: Language;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  language
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [targetCount, setTargetCount] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCode(item.code);
      setCategory(item.category || '');
      setLocation(item.location || '');
      setTargetCount(item.targetCount ? String(item.targetCount) : '');
      setNotes(item.notes || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const parsedTarget = targetCount.trim() ? parseInt(targetCount, 10) : null;

    onSave({
      ...item,
      code: code.trim(),
      name: name.trim(),
      category: category.trim() || undefined,
      location: location.trim() || undefined,
      targetCount: parsedTarget && !isNaN(parsedTarget) ? parsedTarget : null,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toLocaleTimeString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              {t(language, 'editItem')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 block font-medium">
              Item Code / Barcode *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 block font-medium">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 block font-medium">
                {t(language, 'category')}
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Audio, Mobile"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 block font-medium">
                {t(language, 'targetQty')}
              </label>
              <input
                type="number"
                min="0"
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
                placeholder="e.g. 10"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 block font-medium">
              {t(language, 'location')}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Rack 4, Shelf B"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 block font-medium">
              {t(language, 'notes')}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any inspection notes or condition..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              {t(language, 'cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t(language, 'save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
