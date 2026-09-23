import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  PortfolioRecord, 
  ImportSummary, 
  DateSortOption,
  ActiveViewTab,
  MasterSaveLog,
  MasterSaveResult,
  WhatsAppRecord
} from './types';
import { processExcelFile, mergePortfolioRecords } from './utils/excelParser';
import { generateTestExcelFile } from './utils/sampleGenerator';
import { 
  loadMasterPortfolio, 
  loadMasterLogs, 
  mergeIntoMasterPortfolio, 
  clearMasterPortfolioStorage,
  saveMasterLogs
} from './utils/masterPortfolioStorage';
import {
  loadWhatsAppMasterPortfolio,
  clearWhatsAppMasterPortfolio,
  mergeIntoWhatsAppMaster
} from './utils/whatsappPortfolioStorage';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { StatsCards } from './components/StatsCards';
import { PortfolioTable } from './components/PortfolioTable';
import { MasterPortfolioView } from './components/MasterPortfolioView';
import { WhatsAppPortfolioView } from './components/WhatsAppPortfolioView';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { ImportSummaryModal } from './components/ImportSummaryModal';
import { ImportModeModal } from './components/ImportModeModal';
import { SaveToMasterModal } from './components/SaveToMasterModal';
import { MasterLogsModal } from './components/MasterLogsModal';
import { ExportModal } from './components/ExportModal';
import { RulesModal } from './components/RulesModal';
import { 
  AlertCircle, 
  Database,
  Layers,
  BookmarkPlus,
  MessageCircle
} from 'lucide-react';

export default function App() {
  // Current imported buffer records state (temporary review portfolio)
  const [portfolioRecords, setPortfolioRecords] = useState<PortfolioRecord[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Master Portfolio (Permanent / Cumulative storage)
  const [masterRecords, setMasterRecords] = useState<PortfolioRecord[]>(() => loadMasterPortfolio());
  const [masterLogs, setMasterLogs] = useState<MasterSaveLog[]>(() => loadMasterLogs());
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('imported');

  // WhatsApp Master Portfolio (Permanent / Independent storage)
  const [whatsAppRecords, setWhatsAppRecords] = useState<WhatsAppRecord[]>(() => loadWhatsAppMasterPortfolio());
  const [whatsAppNotice, setWhatsAppNotice] = useState<string | null>(null);

  // Modals state
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportTarget, setExportTarget] = useState<'imported' | 'master'>('imported');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveResult, setSaveResult] = useState<MasterSaveResult | null>(null);
  const [showMasterLogsModal, setShowMasterLogsModal] = useState<boolean>(false);
  const [selectedCustomerAccount, setSelectedCustomerAccount] = useState<string | null>(null);

  // Incoming import conflict state (Append vs Replace in temporary review)
  const [pendingIncoming, setPendingIncoming] = useState<{
    records: PortfolioRecord[];
    summary: ImportSummary;
  } | null>(null);

  // Filter & Search state for Imported Review Table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateSort, setDateSort] = useState<DateSortOption>('newest');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedRequestType, setSelectedRequestType] = useState<string>('');
  const [selectedRequestStatus, setSelectedRequestStatus] = useState<string>('');

  // Process File ArrayBuffer
  const processBuffer = useCallback(async (buffer: ArrayBuffer, fileName: string) => {
    setIsProcessing(true);
    setProcessingError(null);
    setWhatsAppNotice(null);

    try {
      const { extractedRecords, summary, whatsAppRecords: incomingWhatsApp } = await processExcelFile(buffer, fileName);

      // Track 1 (Parallel & Independent): Direct update to Permanent WhatsApp Master Portfolio
      if (incomingWhatsApp && incomingWhatsApp.length > 0) {
        setWhatsAppRecords((prev) => {
          const { updatedMaster, result } = mergeIntoWhatsAppMaster(prev, incomingWhatsApp);
          setWhatsAppNotice(`تم تحديث محفظة واتساب الدائمة مباشرة: +${result.addedCount} جديد، ${result.updatedCount} تحديث (إجمالي محفظة واتساب: ${updatedMaster.length} عميل)`);
          return updatedMaster;
        });
      }

      // Track 2 (Current System): Customers with requests for temporary review portfolio
      if (extractedRecords.length === 0) {
        if (incomingWhatsApp && incomingWhatsApp.length > 0) {
          setProcessingError(`تم تحديث محفظة واتساب بنجاح بـ (${incomingWhatsApp.length}) عميل، ولكن لم يتم العثور على أي عملاء لديهم طلبات لإضافتهم للمحفظة المستوردة.`);
        } else {
          setProcessingError('لم يتم العثور على أي عملاء لديهم طلبات (نوع الطلب أو رقم الطلب) داخل هذا الملف.');
        }
        setIsProcessing(false);
        return;
      }

      // If portfolio already has data in current review buffer, ask user if they want to Append or Replace
      if (portfolioRecords.length > 0) {
        setPendingIncoming({ records: extractedRecords, summary });
      } else {
        setPortfolioRecords(extractedRecords);
        setImportSummary(summary);
        setActiveTab('imported');
        setShowSummaryModal(true);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء قراءة ملف Excel.';
      setProcessingError(msg);
    } finally {
      setIsProcessing(false);
    }
  }, [portfolioRecords.length]);

  // Handle file input
  const handleFileSelected = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        processBuffer(buffer, file.name);
      }
    };
    reader.onerror = () => {
      setProcessingError('تعذر قراءة الملف من الجهاز. يرجى المحاولة مرة أخرى.');
    };
    reader.readAsArrayBuffer(file);
  }, [processBuffer]);

  // Handle direct buffer load (from sample generator)
  const handleBufferLoaded = useCallback((buffer: ArrayBuffer, fileName: string) => {
    processBuffer(buffer, fileName);
  }, [processBuffer]);

  // Append new records with deduplication to current review buffer
  const handleConfirmAppend = () => {
    if (!pendingIncoming) return;
    const { merged } = mergePortfolioRecords(
      portfolioRecords, 
      pendingIncoming.records
    );

    setPortfolioRecords(merged);
    setActiveTab('imported');

    // Update summary with merged totals
    const uniqueAccounts = new Set<string>();
    merged.forEach((r) => {
      if (r.accountNumber) uniqueAccounts.add(r.accountNumber);
      else if (r.customerName) uniqueAccounts.add(r.customerName);
    });

    const updatedSummary: ImportSummary = {
      ...pendingIncoming.summary,
      totalRows: (importSummary?.totalRows || 0) + pendingIncoming.summary.totalRows,
      extractedWithRequests: merged.length,
      excludedNoRequests: (importSummary?.excludedNoRequests || 0) + pendingIncoming.summary.excludedNoRequests,
      uniqueCustomers: uniqueAccounts.size,
      totalRequests: merged.length
    };

    setImportSummary(updatedSummary);
    setPendingIncoming(null);
    setShowSummaryModal(true);
  };

  // Replace existing review buffer
  const handleConfirmReplace = () => {
    if (!pendingIncoming) return;
    setPortfolioRecords(pendingIncoming.records);
    setImportSummary(pendingIncoming.summary);
    setActiveTab('imported');
    setPendingIncoming(null);
    setShowSummaryModal(true);
  };

  // Save currently imported review records into the permanent Master Portfolio
  const handleSaveToMasterPortfolio = () => {
    if (portfolioRecords.length === 0) return;

    const fileName = importSummary?.fileName || 'ملف_مستورد.xlsx';
    const { updatedMaster, result } = mergeIntoMasterPortfolio(masterRecords, portfolioRecords, fileName);

    setMasterRecords(updatedMaster);
    setMasterLogs(loadMasterLogs());
    setSaveResult(result);
    setShowSaveModal(true);
  };

  // Clear Master Portfolio
  const handleClearMasterPortfolio = () => {
    const confirmText = window.prompt(
      '⚠️ تحذير: سيتم مسح كافة سجلات المحفظة الرئيسية الدائمة نهائياً!\nللتأكيد، اكتب كلمة "مسح" في المربع أدناه:'
    );

    if (confirmText === 'مسح') {
      clearMasterPortfolioStorage(false);
      setMasterRecords([]);
      alert('تم تفريغ المحفظة الرئيسية بنجاح.');
    }
  };

  // Clear Master Logs only
  const handleClearMasterLogs = () => {
    saveMasterLogs([]);
    setMasterLogs([]);
  };

  // Reset temporary review buffer
  const handleResetPortfolio = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إغلاق ملف المراجعة الحالي؟ (لن تتأثر المحفظة الرئيسية)')) {
      setPortfolioRecords([]);
      setImportSummary(null);
      setSearchQuery('');
      setDateSort('newest');
      setDateFrom('');
      setDateTo('');
      setSelectedRequestType('');
      setSelectedRequestStatus('');
      setProcessingError(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateSort('newest');
    setDateFrom('');
    setDateTo('');
    setSelectedRequestType('');
    setSelectedRequestStatus('');
  };

  // Filtered & Sorted Records calculation for Imported Review
  const filteredRecords = useMemo(() => {
    return portfolioRecords.filter((rec) => {
      // 1. Search Query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.trim().toLowerCase();
        const matches = 
          (rec.accountNumber && rec.accountNumber.toLowerCase().includes(query)) ||
          (rec.customerName && rec.customerName.toLowerCase().includes(query)) ||
          (rec.nationalId && rec.nationalId.toLowerCase().includes(query)) ||
          (rec.mobileNumber && rec.mobileNumber.toLowerCase().includes(query)) ||
          (rec.requestNumber && rec.requestNumber.toLowerCase().includes(query)) ||
          (rec.requestType && rec.requestType.toLowerCase().includes(query)) ||
          (rec.productType && rec.productType.toLowerCase().includes(query)) ||
          (rec.description && rec.description.toLowerCase().includes(query));

        if (!matches) return false;
      }

      // 2. Request Type filter
      if (selectedRequestType && rec.requestType !== selectedRequestType) {
        return false;
      }

      // 3. Request Status filter
      if (selectedRequestStatus && rec.requestStatus !== selectedRequestStatus) {
        return false;
      }

      // 4. Date Range filter
      if (dateFrom && rec.requestOpenDate) {
        if (rec.requestOpenDate < dateFrom) return false;
      }
      if (dateTo && rec.requestOpenDate) {
        if (rec.requestOpenDate > dateTo) return false;
      }

      return true;
    }).sort((a, b) => {
      // Primary: Debt amount descending (أعلى مبلغ مديونية في الأعلى، ثم الأقل فالأقل)
      const numA = parseFloat(String(a.debtAmount || '').replace(/,/g, '')) || 0;
      const numB = parseFloat(String(b.debtAmount || '').replace(/,/g, '')) || 0;
      if (numB !== numA) {
        return numB - numA;
      }

      // Secondary: Date sorting
      if (dateSort === 'newest') {
        const timeA = a.rawParsedDate ? a.rawParsedDate.getTime() : 0;
        const timeB = b.rawParsedDate ? b.rawParsedDate.getTime() : 0;
        return timeB - timeA;
      } else if (dateSort === 'oldest') {
        const timeA = a.rawParsedDate ? a.rawParsedDate.getTime() : 0;
        const timeB = b.rawParsedDate ? b.rawParsedDate.getTime() : 0;
        return timeA - timeB;
      }
      return 0;
    });
  }, [
    portfolioRecords, 
    searchQuery, 
    selectedRequestType, 
    selectedRequestStatus, 
    dateFrom, 
    dateTo, 
    dateSort
  ]);

  const hasImportedData = portfolioRecords.length > 0;
  const isFiltered = filteredRecords.length !== portfolioRecords.length || searchQuery !== '' || selectedRequestType !== '' || selectedRequestStatus !== '';

  // All records combining imported and master for customer modal search
  const combinedRecordsForCustomerModal = useMemo(() => {
    // If on master view, prioritize master records first, and also include any imported records
    const masterMap = new Map<string, PortfolioRecord>();
    masterRecords.forEach((r) => {
      const key = r.accountNumber ? `ACC_${r.accountNumber.trim()}` : `ID_${r.id}`;
      masterMap.set(key, r);
    });

    const combined = [...masterRecords];
    portfolioRecords.forEach((r) => {
      const key = r.accountNumber ? `ACC_${r.accountNumber.trim()}` : `ID_${r.id}`;
      if (!masterMap.has(key)) {
        combined.push(r);
      }
    });

    return combined;
  }, [masterRecords, portfolioRecords]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Tajawal',sans-serif] text-slate-800" dir="rtl">
      {/* Top Header */}
      <Header
        hasData={hasImportedData}
        totalRecords={portfolioRecords.length}
        masterRecordsCount={masterRecords.length}
        whatsAppRecordsCount={whatsAppRecords.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onImportClick={() => {
          const input = document.getElementById('compact-import-btn') || document.getElementById('main-import-btn');
          input?.click();
        }}
        onExportClick={() => {
          setExportTarget(activeTab === 'whatsapp' ? 'master' : activeTab);
          setShowExportModal(true);
        }}
        onSaveToMaster={handleSaveToMasterPortfolio}
        onResetClick={handleResetPortfolio}
        onSampleClick={() => {
          const bytes = generateTestExcelFile(1000);
          processBuffer(bytes.buffer as ArrayBuffer, 'ملف_محفظة_اختباري_1000_سجل.xlsx');
        }}
        onShowHelp={() => setShowRulesModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6">
        {/* Error message banner */}
        {processingError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 sm:p-4 rounded-xl flex items-center justify-between gap-2.5 sm:gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
              <span className="font-semibold">{processingError}</span>
            </div>
            <button
              onClick={() => setProcessingError(null)}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer shrink-0"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* WhatsApp Auto-Update Notification Banner */}
        {whatsAppNotice && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 sm:p-4 rounded-xl flex items-center justify-between gap-2.5 sm:gap-3 text-xs sm:text-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="font-bold">{whatsAppNotice}</span>
            </div>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-black underline cursor-pointer shrink-0"
            >
              عرض محفظة واتساب
            </button>
          </div>
        )}

        {/* Tab 1: Imported Portfolio (المحفظة المستوردة للمراجعة) */}
        {activeTab === 'imported' && (
          <>
            {!hasImportedData ? (
              /* State 1: No Data in current buffer */
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                {/* Hero / Intro Title */}
                <div className="text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-2 pt-2 sm:pt-4">
                  <h2 className="text-xl sm:text-3xl font-black text-slate-900">
                    محفظتي
                  </h2>
                  <p className="text-xs sm:text-base text-slate-600 font-medium">
                    استيراد ومعالجة بيانات العملاء أصحاب الطلبات من ملفات Excel الكبيرة وتحديث المحفظة الرئيسية
                  </p>
                </div>

                {/* DropZone component */}
                <DropZone
                  isProcessing={isProcessing}
                  onFileSelected={handleFileSelected}
                  onBufferLoaded={handleBufferLoaded}
                />

                {/* Master Portfolio Quick Banner if master has records */}
                {masterRecords.length > 0 && (
                  <div className="max-w-4xl mx-auto p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border border-slate-700 shadow-md">
                    <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                        <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-bold text-white">
                          لديك <span className="text-emerald-400 font-mono font-black">{masterRecords.length.toLocaleString()}</span> حساب في «المحفظة الرئيسية»
                        </h3>
                        <p className="text-[10px] sm:text-xs text-slate-400 truncate sm:whitespace-normal">
                          يمكنك استعراضها والبحث فيها في أي وقت دون الحاجة لإعادة رفع الملفات
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('master')}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm shrink-0"
                    >
                      <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>فتح المحفظة الرئيسية</span>
                    </button>
                  </div>
                )}

                {/* WhatsApp Portfolio Quick Banner if whatsAppRecords has records */}
                {whatsAppRecords.length > 0 && (
                  <div className="max-w-4xl mx-auto p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border border-emerald-800/60 shadow-md">
                    <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-bold text-white">
                          لديك <span className="text-emerald-400 font-mono font-black">{whatsAppRecords.length.toLocaleString()}</span> عميل في «محفظة واتساب الدائمة»
                        </h3>
                        <p className="text-[10px] sm:text-xs text-slate-300 truncate sm:whitespace-normal">
                          أرقام جوال صالحة وروابط مراسلة مباشرة تم حفظها تلقائياً
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('whatsapp')}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>فتح محفظة واتساب</span>
                    </button>
                  </div>
                )}

                {/* Feature Highlights Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto pt-1 sm:pt-2">
                  <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 text-right space-y-1.5 sm:space-y-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs sm:text-sm">
                      1
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      استخراج العملاء أصحاب الطلبات فقط
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                      يتم إدراج العميل تلقائياً إذا كان لديه نوع طلب أو رقم طلب، واستبعاد السجلات الفارغة دون فقدان أي عميل نشط.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 text-right space-y-1.5 sm:space-y-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs sm:text-sm">
                      2
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      المحفظة الرئيسية والحفظ التراكمي
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                      حفظ السجلات المستوردة بشكل دائم وتراكمي مع دمج التحديثات الذكي برقم الحساب ومنع التكرار نهائياً.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 text-right space-y-1.5 sm:space-y-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs sm:text-sm">
                      3
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      معالجة محلية آمنة 100%
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                      تتم المعالجة والتخزين محلياً في المتصفح 100% مع صيانة الأصفار البادئة والدقة الكاملة لأرقام الحسابات والهويات.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* State 2: Data Loaded (Active Review Buffer) */
              <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                {/* Top Action Prompt Banner */}
                <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-2xl p-3 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-md border border-emerald-700/60">
                  <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                      <BookmarkPlus className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-base font-bold text-white">
                        تم استيراد ومعالجة ({portfolioRecords.length.toLocaleString()}) سجل للمراجعة
                      </h3>
                      <p className="text-[10px] sm:text-xs text-emerald-200 mt-0.5">
                        هذه المحفظة مؤقتة للمراجعة. لحفظها بشكل دائم وتراكمي دون تكرار، اضغط على زر الحفظ:
                      </p>
                    </div>
                  </div>

                  <button
                    id="banner-save-to-master-btn"
                    onClick={handleSaveToMasterPortfolio}
                    className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white hover:bg-emerald-50 active:bg-white text-emerald-900 text-xs sm:text-sm font-black shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer shrink-0"
                  >
                    <BookmarkPlus className="w-4 h-4 text-emerald-700" />
                    <span>حفظ في المحفظة الرئيسية</span>
                  </button>
                </div>

                {/* Top Compact Import Bar */}
                <DropZone
                  isCompact={true}
                  isProcessing={isProcessing}
                  onFileSelected={handleFileSelected}
                  onBufferLoaded={handleBufferLoaded}
                />

                {/* Top Statistics Cards */}
                <StatsCards
                  summary={importSummary}
                  filteredCount={filteredRecords.length}
                  totalExtracted={portfolioRecords.length}
                />

                {/* Main Portfolio Table (with LTR layout starting with Account Number on left) */}
                <PortfolioTable
                  records={portfolioRecords}
                  filteredRecords={filteredRecords}
                  onSelectCustomer={(acc) => setSelectedCustomerAccount(acc)}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  dateSort={dateSort}
                  setDateSort={setDateSort}
                  dateFrom={dateFrom}
                  setDateFrom={setDateFrom}
                  dateTo={dateTo}
                  setDateTo={setDateTo}
                  selectedRequestType={selectedRequestType}
                  setSelectedRequestType={setSelectedRequestType}
                  selectedRequestStatus={selectedRequestStatus}
                  setSelectedRequestStatus={setSelectedRequestStatus}
                  onResetFilters={handleResetFilters}
                />
              </div>
            )}
          </>
        )}

        {/* Tab 2: Master Portfolio (المحفظة الرئيسية الدائمة) */}
        {activeTab === 'master' && (
          <MasterPortfolioView
            masterRecords={masterRecords}
            masterLogs={masterLogs}
            onSelectCustomer={(acc) => setSelectedCustomerAccount(acc)}
            onExportMaster={() => {
              setExportTarget('master');
              setShowExportModal(true);
            }}
            onShowLogs={() => setShowMasterLogsModal(true)}
            onClearMaster={handleClearMasterPortfolio}
            onSwitchToImported={() => setActiveTab('imported')}
            importedRecordsCount={portfolioRecords.length}
          />
        )}

        {/* Tab 3: WhatsApp Portfolio (محفظة واتساب الدائمة المستقلة) */}
        {activeTab === 'whatsapp' && (
          <WhatsAppPortfolioView
            records={whatsAppRecords}
            onClear={() => {
              clearWhatsAppMasterPortfolio();
              setWhatsAppRecords([]);
            }}
            onImportClick={() => {
              const input = document.getElementById('compact-import-btn') || document.getElementById('main-import-btn');
              if (input) {
                input.click();
              } else {
                setActiveTab('imported');
              }
            }}
          />
        )}
      </main>

      {/* Customer Profile Modal (ملف العميل) */}
      <CustomerProfileModal
        customerAccount={selectedCustomerAccount}
        allRecords={combinedRecordsForCustomerModal}
        isOpen={Boolean(selectedCustomerAccount)}
        onClose={() => setSelectedCustomerAccount(null)}
      />

      {/* Import Summary Modal (نتيجة عملية الاستيراد للمراجعة) */}
      <ImportSummaryModal
        summary={importSummary}
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
      />

      {/* Save to Master Success / Breakdown Modal */}
      <SaveToMasterModal
        isOpen={showSaveModal}
        result={saveResult}
        onClose={() => setShowSaveModal(false)}
        onGoToMaster={() => {
          setShowSaveModal(false);
          setActiveTab('master');
        }}
      />

      {/* Master Save Logs History Modal */}
      <MasterLogsModal
        isOpen={showMasterLogsModal}
        logs={masterLogs}
        onClose={() => setShowMasterLogsModal(false)}
        onClearLogs={handleClearMasterLogs}
      />

      {/* Import Mode Conflict Modal (استبدال أو إضافة في المراجعة) */}
      <ImportModeModal
        isOpen={Boolean(pendingIncoming)}
        incomingFileName={pendingIncoming?.summary.fileName || ''}
        incomingCount={pendingIncoming?.records.length || 0}
        currentCount={portfolioRecords.length}
        onAppend={handleConfirmAppend}
        onReplace={handleConfirmReplace}
        onCancel={() => setPendingIncoming(null)}
      />

      {/* Export Portfolio Modal (Handles both Imported and Master Portfolio) */}
      <ExportModal
        isOpen={showExportModal}
        title={exportTarget === 'master' ? 'تصدير المحفظة الرئيسية إلى Excel' : 'تصدير المحفظة إلى Excel'}
        description={
          exportTarget === 'master'
            ? 'تصدير السجلات الدائمة والتراكمية المحفوظة في المحفظة الرئيسية'
            : 'تصدير ملف .xlsx مهيأ بالأعمدة الـ 12 المعتمدة واتجاه RTL'
        }
        defaultFileName={
          exportTarget === 'master'
            ? 'المحفظة_الرئيسية_الشاملة'
            : 'محفظتي_العملاء_اصحاب_الطلبات'
        }
        totalCount={exportTarget === 'master' ? masterRecords.length : portfolioRecords.length}
        filteredCount={exportTarget === 'master' ? masterRecords.length : filteredRecords.length}
        allRecords={exportTarget === 'master' ? masterRecords : portfolioRecords}
        filteredRecords={exportTarget === 'master' ? masterRecords : filteredRecords}
        isFiltered={exportTarget === 'master' ? false : isFiltered}
        onClose={() => setShowExportModal(false)}
      />

      {/* Rules & Help Modal */}
      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            نظام «محفظتي» © 2026 — استيراد ومعالجة بيانات العملاء أصحاب الطلبات وإدارتها في المحفظة الرئيسية.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>تنسيق الأعمدة: 12 عمود موحد</span>
            <span>•</span>
            <span>حفظ تراكمي ذكي</span>
            <span>•</span>
            <span>تصدير Excel متوافق</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
