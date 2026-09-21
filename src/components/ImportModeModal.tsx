import React from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Plus, 
  X, 
  Layers, 
  ShieldCheck 
} from 'lucide-react';

interface ImportModeModalProps {
  isOpen: boolean;
  incomingFileName: string;
  incomingCount: number;
  currentCount: number;
  onReplace: () => void;
  onAppend: () => void;
  onCancel: () => void;
}

export const ImportModeModal: React.FC<ImportModeModalProps> = ({
  isOpen,
  incomingFileName,
  incomingCount,
  currentCount,
  onReplace,
  onAppend,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 text-slate-800">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[94vh] flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-slate-900 truncate">
                طريقة استيراد الملف الجديد
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                الملف: {incomingFileName} ({incomingCount} سجل مستخرج)
              </p>
            </div>
          </div>
          <button
            id="close-import-mode-btn"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
          <p className="text-[11px] sm:text-sm text-slate-600 leading-relaxed">
            المحفظة الحالية تحتوي على <strong className="text-slate-900 font-bold">{currentCount}</strong> سجل. كيف ترغب في معالجة الملف الجديد؟
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
            {/* Option 1: Append */}
            <button
              id="append-to-portfolio-btn"
              onClick={onAppend}
              className="p-3 sm:p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-500 transition text-right flex items-start gap-2.5 sm:gap-3.5 group cursor-pointer"
            >
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-800">
                  إضافة البيانات إلى المحفظة الحالية
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">
                  دمج السجلات الجديدة مع المحفظة القائمة وتطبيق قواعد منع التكرار (رقم الحساب + رقم الطلب) لضمان عدم ازدواجية السجلات.
                </p>
              </div>
            </button>

            {/* Option 2: Replace */}
            <button
              id="replace-portfolio-btn"
              onClick={onReplace}
              className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition text-right flex items-start gap-2.5 sm:gap-3.5 group cursor-pointer"
            >
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-slate-900">
                  استبدال المحفظة الحالية
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed">
                  مسح جميع بيانات المحفظة السابقة بالكامل واستبدالها بسجلات الملف الجديد فقط.
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            id="cancel-import-mode-btn"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer text-center"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
