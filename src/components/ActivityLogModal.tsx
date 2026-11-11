import React from 'react';
import { X, History, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { ScanLog, Language } from '../types/inventory';
import { t } from '../utils/translations';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ScanLog[];
  onClearLogs: () => void;
  language: Language;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  language
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t(language, 'recentLogs')}
              </h3>
              <p className="text-xs text-slate-400">
                {logs.length} logged scanning events
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="text-xs text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800"
                title="Clear Logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 space-y-2 overflow-y-auto divide-y divide-slate-800/60">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No scan activity recorded yet.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="pt-2 pb-1 text-xs flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2">
                  {log.isError ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-200">
                      {log.detail}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <span className="font-mono text-blue-400">{log.itemCode}</span>
                      {log.itemName && <span> · {log.itemName}</span>}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex justify-end bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
          >
            {t(language, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
};
