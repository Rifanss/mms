import React from 'react';
import { 
  History, 
  X, 
  FileSpreadsheet, 
  Calendar, 
  UserPlus, 
  RefreshCw, 
  Layers, 
  Trash2,
  Database
} from 'lucide-react';
import { MasterSaveLog } from '../types';

interface MasterLogsModalProps {
  isOpen: boolean;
  logs: MasterSaveLog[];
  onClose: () => void;
  onClearLogs?: () => void;
}

export const MasterLogsModal: React.FC<MasterLogsModalProps> = ({
  isOpen,
  logs,
  onClose,
  onClearLogs
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden text-right animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-white truncate">
                سجل عمليات الحفظ في المحفظة الرئيسية
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                توثيق كامل لكافة عمليات الاستيراد والدمج التراكمي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-3 sm:space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 sm:py-12 space-y-2.5 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Database className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-700">لا توجد عمليات حفظ مسجلة حتى الآن</p>
              <p className="text-[10px] sm:text-xs text-slate-500 max-w-sm mx-auto">
                عند استيراد أي ملف والضغط على «حفظ في المحفظة الرئيسية»، سيتم توثيق تفاصيل العملية هنا تلقائياً.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {logs.map((log, index) => (
                <div
                  key={log.id || index}
                  className="p-2.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2 sm:space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 border-b border-slate-200/80 pb-2 sm:pb-2.5">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-slate-900 font-bold text-[11px] sm:text-sm min-w-0">
                      <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{log.fileName}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] sm:text-[11px] text-slate-500 font-mono shrink-0">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                      <span>{log.formattedDate}</span>
                    </div>
                  </div>

                  {/* Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                    <div className="bg-white p-1.5 sm:p-2 rounded-lg border border-slate-200">
                      <span className="text-[9px] sm:text-[10px] text-slate-500 block">المستوردة</span>
                      <span className="font-bold font-mono text-slate-900 text-xs sm:text-sm">{log.importedRows.toLocaleString()}</span>
                    </div>

                    <div className="bg-emerald-50 p-1.5 sm:p-2 rounded-lg border border-emerald-200">
                      <span className="text-[9px] sm:text-[10px] text-emerald-700 block">جديدة</span>
                      <span className="font-bold font-mono text-emerald-700 text-xs sm:text-sm">+{log.newAccountsCount.toLocaleString()}</span>
                    </div>

                    <div className="bg-blue-50 p-1.5 sm:p-2 rounded-lg border border-blue-200">
                      <span className="text-[9px] sm:text-[10px] text-blue-700 block">محدثة</span>
                      <span className="font-bold font-mono text-blue-700 text-xs sm:text-sm">{log.updatedAccountsCount.toLocaleString()}</span>
                    </div>

                    <div className="bg-slate-900 text-white p-1.5 sm:p-2 rounded-lg">
                      <span className="text-[9px] sm:text-[10px] text-slate-300 block">المحفظة بعدها</span>
                      <span className="font-bold font-mono text-emerald-400 text-xs sm:text-sm">{log.totalMasterAfter.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[10px] sm:text-xs text-slate-500 font-medium">
            العمليات الموثقة: <span className="font-bold text-slate-900 font-mono">{logs.length}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {logs.length > 0 && onClearLogs && (
              <button
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من رغبتك في مسح سجل عمليات الحفظ فقط؟ (لن يؤثر ذلك على بيانات المحفظة الرئيسية)')) {
                    onClearLogs();
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>مسح</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
