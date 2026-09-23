import React from 'react';
import { 
  FolderDown, 
  FileSpreadsheet, 
  PlusCircle, 
  RotateCcw, 
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Database,
  BookmarkPlus,
  Layers,
  MessageCircle
} from 'lucide-react';
import { ActiveViewTab } from '../types';

interface HeaderProps {
  hasData: boolean;
  totalRecords: number;
  masterRecordsCount: number;
  whatsAppRecordsCount: number;
  activeTab: ActiveViewTab;
  onTabChange: (tab: ActiveViewTab) => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onSaveToMaster: () => void;
  onResetClick: () => void;
  onSampleClick: () => void;
  onShowHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasData,
  totalRecords,
  masterRecordsCount,
  whatsAppRecordsCount,
  activeTab,
  onTabChange,
  onImportClick,
  onExportClick,
  onSaveToMaster,
  onResetClick,
  onSampleClick,
  onShowHelp
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-3.5">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/30 ring-1 ring-white/10 shrink-0">
              <FileSpreadsheet className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-2xl font-black tracking-tight text-white">
                  محفظتي
                </h1>
                <span className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  معالجة محلية 100%
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 line-clamp-1">
                استيراد ومعالجة بيانات العملاء أصحاب الطلبات وإدارتها في المحفظة الرئيسية
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              id="help-btn"
              onClick={onShowHelp}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition cursor-pointer"
              title="دليل قواعد النظام وشروط الاستخراج"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>قواعد النظام</span>
            </button>

            <button
              id="sample-data-btn"
              onClick={onSampleClick}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/60 rounded-lg border border-emerald-700/50 transition cursor-pointer"
              title="توليد وتجربة ملف Excel حقيقي للاختبار"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>ملف نموذجي</span>
            </button>

            {/* If imported data is available and currently viewing imported tab */}
            {hasData && activeTab === 'imported' && (
              <>
                {/* 1. تصدير المحفظة إلى Excel */}
                <button
                  id="header-export-btn"
                  onClick={onExportClick}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 rounded-lg shadow-xs transition cursor-pointer"
                >
                  <FolderDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="sm:hidden">تصدير Excel</span>
                  <span className="hidden sm:inline">تصدير المحفظة إلى Excel</span>
                </button>

                {/* 2. استيراد ملف جديد */}
                <button
                  id="header-new-import-btn"
                  onClick={onImportClick}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 rounded-lg border border-slate-700 transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  <span className="sm:hidden">استيراد جديد</span>
                  <span className="hidden sm:inline">استيراد ملف جديد</span>
                </button>

                {/* 3. حفظ في المحفظة الرئيسية */}
                <button
                  id="header-save-to-master-btn"
                  onClick={onSaveToMaster}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 rounded-lg shadow-sm shadow-emerald-950/40 border border-emerald-400/30 transition cursor-pointer"
                  title="حفظ ودمج سجلات هذا الملف داخل المحفظة الرئيسية الدائمة"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100" />
                  <span className="sm:hidden">حفظ بالرئيسية</span>
                  <span className="hidden sm:inline">حفظ في المحفظة الرئيسية</span>
                </button>

                {/* Reset imported current buffer */}
                <button
                  id="header-reset-btn"
                  onClick={onResetClick}
                  className="inline-flex items-center gap-1 p-1.5 sm:px-2 sm:py-2 text-[11px] sm:text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-950/70 rounded-lg border border-rose-900/50 transition cursor-pointer"
                  title="إغلاق الملف المستورد الحالي"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* When viewing Master Portfolio or WhatsApp Portfolio */}
            {(activeTab === 'master' || activeTab === 'whatsapp') && (
              <button
                id="header-tab-import-btn"
                onClick={onImportClick}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span>استيراد ملف جديد</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar between Imported, Master, and WhatsApp Portfolios */}
      <div className="bg-slate-950/60 border-t border-slate-800/80 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex items-center gap-1.5 sm:gap-4 -mb-px overflow-x-auto" aria-label="Tabs">
            {/* Tab 1: المحفظة المستوردة */}
            <button
              id="tab-imported-portfolio"
              onClick={() => onTabChange('imported')}
              className={`py-2 sm:py-2.5 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-1.5 sm:gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'imported'
                  ? 'border-emerald-400 text-emerald-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="sm:hidden">المستوردة</span>
              <span className="hidden sm:inline">المحفظة المستوردة (للمراجعة)</span>
              {hasData && (
                <span className={`px-1.5 sm:px-2 py-0.2 rounded-full text-[9px] sm:text-[10px] font-mono font-bold ${
                  activeTab === 'imported' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {totalRecords.toLocaleString()}
                </span>
              )}
            </button>

            {/* Tab 2: المحفظة الرئيسية */}
            <button
              id="tab-master-portfolio"
              onClick={() => onTabChange('master')}
              className={`py-2 sm:py-2.5 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-1.5 sm:gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'master'
                  ? 'border-emerald-400 text-emerald-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="sm:hidden">الرئيسية</span>
              <span className="hidden sm:inline">المحفظة الرئيسية (الدائمة)</span>
              <span className={`px-1.5 sm:px-2 py-0.2 rounded-full text-[9px] sm:text-[10px] font-mono font-bold ${
                activeTab === 'master' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {masterRecordsCount.toLocaleString()}
              </span>
            </button>

            {/* Tab 3: محفظة واتساب */}
            <button
              id="tab-whatsapp-portfolio"
              onClick={() => onTabChange('whatsapp')}
              className={`py-2 sm:py-2.5 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-1.5 sm:gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'whatsapp'
                  ? 'border-emerald-400 text-emerald-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="sm:hidden">واتساب</span>
              <span className="hidden sm:inline">محفظة واتساب (الدائمة)</span>
              <span className={`px-1.5 sm:px-2 py-0.2 rounded-full text-[9px] sm:text-[10px] font-mono font-bold ${
                activeTab === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {whatsAppRecordsCount.toLocaleString()}
              </span>
            </button>
          </nav>

          {/* Quick status message */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {activeTab === 'whatsapp' ? 'محفظة واتساب الدائمة مستقلة ومحفوظة' : 'المحفظة الرئيسية محفوظة ومستمرة دائماً'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
