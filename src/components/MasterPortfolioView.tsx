import React, { useState, useMemo } from 'react';
import { 
  PortfolioRecord, 
  DateSortOption,
  PORTFOLIO_COLUMNS,
  RequiredColumnKey,
  MasterSaveLog
} from '../types';
import { 
  Database, 
  Search, 
  FolderDown, 
  Filter, 
  History, 
  ArrowUpDown, 
  ChevronRight, 
  ChevronLeft, 
  Users, 
  CreditCard, 
  Sparkles, 
  Eye, 
  Trash2,
  AlertCircle,
  FileSpreadsheet,
  X,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';

interface MasterPortfolioViewProps {
  masterRecords: PortfolioRecord[];
  masterLogs: MasterSaveLog[];
  onSelectCustomer: (accountNumberOrName: string) => void;
  onExportMaster: () => void;
  onShowLogs: () => void;
  onClearMaster: () => void;
  onSwitchToImported: () => void;
  importedRecordsCount: number;
}

export const MasterPortfolioView: React.FC<MasterPortfolioViewProps> = ({
  masterRecords,
  masterLogs,
  onSelectCustomer,
  onExportMaster,
  onShowLogs,
  onClearMaster,
  onSwitchToImported,
  importedRecordsCount
}) => {
  // Local Filtering & Search state for Master Portfolio
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateSort, setDateSort] = useState<DateSortOption>('newest');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedRequestType, setSelectedRequestType] = useState<string>('');
  const [selectedRequestStatus, setSelectedRequestStatus] = useState<string>('');
  const [selectedProductType, setSelectedProductType] = useState<string>('');

  // Column header sorting
  const [sortColumn, setSortColumn] = useState<RequiredColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Derive unique filter options
  const requestTypes = useMemo(() => {
    const set = new Set<string>();
    masterRecords.forEach((r) => {
      if (r.requestType && r.requestType.trim()) set.add(r.requestType.trim());
    });
    return Array.from(set).sort();
  }, [masterRecords]);

  const requestStatuses = useMemo(() => {
    const set = new Set<string>();
    masterRecords.forEach((r) => {
      if (r.requestStatus && r.requestStatus.trim()) set.add(r.requestStatus.trim());
    });
    return Array.from(set).sort();
  }, [masterRecords]);

  const productTypes = useMemo(() => {
    const set = new Set<string>();
    masterRecords.forEach((r) => {
      if (r.productType && r.productType.trim()) set.add(r.productType.trim());
    });
    return Array.from(set).sort();
  }, [masterRecords]);

  // Total debt calculation
  const totalDebt = useMemo(() => {
    return masterRecords.reduce((sum, r) => {
      if (!r.debtAmount) return sum;
      const num = parseFloat(r.debtAmount.replace(/,/g, ''));
      return isNaN(num) ? sum : sum + num;
    }, 0);
  }, [masterRecords]);

  // Unique customers calculation
  const uniqueCustomersCount = useMemo(() => {
    const unique = new Set<string>();
    masterRecords.forEach((r) => {
      if (r.accountNumber) unique.add(r.accountNumber);
      else if (r.customerName) unique.add(r.customerName);
    });
    return unique.size;
  }, [masterRecords]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDateSort('newest');
    setDateFrom('');
    setDateTo('');
    setSelectedRequestType('');
    setSelectedRequestStatus('');
    setSelectedProductType('');
    setSortColumn(null);
    setCurrentPage(1);
  };

  // Header column click sorting
  const handleHeaderSort = (key: RequiredColumnKey) => {
    if (sortColumn === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    let result = masterRecords.filter((rec) => {
      // 1. Search Query
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

      // 2. Request Type
      if (selectedRequestType && rec.requestType !== selectedRequestType) {
        return false;
      }

      // 3. Request Status
      if (selectedRequestStatus && rec.requestStatus !== selectedRequestStatus) {
        return false;
      }

      // 4. Product Type
      if (selectedProductType && rec.productType !== selectedProductType) {
        return false;
      }

      // 5. Date Range
      if (dateFrom && rec.requestOpenDate) {
        if (rec.requestOpenDate < dateFrom) return false;
      }
      if (dateTo && rec.requestOpenDate) {
        if (rec.requestOpenDate > dateTo) return false;
      }

      return true;
    });

    // Custom column sort or default date sort
    if (sortColumn) {
      result = result.sort((a, b) => {
        const valA = (a[sortColumn] || '').toString().toLowerCase();
        const valB = (b[sortColumn] || '').toString().toLowerCase();

        // Numeric debt sorting if column is debtAmount
        if (sortColumn === 'debtAmount') {
          const numA = parseFloat(valA.replace(/,/g, '')) || 0;
          const numB = parseFloat(valB.replace(/,/g, '')) || 0;
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        const cmp = valA.localeCompare(valB, 'ar', { numeric: true });
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    } else {
      // Default Date Sorting
      result = result.sort((a, b) => {
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
    }

    return result;
  }, [
    masterRecords,
    searchQuery,
    selectedRequestType,
    selectedRequestStatus,
    selectedProductType,
    dateFrom,
    dateTo,
    sortColumn,
    sortDirection,
    dateSort
  ]);

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Request status badge styling helper
  const getStatusBadge = (status: string) => {
    const s = status.trim().toLowerCase();
    if (s.includes('مغلق') || s.includes('منتهي') || s.includes('closed') || s.includes('done') || s.includes('resolved')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('مرفوض') || s.includes('ملغي') || s.includes('rejected') || s.includes('cancelled')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (s.includes('جديد') || s.includes('new') || s.includes('قيد الانتظار') || s.includes('pending')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const isFiltered = filteredRecords.length !== masterRecords.length || searchQuery !== '' || selectedRequestType !== '' || selectedRequestStatus !== '';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Stats Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-7 shadow-lg border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 relative z-10">
          {/* Main Title & Description */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-inner">
                <Database className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h2 className="text-base sm:text-2xl font-black text-white">
                    المحفظة الرئيسية (السجل الدائم)
                  </h2>
                  <span className="text-[10px] sm:text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    تراكمية
                  </span>
                </div>
                <p className="text-[11px] sm:text-sm text-slate-400 mt-0.5">
                  مستودع البيانات الشامل والدائم لكافة العملاء والحسابات المحفوظة
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
            <button
              id="master-show-logs-btn"
              onClick={onShowLogs}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span>سجل الحفظ ({masterLogs.length})</span>
            </button>

            <button
              id="master-export-btn"
              onClick={onExportMaster}
              disabled={masterRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/20 transition cursor-pointer"
            >
              <FolderDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>تصدير Excel</span>
            </button>

            {masterRecords.length > 0 && (
              <button
                id="master-clear-btn"
                onClick={onClearMaster}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2.5 rounded-xl text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-950/80 text-[11px] sm:text-xs font-semibold border border-rose-900/50 transition cursor-pointer"
                title="مسح المحفظة الرئيسية بالكامل"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تفريغ</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Stats Cards Grid inside Master Portfolio */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-700/80">
          {/* 1. Total Master Accounts */}
          <div className="bg-slate-800/60 p-2.5 sm:p-4 rounded-xl border border-slate-700/60 backdrop-blur-xs space-y-0.5 sm:space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs">
              <span>إجمالي الحسابات</span>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </div>
            <p className="text-lg sm:text-3xl font-black text-white font-mono">
              {masterRecords.length.toLocaleString()}
            </p>
            <p className="text-[9px] sm:text-[11px] text-emerald-400 font-medium">
              حساب مسجل
            </p>
          </div>

          {/* 2. Total Cumulative Debt */}
          <div className="bg-slate-800/60 p-2.5 sm:p-4 rounded-xl border border-slate-700/60 backdrop-blur-xs space-y-0.5 sm:space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs">
              <span>المديونية التراكمية</span>
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
            </div>
            <p className="text-lg sm:text-3xl font-black text-teal-300 font-mono truncate" title={`${totalDebt.toLocaleString()} ر.س`}>
              {totalDebt > 0 ? `${(totalDebt / 1_000_000).toFixed(2)}M` : '0'} <span className="text-[10px] sm:text-xs text-slate-400">ر.س</span>
            </p>
            <p className="text-[9px] sm:text-[11px] text-slate-400 font-mono truncate">
              {totalDebt.toLocaleString(undefined, { maximumFractionDigits: 0 })} ر.س
            </p>
          </div>

          {/* 3. Unique Customers */}
          <div className="bg-slate-800/60 p-2.5 sm:p-4 rounded-xl border border-slate-700/60 backdrop-blur-xs space-y-0.5 sm:space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs">
              <span>العملاء الفريدين</span>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </div>
            <p className="text-lg sm:text-3xl font-black text-amber-300 font-mono">
              {uniqueCustomersCount.toLocaleString()}
            </p>
            <p className="text-[9px] sm:text-[11px] text-slate-400">
              عميل مستقل
            </p>
          </div>

          {/* 4. Total Save Logs / Batches */}
          <div className="bg-slate-800/60 p-2.5 sm:p-4 rounded-xl border border-slate-700/60 backdrop-blur-xs space-y-0.5 sm:space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs">
              <span>عمليات الحفظ</span>
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
            </div>
            <p className="text-lg sm:text-3xl font-black text-blue-300 font-mono">
              {masterLogs.length.toLocaleString()}
            </p>
            <p className="text-[9px] sm:text-[11px] text-slate-400">
              دفعة موثقة
            </p>
          </div>
        </div>
      </div>

      {/* Empty State if Master Portfolio has no data yet */}
      {masterRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 sm:p-12 border border-slate-200 text-center space-y-3 sm:space-y-4 shadow-sm">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
            <Database className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              المحفظة الرئيسية فارغة حالياً
            </h3>
            <p className="text-[11px] sm:text-sm text-slate-500 leading-relaxed">
              عند استيراد أي ملف Excel ومعالجته، اضغط على زر <strong className="text-emerald-700">«حفظ في المحفظة الرئيسية»</strong> ليتم حفظ ودمج كافة سجلاته بشكل دائم وتراكمي هنا دون تكرار.
            </p>
          </div>

          {importedRecordsCount > 0 && (
            <button
              onClick={onSwitchToImported}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
            >
              <span>الرجوع إلى الملف المستورد ({importedRecordsCount})</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Main Master Portfolio Table Card */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 sm:space-y-4">
          {/* Filter & Search Bar */}
          <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3.5 border-b border-slate-200 bg-slate-50/50">
            <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="بحث شامل (برقم الحساب، اسم العميل، الهوية، الجوال، رقم الطلب...)"
                  className="w-full pl-8 pr-8 sm:pr-9 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition placeholder:text-[11px] sm:placeholder:text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Date Sort Toggle & Reset */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="flex items-center bg-white rounded-xl border border-slate-300 p-0.5 sm:p-1 text-[11px] sm:text-xs">
                  <button
                    onClick={() => setDateSort('newest')}
                    className={`px-2 sm:px-3 py-1 rounded-lg font-semibold transition cursor-pointer text-[10px] sm:text-xs ${
                      dateSort === 'newest' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    الأحدث طلباً
                  </button>
                  <button
                    onClick={() => setDateSort('oldest')}
                    className={`px-2 sm:px-3 py-1 rounded-lg font-semibold transition cursor-pointer text-[10px] sm:text-xs ${
                      dateSort === 'oldest' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    الأقدم طلباً
                  </button>
                </div>

                {isFiltered && (
                  <button
                    onClick={handleResetFilters}
                    className="px-2.5 py-1 text-[11px] sm:text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer"
                  >
                    إعادة ضبط
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown Filters Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2.5 text-[10px] sm:text-xs pt-1">
              {/* 1. Request Type Filter */}
              <div>
                <select
                  value={selectedRequestType}
                  onChange={(e) => {
                    setSelectedRequestType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-1.5 sm:p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer text-[10px] sm:text-xs"
                >
                  <option value="">نوع الطلب ({requestTypes.length})</option>
                  {requestTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Request Status Filter */}
              <div>
                <select
                  value={selectedRequestStatus}
                  onChange={(e) => {
                    setSelectedRequestStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-1.5 sm:p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer text-[10px] sm:text-xs"
                >
                  <option value="">حالة الطلب ({requestStatuses.length})</option>
                  {requestStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Product Type Filter */}
              <div>
                <select
                  value={selectedProductType}
                  onChange={(e) => {
                    setSelectedProductType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-1.5 sm:p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer text-[10px] sm:text-xs"
                >
                  <option value="">المنتج ({productTypes.length})</option>
                  {productTypes.map((prod) => (
                    <option key={prod} value={prod}>
                      {prod}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Date From */}
              <div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-1.5 sm:p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 text-[10px] sm:text-xs focus:outline-none focus:border-emerald-600"
                  title="من تاريخ فتح الطلب"
                />
              </div>

              {/* 5. Date To */}
              <div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-1.5 sm:p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 text-[10px] sm:text-xs focus:outline-none focus:border-emerald-600"
                  title="إلى تاريخ فتح الطلب"
                />
              </div>
            </div>
          </div>

          {/* Results Count & View Switch Bar */}
          <div className="px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500">
            <div>
              عرض <span className="font-bold text-slate-900 font-mono">{filteredRecords.length.toLocaleString()}</span> من{' '}
              <span className="font-bold text-slate-900 font-mono">{masterRecords.length.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* View Mode Toggle: Table vs Cards */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-bold transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="عرض كجدول"
                >
                  <TableIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>جدول</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-bold transition cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="عرض كبطاقات للجوال"
                >
                  <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>بطاقات</span>
                </button>
              </div>

              {/* Page size selector */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-[10px] sm:text-xs">الصفوف:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="p-0.5 sm:p-1 rounded border border-slate-300 bg-white font-semibold text-slate-800 text-[10px] sm:text-xs cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards View Mode */}
          {viewMode === 'cards' ? (
            <div className="p-3 sm:p-5 border-t border-b border-slate-200 bg-slate-50/40">
              {paginatedRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs sm:text-sm font-semibold">لا توجد سجلات مطابقة للبحث أو الفلترة الحالية</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
                  {paginatedRecords.map((rec, idx) => {
                    const rowNum = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <div
                        key={rec.id || idx}
                        onClick={() => onSelectCustomer(rec.accountNumber || rec.customerName)}
                        className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-emerald-400 hover:shadow-xs transition cursor-pointer space-y-2.5 text-right relative group"
                      >
                        {/* Header: Index, Customer Name, Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center font-mono shrink-0">
                              {rowNum}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition">
                                {rec.customerName || 'عميل غير مسمى'}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                حساب: {rec.accountNumber || '—'}
                              </span>
                            </div>
                          </div>

                          {rec.requestStatus && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getStatusBadge(rec.requestStatus)}`}>
                              {rec.requestStatus}
                            </span>
                          )}
                        </div>

                        {/* Request Pill */}
                        <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-center justify-between text-[10px] sm:text-[11px]">
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-emerald-800 font-bold block">نوع الطلب:</span>
                            <span className="font-semibold text-emerald-950 truncate max-w-[150px] block">
                              {rec.requestType || '—'}
                            </span>
                          </div>
                          <div className="text-left space-y-0.5">
                            <span className="text-[9px] text-emerald-800 font-bold block">رقم الطلب:</span>
                            <span className="font-mono font-bold text-emerald-950">
                              {rec.requestNumber || '—'}
                            </span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-1.5 text-[10px] sm:text-[11px] pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[9px]">المديونية:</span>
                            <span className="font-mono font-bold text-emerald-700">
                              {rec.debtAmount ? `${rec.debtAmount} ر.س` : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">المنتج:</span>
                            <span className="text-slate-700 truncate block">
                              {rec.productType || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">الهوية:</span>
                            <span className="font-mono text-slate-700">
                              {rec.nationalId || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">تاريخ الطلب:</span>
                            <span className="font-mono text-slate-700">
                              {rec.requestOpenDate || '—'}
                            </span>
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {rec.mobileNumber || ''}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCustomer(rec.accountNumber || rec.customerName);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md transition"
                          >
                            <Eye className="w-3 h-3 text-emerald-600" />
                            <span>فتح الملف</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Main Table Container with LTR Order (Account Number on Far Left) */
            <div className="overflow-x-auto border-t border-b border-slate-200 max-h-[68vh] relative" dir="ltr">
              <table className="w-full text-left border-collapse text-[10px] sm:text-xs select-text" dir="ltr">
                {/* Sticky Table Header */}
                <thead className="bg-slate-900 text-white sticky top-0 z-20 shadow-xs">
                  <tr>
                    <th className="p-2 sm:p-3 font-bold border-b border-slate-800 w-10 text-center text-slate-400 text-[10px] sm:text-xs">
                      #
                    </th>

                    {PORTFOLIO_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleHeaderSort(col.key)}
                        className="p-2 sm:p-3 font-bold border-b border-slate-800 hover:bg-slate-800/80 transition cursor-pointer select-none whitespace-nowrap text-left text-[10px] sm:text-xs"
                        title={`فرز حسب ${col.label}`}
                      >
                        <div className="flex items-center gap-1 justify-start">
                          <span>{col.label}</span>
                          <ArrowUpDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${sortColumn === col.key ? 'text-emerald-400' : 'text-slate-500'}`} />
                        </div>
                      </th>
                    ))}

                    <th className="p-2 sm:p-3 font-bold border-b border-slate-800 text-center w-14 text-[10px] sm:text-xs">
                      إجراء
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="p-10 text-center text-slate-400">
                        <div className="space-y-2">
                          <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                          <p className="text-xs sm:text-sm font-semibold">لا توجد سجلات مطابقة للبحث أو الفلترة الحالية</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((rec, idx) => {
                      const rowNum = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr
                          key={rec.id || idx}
                          onClick={() => onSelectCustomer(rec.accountNumber || rec.customerName)}
                          className="hover:bg-emerald-50/40 transition cursor-pointer group text-left"
                        >
                          {/* Row Index */}
                          <td className="p-2 sm:p-3 text-center text-slate-400 font-mono text-[10px] sm:text-[11px]">
                            {rowNum}
                          </td>

                          {/* 1. رقم الحساب */}
                          <td className="p-2 sm:p-3 font-mono font-bold text-slate-900 whitespace-nowrap text-left">
                            {rec.accountNumber || '—'}
                          </td>

                          {/* 2. مبلغ المديونية */}
                          <td className="p-2 sm:p-3 font-mono font-semibold text-emerald-700 whitespace-nowrap text-left">
                            {rec.debtAmount ? `${rec.debtAmount} ر.س` : '—'}
                          </td>

                          {/* 3. اسم العميل */}
                          <td className="p-2 sm:p-3 font-bold text-slate-900 hover:text-emerald-700 transition whitespace-nowrap text-left">
                            {rec.customerName || '—'}
                          </td>

                          {/* 4. نوع المنتج */}
                          <td className="p-2 sm:p-3 text-slate-700 whitespace-nowrap text-left">
                            {rec.productType || '—'}
                          </td>

                          {/* 5. رقم الهوية */}
                          <td className="p-2 sm:p-3 font-mono text-slate-800 whitespace-nowrap text-left">
                            {rec.nationalId || '—'}
                          </td>

                          {/* 6. تاريخ التجميد */}
                          <td className="p-2 sm:p-3 text-slate-600 whitespace-nowrap text-left">
                            {rec.freezeDate ? (
                              <span className="text-rose-600 font-medium">{rec.freezeDate}</span>
                            ) : (
                              '—'
                            )}
                          </td>

                          {/* 7. رقم الجوال */}
                          <td className="p-2 sm:p-3 font-mono text-slate-800 whitespace-nowrap text-left">
                            {rec.mobileNumber || '—'}
                          </td>

                          {/* 8. نوع الطلب */}
                          <td className="p-2 sm:p-3 font-bold text-slate-900 whitespace-nowrap text-left">
                            {rec.requestType ? (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200 text-[10px] sm:text-xs">
                                {rec.requestType}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>

                          {/* 9. رقم الطلب */}
                          <td className="p-2 sm:p-3 font-mono font-bold text-slate-900 whitespace-nowrap text-left">
                            {rec.requestNumber || '—'}
                          </td>

                          {/* 10. حالة الطلب */}
                          <td className="p-2 sm:p-3 whitespace-nowrap text-left">
                            {rec.requestStatus ? (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold border ${getStatusBadge(rec.requestStatus)}`}>
                                {rec.requestStatus}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>

                          {/* 11. تاريخ فتح الطلب */}
                          <td className="p-2 sm:p-3 font-mono text-slate-700 whitespace-nowrap text-left">
                            {rec.requestOpenDate || '—'}
                          </td>

                          {/* 12. الوصف */}
                          <td className="p-2 sm:p-3 text-slate-600 max-w-xs truncate text-left" title={rec.description}>
                            {rec.description || '—'}
                          </td>

                          {/* Action column */}
                          <td className="p-2 sm:p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onSelectCustomer(rec.accountNumber || rec.customerName)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                              title="عرض ملف العميل والطلبات المرتبطة"
                            >
                              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-[10px] sm:text-xs border-t border-slate-100">
              <div className="text-slate-500 text-center sm:text-right">
                صفحة <span className="font-bold text-slate-900 font-mono">{currentPage}</span> من{' '}
                <span className="font-bold text-slate-900 font-mono">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer text-[10px] sm:text-xs"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>السابق</span>
                </button>

                {/* Direct Page Jump (Quick Numbers) - Hidden on extra-small mobile */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold font-mono text-[11px] sm:text-xs transition cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer text-[10px] sm:text-xs"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
