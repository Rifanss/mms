import React, { useState, useEffect } from 'react';
import { 
  FolderDown, 
  X, 
  Filter, 
  Layers, 
  Check, 
  FileCheck2 
} from 'lucide-react';
import { PortfolioRecord, PORTFOLIO_COLUMNS } from '../types';
import { exportPortfolioToExcel } from '../utils/excelParser';

interface ExportModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  defaultFileName?: string;
  totalCount: number;
  filteredCount: number;
  allRecords: PortfolioRecord[];
  filteredRecords: PortfolioRecord[];
  isFiltered: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  title = 'تصدير المحفظة إلى Excel',
  description = 'ملف .xlsx مهيأ بالأعمدة الـ 12 المعتمدة واتجاه RTL',
  defaultFileName = 'محفظتي_العملاء_اصحاب_الطلبات',
  totalCount,
  filteredCount,
  allRecords,
  filteredRecords,
  isFiltered,
  onClose
}) => {
  const [exportChoice, setExportChoice] = useState<'filtered' | 'all'>(isFiltered ? 'filtered' : 'all');
  const [customFileName, setCustomFileName] = useState(defaultFileName);

  useEffect(() => {
    setCustomFileName(defaultFileName);
    setExportChoice(isFiltered ? 'filtered' : 'all');
  }, [isOpen, defaultFileName, isFiltered]);

  if (!isOpen) return null;

  const handleExport = () => {
    const recordsToExport = exportChoice === 'filtered' ? filteredRecords : allRecords;
    const finalName = customFileName.trim() 
      ? (customFileName.endsWith('.xlsx') ? customFileName : `${customFileName}.xlsx`)
      : 'محفظتي_العملاء_اصحاب_الطلبات.xlsx';
    
    exportPortfolioToExcel(recordsToExport, finalName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 text-slate-800">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[94vh] flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <FolderDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black text-slate-900">
                {title}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500">
                {description}
              </p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-5 overflow-y-auto flex-1">
          {/* Target selection */}
          <div className="space-y-2">
            <label className="text-[11px] sm:text-xs font-bold text-slate-700 block">
              نطاق السجلات المراد تصديرها:
            </label>

            {isFiltered && (
              <button
                type="button"
                id="export-choice-filtered-btn"
                onClick={() => setExportChoice('filtered')}
                className={`w-full p-2.5 sm:p-3.5 rounded-xl border text-right flex items-center justify-between transition cursor-pointer ${
                  exportChoice === 'filtered'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/10 text-emerald-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[11px] sm:text-xs font-black block">تصدير النتائج المفلترة الحالية</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500">
                      يتم تصدير {filteredCount.toLocaleString('ar-SA')} سجل بناءً على البحث والفلترة النشطة
                    </span>
                  </div>
                </div>
                {exportChoice === 'filtered' && (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </button>
            )}

            <button
              type="button"
              id="export-choice-all-btn"
              onClick={() => setExportChoice('all')}
              className={`w-full p-2.5 sm:p-3.5 rounded-xl border text-right flex items-center justify-between transition cursor-pointer ${
                exportChoice === 'all'
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/10 text-emerald-900'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
                <div>
                  <span className="text-[11px] sm:text-xs font-black block">تصدير كامل المحفظة ({totalCount.toLocaleString('ar-SA')} سجل)</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500">
                    تصدير جميع العملاء أصحاب الطلبات
                  </span>
                </div>
              </div>
              {exportChoice === 'all' && (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
            </button>
          </div>

          {/* File Name */}
          <div className="space-y-1 sm:space-y-1.5">
            <label className="text-[11px] sm:text-xs font-bold text-slate-700 block">
              اسم ملف التصدير:
            </label>
            <div className="flex items-center gap-2">
              <input
                id="export-filename-input"
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-500 focus:bg-white transition"
                placeholder={defaultFileName}
              />
              <span className="text-[11px] sm:text-xs font-bold text-slate-400">.xlsx</span>
            </div>
          </div>

          {/* Columns Preview in exact order */}
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/70 text-[10px] sm:text-[11px] space-y-1.5">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              الأعمدة المضمنة (12 عمود بنفس الترتيب المعتمد):
            </span>
            <div className="flex flex-wrap gap-1 text-slate-500">
              {PORTFOLIO_COLUMNS.map((col, idx) => (
                <span key={col.key} className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[9px] sm:text-[10px]">
                  {idx + 1}. {col.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 sm:gap-2.5">
          <button
            id="cancel-export-btn"
            onClick={onClose}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            id="confirm-export-btn"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition cursor-pointer"
          >
            <FolderDown className="w-4 h-4" />
            <span>تنزيل ملف Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
