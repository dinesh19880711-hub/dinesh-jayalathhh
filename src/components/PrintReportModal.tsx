import React from 'react';
import { X, Printer, CheckCircle, FileText } from 'lucide-react';
import { InventoryItem, Language } from '../types/inventory';
import { t } from '../utils/translations';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  language: Language;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  inventory,
  language
}) => {
  if (!isOpen) return null;

  const totalUnits = inventory.reduce((sum, item) => sum + item.serials.length, 0);
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Controls Bar (hidden during browser print) */}
        <div className="print:hidden px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              Inventory Audit & Stock Count Report Preview
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Now</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-white text-slate-900 print:p-0 print:m-0 print:w-full">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                Stock Inventory & Serial Audit Sheet
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Generated from Smart Stock Counter System
              </p>
            </div>
            <div className="text-right text-xs text-slate-600 space-y-0.5">
              <div><span className="font-semibold">Date:</span> {dateStr}</div>
              <div><span className="font-semibold">Time:</span> {timeStr}</div>
              <div><span className="font-semibold">Total SKUs:</span> {inventory.length}</div>
              <div><span className="font-semibold">Total Units:</span> {totalUnits}</div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-300">
                <tr>
                  <th className="py-2 px-3 border-r border-slate-300">#</th>
                  <th className="py-2 px-3 border-r border-slate-300">Item Code</th>
                  <th className="py-2 px-3 border-r border-slate-300">Description</th>
                  <th className="py-2 px-3 border-r border-slate-300">Location</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Target</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Counted</th>
                  <th className="py-2 px-3">Serial Numbers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inventory.map((item, idx) => (
                  <tr key={item.id} className="align-top">
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-semibold text-slate-900">
                      {item.code}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-800">
                      <div>{item.name}</div>
                      {item.category && (
                        <span className="text-[10px] text-slate-500">{item.category}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                      {item.location || '-'}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono">
                      {item.targetCount ?? '-'}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-900">
                      {item.serials.length}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-700">
                      {item.serials.length === 0 ? (
                        <span className="text-slate-400 italic">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {item.serials.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-[10px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Verification Signatures block */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-xs">
            <div>
              <div className="h-12 border-b border-slate-400"></div>
              <div className="pt-1.5 font-semibold text-slate-800">Counted By (Staff)</div>
              <div className="text-[11px] text-slate-500">Name & Signature</div>
            </div>
            <div>
              <div className="h-12 border-b border-slate-400"></div>
              <div className="pt-1.5 font-semibold text-slate-800">Audited By (Supervisor)</div>
              <div className="text-[11px] text-slate-500">Name & Signature</div>
            </div>
            <div>
              <div className="h-12 border-b border-slate-400"></div>
              <div className="pt-1.5 font-semibold text-slate-800">Warehouse Manager Approval</div>
              <div className="text-[11px] text-slate-500">Stamp & Date</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
