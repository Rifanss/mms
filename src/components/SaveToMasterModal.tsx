import React from 'react';
import { 
  CheckCircle2, 
  Database, 
  ArrowRight, 
  FileSpreadsheet, 
  UserPlus, 
  RefreshCw, 
  CopyCheck, 
  Layers,
  Sparkles
} from 'lucide-react';
import { MasterSaveResult } from '../types';

interface SaveToMasterModalProps {
  isOpen: boolean;
  result: MasterSaveResult | null;
  onClose: () => void;
  onGoToMaster: () => void;
}

export const SaveToMasterModal: React.FC<SaveToMasterModalProps> = ({
  isOpen,
  result,
  onClose,
  onGoToMaster
}) => {
  if (!isOpen || !result) return null;

  const { log, newAccountsCount, updatedAccountsCount, duplicateRowsCount, totalBefore, totalAfter } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[94vh] flex flex-col overflow-hidden text-right animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-4 sm:p-6 relative overflow-hidden shrink-0">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shrink-0">
              <Database className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full">
                  تم الحفظ والدمج بنجاح
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-black mt-1 text-white">
                تمت الإضافة إلى المحفظة الرئيسية
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-5 overflow-y-auto flex-1">
          {/* File Name & Time info */}
          <div className="p-2.5 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] sm:text-xs">
            <div className="flex items-center gap-2 text-slate-700 min-w-0">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold truncate max-w-[170px] sm:max-w-[200px]" title={log.fileName}>
                {log.fileName}
              </span>
            </div>
            <span className="text-slate-500 font-mono text-[10px] sm:text-[11px] shrink-0">
              {log.formattedDate}
            </span>
          </div>

          {/* Merge Breakdown Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs">
            {/* New Accounts */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                <span>حسابات جديدة:</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
                +{newAccountsCount.toLocaleString()}
              </p>
            </div>

            {/* Updated Accounts */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1.5 text-blue-800 font-semibold">
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
                <span>تم تحديثها:</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-blue-700 font-mono">
                {updatedAccountsCount.toLocaleString()}
              </p>
            </div>

            {/* Total Imported */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
                <span>سجلات الملف:</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                {log.importedRows.toLocaleString()}
              </p>
            </div>

            {/* Duplicate / Unchanged */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <CopyCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
                <span>سجلات متطابقة:</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-700 font-mono">
                {duplicateRowsCount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Master Portfolio Total After Merge */}
          <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-l from-slate-900 to-slate-800 text-white flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium flex items-center gap-1 sm:gap-1.5">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                المحفظة الرئيسية الآن:
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400">
                (سابقاً {totalBefore.toLocaleString()} حساب)
              </p>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {totalAfter.toLocaleString()} <span className="text-[10px] sm:text-xs text-slate-300 font-normal">حساب</span>
            </div>
          </div>

          <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed text-center">
            🔒 تم حفظ البيانات بشكل دائم في قاعدة بيانات المتصفح، ولن تتأثر باستيراد ملفات جديدة أو إعادة تحميل الصفحة.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer text-center"
          >
            البقاء في المعاينة الحالية
          </button>

          <button
            onClick={() => {
              onClose();
              onGoToMaster();
            }}
            className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>عرض المحفظة الرئيسية الآن</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
