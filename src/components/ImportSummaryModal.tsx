import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  FileSpreadsheet,
  Check,
  Ban
} from 'lucide-react';
import { ImportSummary } from '../types';

interface ImportSummaryModalProps {
  summary: ImportSummary | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ImportSummaryModal: React.FC<ImportSummaryModalProps> = ({
  summary,
  isOpen,
  onClose
}) => {
  const [showColumnsDetails, setShowColumnsDetails] = useState(false);

  if (!isOpen || !summary) return null;

  const hasMissing = summary.missingColumns.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[94vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-2.5 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-xl font-black text-slate-900 truncate">
                تم استيراد ومعالجة الملف بنجاح
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-xs">{summary.fileName}</span>
                <span>•</span>
                <span className="shrink-0">{summary.importedAt}</span>
              </p>
            </div>
          </div>
          <button
            id="close-summary-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-3.5 sm:p-6 space-y-3.5 sm:space-y-5">
          {/* Missing columns alert if applicable */}
          {hasMissing && (
            <div className="p-2.5 sm:p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] sm:text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  تم الاستيراد بنجاح، بعض الحقول غير متوفرة في الملف المصدر.
                </p>
                <p className="text-amber-800">
                  تم إنشاء الأعمدة المطلوبة في «محفظتي» بقيم فارغة تلقائيًا دون فقدان أي بيانات أخرى.
                </p>
              </div>
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-200/80">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block">إجمالي السجلات</span>
              <span className="text-base sm:text-xl font-black text-slate-900">
                {summary.totalRows.toLocaleString('ar-SA')}
              </span>
            </div>

            <div className="bg-emerald-50 rounded-xl p-2.5 sm:p-3 border border-emerald-200/80">
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 block">سجلات بطلبات</span>
              <span className="text-base sm:text-xl font-black text-emerald-700">
                {summary.extractedWithRequests.toLocaleString('ar-SA')}
              </span>
            </div>

            <div className="bg-rose-50 rounded-xl p-2.5 sm:p-3 border border-rose-200/80">
              <span className="text-[10px] sm:text-[11px] font-semibold text-rose-700 block">المستبعدة</span>
              <span className="text-base sm:text-xl font-black text-rose-700">
                {summary.excludedNoRequests.toLocaleString('ar-SA')}
              </span>
            </div>

            <div className="bg-indigo-50 rounded-xl p-2.5 sm:p-3 border border-indigo-200/80">
              <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-700 block">العملاء الفريدون</span>
              <span className="text-base sm:text-xl font-black text-indigo-700">
                {summary.uniqueCustomers.toLocaleString('ar-SA')}
              </span>
            </div>

            <div className="bg-teal-50 rounded-xl p-2.5 sm:p-3 border border-teal-200/80">
              <span className="text-[10px] sm:text-[11px] font-semibold text-teal-700 block">الطلبات المستخرجة</span>
              <span className="text-base sm:text-xl font-black text-teal-700">
                {summary.totalRequests.toLocaleString('ar-SA')}
              </span>
            </div>

            <div className="bg-blue-50 rounded-xl p-2.5 sm:p-3 border border-blue-200/80">
              <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 block">الأعمدة المتطابقة</span>
              <span className="text-base sm:text-xl font-black text-blue-700">
                {summary.matchedColumns.length} / 12
              </span>
            </div>
          </div>

          {/* Toggleable Column Matching Details */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              id="toggle-column-details-btn"
              type="button"
              onClick={() => setShowColumnsDetails(!showColumnsDetails)}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              <span>تفاصيل مطابقة أسماء الأعمدة ({summary.matchedColumns.length} مطابقة، {summary.missingColumns.length} غير متوفرة)</span>
              {showColumnsDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showColumnsDetails && (
              <div className="p-3 sm:p-4 bg-white divide-y divide-slate-100 text-[10px] sm:text-xs space-y-2.5 sm:space-y-3 max-h-56 overflow-y-auto">
                <div>
                  <h4 className="font-bold text-emerald-800 mb-1.5 sm:mb-2 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    الأعمدة الـ12 المطابقة في الملف:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    {summary.matchedColumns.map((c) => (
                      <div key={c.key} className="p-1.5 sm:p-2 rounded bg-emerald-50/50 border border-emerald-100">
                        <span className="font-bold text-slate-800">{c.targetLabel}</span>
                        <span className="text-[10px] sm:text-[11px] text-emerald-700 block">مطابق لـ: «{c.sourceHeader}»</span>
                      </div>
                    ))}
                  </div>
                </div>

                {hasMissing && (
                  <div className="pt-2 sm:pt-3">
                    <h4 className="font-bold text-amber-800 mb-1.5 sm:mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      الأعمدة المطلوبة غير المتوفرة (تم إنشاؤها فارغة):
                    </h4>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {summary.missingColumns.map((c) => (
                        <span key={c.key} className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[9px] sm:text-[11px]">
                          {c.targetLabel}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {summary.ignoredColumns.length > 0 && (
                  <div className="pt-2 sm:pt-3">
                    <h4 className="font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      الأعمدة الإضافية التي تم تجاهلها ({summary.ignoredColumns.length} عمود):
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {summary.ignoredColumns.map((col, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] sm:text-[10px]">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
          <button
            id="confirm-summary-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition cursor-pointer text-center"
          >
            عرض السجلات في «محفظتي»
          </button>
        </div>
      </div>
    </div>
  );
};
