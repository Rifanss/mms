import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronRight, 
  ChevronLeft, 
  ChevronsRight, 
  ChevronsLeft,
  Calendar, 
  RotateCcw, 
  Layers, 
  Eye, 
  CheckCircle,
  Clock,
  SlidersHorizontal,
  X,
  LayoutGrid,
  Table as TableIcon,
  Phone,
  User,
  CreditCard,
  FileText
} from 'lucide-react';
import { 
  PortfolioRecord, 
  PORTFOLIO_COLUMNS, 
  RequiredColumnKey, 
  DateSortOption 
} from '../types';
import { normalizeArabicNumerals, formatSaudiMobileInternational } from '../utils/whatsappHelper';

interface PortfolioTableProps {
  records: PortfolioRecord[];
  onSelectCustomer: (accountNumber: string) => void;
  filteredRecords: PortfolioRecord[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateSort: DateSortOption;
  setDateSort: (sort: DateSortOption) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  selectedRequestType: string;
  setSelectedRequestType: (type: string) => void;
  selectedRequestStatus: string;
  setSelectedRequestStatus: (status: string) => void;
  onResetFilters: () => void;
}

export const PortfolioTable: React.FC<PortfolioTableProps> = ({
  records,
  onSelectCustomer,
  filteredRecords,
  searchQuery,
  setSearchQuery,
  dateSort,
  setDateSort,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  selectedRequestType,
  setSelectedRequestType,
  selectedRequestStatus,
  setSelectedRequestStatus,
  onResetFilters
}) => {
  // Sorting state for column headers - default: debt amount descending (أعلى مديونية في الأعلى)
  const [sortColumn, setSortColumn] = useState<RequiredColumnKey | null>('debtAmount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Filter drawer/panel toggle on mobile
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Unique values for quick filters
  const uniqueRequestTypes = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.requestType && r.requestType.trim()) {
        set.add(r.requestType.trim());
      }
    });
    return Array.from(set).sort();
  }, [records]);

  const uniqueRequestStatuses = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.requestStatus && r.requestStatus.trim()) {
        set.add(r.requestStatus.trim());
      }
    });
    return Array.from(set).sort();
  }, [records]);

  // Apply column header sorting
  const sortedRecords = useMemo(() => {
    if (!sortColumn) {
      // Default: Highest debt amount on top (ترتيب تنازلي حسب مبلغ المديونية)
      return [...filteredRecords].sort((a, b) => {
        const numA = parseFloat(String(a.debtAmount || '').replace(/,/g, '')) || 0;
        const numB = parseFloat(String(b.debtAmount || '').replace(/,/g, '')) || 0;
        return numB - numA;
      });
    }

    return [...filteredRecords].sort((a, b) => {
      let valA: unknown = a[sortColumn];
      let valB: unknown = b[sortColumn];

      // Handle debt numeric comparison
      if (sortColumn === 'debtAmount') {
        const numA = parseFloat(String(valA || '').replace(/,/g, '')) || 0;
        const numB = parseFloat(String(valB || '').replace(/,/g, '')) || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // Handle date comparison
      if (sortColumn === 'requestOpenDate' || sortColumn === 'freezeDate') {
        const timeA = a.rawParsedDate ? a.rawParsedDate.getTime() : 0;
        const timeB = b.rawParsedDate ? b.rawParsedDate.getTime() : 0;
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();

      if (sortDirection === 'asc') {
        return strA.localeCompare(strB, 'ar');
      } else {
        return strB.localeCompare(strA, 'ar');
      }
    });
  }, [filteredRecords, sortColumn, sortDirection]);

  // Pagination calculation
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  
  // Keep page within bounds
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRecords = useMemo(() => {
    if (pageSize === -1) {
      return sortedRecords;
    }
    const start = (safePage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, safePage, pageSize]);

  const handleHeaderSort = (colKey: RequiredColumnKey) => {
    if (sortColumn === colKey) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        // Reset to default: debt descending
        setSortColumn('debtAmount');
        setSortDirection('desc');
      }
    } else {
      setSortColumn(colKey);
      setSortDirection(colKey === 'debtAmount' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').trim();
    if (!s) return null;
    if (s.includes('مكتمل') || s.includes('منتهي') || s.includes('تم') || s.includes('موافق')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('مرفوض') || s.includes('ملغي')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (s.includes('تحت') || s.includes('معلق') || s.includes('انتظار') || s.includes('جاري')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getStatusTextColor = (status: string) => {
    const s = (status || '').trim();
    if (!s) return 'text-slate-500';
    if (s.includes('مكتمل') || s.includes('منتهي') || s.includes('تم') || s.includes('موافق')) {
      return 'text-emerald-700';
    }
    if (s.includes('مرفوض') || s.includes('ملغي')) {
      return 'text-rose-700';
    }
    if (s.includes('تحت') || s.includes('معلق') || s.includes('انتظار') || s.includes('جاري')) {
      return 'text-amber-700';
    }
    return 'text-slate-700';
  };

  const toEng = (val: unknown): string => {
    if (val === null || val === undefined || val === '') return '—';
    return normalizeArabicNumerals(String(val));
  };

  const isAnyFilterActive = 
    searchQuery.trim() !== '' ||
    dateSort !== 'newest' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    selectedRequestType !== '' ||
    selectedRequestStatus !== '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Control Bar: Search & Filters */}
      <div className="p-3 sm:p-5 border-b border-slate-100 space-y-3 sm:space-y-4 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <input
              id="portfolio-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="البحث برقم الحساب، اسم العميل، الهوية، الجوال، رقم الطلب..."
              className="w-full pl-8 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-emerald-500 focus:border-emerald-500 shadow-2xs font-medium placeholder:text-[11px] sm:placeholder:text-xs placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>

          {/* Quick Date Sort & Filter Toggle */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Date Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 text-[11px] sm:text-xs font-semibold text-slate-700">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
              <label htmlFor="date-sort-select" className="text-slate-500 text-[10px] sm:text-[11px]">
                التاريخ:
              </label>
              <select
                id="date-sort-select"
                value={dateSort}
                onChange={(e) => {
                  setDateSort(e.target.value as DateSortOption);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-slate-800 font-bold focus:outline-hidden cursor-pointer text-[11px] sm:text-xs"
              >
                <option value="newest">الأحدث أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
                <option value="custom">نطاق مخصص</option>
              </select>
            </div>

            {/* Toggle extra filter panel */}
            <button
              id="toggle-filter-panel-btn"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold rounded-xl border transition cursor-pointer ${
                showFilterPanel || isAnyFilterActive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>فلاتر متقدمة</span>
              {isAnyFilterActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              )}
            </button>

            {isAnyFilterActive && (
              <button
                id="reset-filters-btn"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 text-[11px] sm:text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                title="إعادة تعيين جميع الفلاتر"
              >
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filter Panel */}
        {(showFilterPanel || dateSort === 'custom') && (
          <div className="pt-2.5 sm:pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs">
            {/* Date From */}
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block text-[10px] sm:text-xs">من تاريخ فتح الطلب:</label>
              <input
                id="filter-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setDateSort('custom');
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1 sm:py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] sm:text-xs text-slate-800 focus:outline-emerald-500"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block text-[10px] sm:text-xs">إلى تاريخ فتح الطلب:</label>
              <input
                id="filter-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setDateSort('custom');
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1 sm:py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] sm:text-xs text-slate-800 focus:outline-emerald-500"
              />
            </div>

            {/* Filter by Request Type */}
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block text-[10px] sm:text-xs">نوع الطلب:</label>
              <select
                id="filter-request-type"
                value={selectedRequestType}
                onChange={(e) => {
                  setSelectedRequestType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1 sm:py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] sm:text-xs text-slate-800 focus:outline-emerald-500 cursor-pointer"
              >
                <option value="">جميع أنواع الطلبات</option>
                {uniqueRequestTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Filter by Request Status */}
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block text-[10px] sm:text-xs">حالة الطلب:</label>
              <select
                id="filter-request-status"
                value={selectedRequestStatus}
                onChange={(e) => {
                  setSelectedRequestStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1 sm:py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] sm:text-xs text-slate-800 focus:outline-emerald-500 cursor-pointer"
              >
                <option value="">جميع حالات الطلب</option>
                {uniqueRequestStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table Results Count, View Switch & Page Size Toolbar */}
      <div className="px-3 sm:px-5 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-600">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-bold text-slate-900 font-mono">
            {sortedRecords.length.toLocaleString('ar-SA')}
          </span>
          <span>سجل معروض</span>
          {isAnyFilterActive && (
            <span className="text-slate-400 text-[10px] sm:text-xs">
              (من {records.length.toLocaleString('ar-SA')})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Mode Toggle: Table vs Cards (Ideal for Mobile) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold transition cursor-pointer ${
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
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="عرض كبطاقات للهاتف"
            >
              <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>بطاقات</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="page-size-select" className="text-slate-500 font-medium text-[10px] sm:text-xs">
              الصفوف:
            </label>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 font-bold text-slate-800 focus:outline-hidden cursor-pointer text-[10px] sm:text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={-1}>الكل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Cards View */}
      {viewMode === 'cards' ? (
        /* Mobile-Friendly Cards View */
        <div className="p-3 sm:p-5 border-t border-b border-slate-200 bg-slate-50/40">
          {paginatedRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">
                لا توجد سجلات مطابقة للبحث أو الفلترة الحالية
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
              {paginatedRecords.map((rec, index) => {
                const globalIndex = (safePage - 1) * (pageSize === -1 ? 0 : pageSize) + index + 1;
                return (
                  <div
                    key={rec.id}
                    id={`portfolio-card-${rec.id}`}
                    onClick={() => onSelectCustomer(rec.accountNumber || rec.customerName)}
                    className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-emerald-400 hover:shadow-xs transition cursor-pointer space-y-2.5 text-right relative group"
                  >
                    {/* Top Row: Index, Name, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center font-mono shrink-0">
                          {toEng(globalIndex)}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition">
                            {rec.customerName || 'عميل غير مسمى'}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            حساب: {toEng(rec.accountNumber)}
                          </span>
                        </div>
                      </div>

                      {rec.requestStatus && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getStatusBadge(rec.requestStatus)}`}>
                          {rec.requestStatus}
                        </span>
                      )}
                    </div>

                    {/* Request Details Pill */}
                    <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-center justify-between text-[11px]">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-emerald-800 font-bold block">نوع الطلب:</span>
                        <span className="font-semibold text-emerald-950 truncate max-w-[150px] block">
                          {rec.requestType || '—'}
                        </span>
                      </div>
                      <div className="text-left space-y-0.5">
                        <span className="text-[9px] text-emerald-800 font-bold block">رقم الطلب:</span>
                        <span className="font-mono font-bold text-emerald-950">
                          {toEng(rec.requestNumber)}
                        </span>
                      </div>
                    </div>

                    {/* Financial & ID details grid */}
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] sm:text-[11px] pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[9px]">مبلغ المديونية:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {toEng(rec.debtAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">المنتج:</span>
                        <span className="text-slate-700 truncate block">
                          {rec.productType || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">رقم الهوية:</span>
                        <span className="font-mono text-slate-700">
                          {toEng(rec.nationalId)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">تاريخ الطلب:</span>
                        <span className="font-mono text-slate-700">
                          {toEng(rec.requestOpenDate)}
                        </span>
                      </div>
                    </div>

                    {/* View Button Footer */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[10px] text-slate-500 font-mono font-medium" dir="ltr">
                        {toEng(formatSaudiMobileInternational(rec.mobileNumber))}
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
        /* Table Container with Sticky Headers & Horizontal Scroll (LTR Column Order) */
        <div className="overflow-x-auto border-t border-b border-slate-200 max-h-[68vh] relative" dir="ltr">
          <table className="w-full text-left border-collapse text-[10px] sm:text-xs select-text" dir="ltr">
            {/* Sticky Table Header */}
            <thead className="bg-slate-900 text-white sticky top-0 z-20 shadow-xs">
              <tr>
                <th className="p-2 sm:p-3 w-12 text-center text-slate-400 font-semibold border-b border-slate-800 text-[10px] sm:text-xs">
                  #
                </th>
                {PORTFOLIO_COLUMNS.map((col) => {
                  const isSorted = sortColumn === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleHeaderSort(col.key)}
                      className="p-2 sm:p-3 font-bold border-b border-slate-800 hover:bg-slate-800/80 transition cursor-pointer select-none whitespace-nowrap text-center text-[10px] sm:text-xs"
                      title={`فرز حسب ${col.label}`}
                    >
                      <div className="flex items-center gap-1.5 justify-center">
                        <span>{col.label}</span>
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-emerald-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-30 group-hover:opacity-70" />
                          )}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="p-2 sm:p-3 w-16 text-center font-bold border-b border-slate-800 whitespace-nowrap text-[10px] sm:text-xs">
                  إجراء
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-500 bg-white">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-slate-700 text-sm">
                        لا توجد سجلات مطابقة للبحث أو الفلترة الحالية
                      </p>
                      <p className="text-xs text-slate-400">
                        جرب تعديل كلمات البحث أو إلغاء تحديد الفلاتر
                      </p>
                      {isAnyFilterActive && (
                        <button
                          onClick={onResetFilters}
                          className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          إعادة تعيين الفلاتر
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec, index) => {
                  const globalIndex = (safePage - 1) * (pageSize === -1 ? 0 : pageSize) + index + 1;
                  const isEven = index % 2 === 0;
                  const rowBg = isEven ? 'bg-white' : 'bg-slate-50/70';

                  return (
                    <tr
                      key={rec.id}
                      id={`portfolio-row-${rec.id}`}
                      onClick={() => onSelectCustomer(rec.accountNumber || rec.customerName)}
                      className={`${rowBg} hover:bg-emerald-50/50 transition cursor-pointer group`}
                    >
                      {/* Row Index - Centered English digits */}
                      <td className="p-2.5 sm:p-3 text-center align-middle text-slate-400 font-mono text-[10px] sm:text-[11px] whitespace-nowrap">
                        {toEng(globalIndex)}
                      </td>

                      {/* 1. رقم الحساب - Centered English digits */}
                      <td className="p-2.5 sm:p-3 text-center align-middle font-mono font-bold text-slate-900 whitespace-nowrap">
                        {toEng(rec.accountNumber)}
                      </td>

                      {/* 2. مبلغ المديونية - Centered English digits */}
                      <td className="p-2.5 sm:p-3 text-center align-middle font-mono font-semibold text-emerald-700 whitespace-nowrap">
                        {toEng(rec.debtAmount)}
                      </td>

                      {/* 3. اسم العميل - RIGHT-ALIGNED for Arabic text */}
                      <td className="p-2.5 sm:p-3 text-right align-middle font-bold text-slate-900 hover:text-emerald-700 transition whitespace-nowrap">
                        {rec.customerName || '—'}
                      </td>

                      {/* 4. نوع المنتج - Centered */}
                      <td className="p-2.5 sm:p-3 text-center align-middle text-slate-700 whitespace-nowrap font-medium">
                        {rec.productType || '—'}
                      </td>

                      {/* 5. رقم الهوية - Centered English digits */}
                      <td className="p-2.5 sm:p-3 text-center align-middle font-mono text-slate-800 whitespace-nowrap">
                        {toEng(rec.nationalId)}
                      </td>

                      {/* 6. تاريخ التجميد - Centered English digits */}
                      <td className="p-2.5 sm:p-3 text-center align-middle text-slate-600 whitespace-nowrap">
                        {rec.freezeDate ? (
                          <span className="text-rose-600 font-mono font-medium">{toEng(rec.freezeDate)}</span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* 7. رقم الجوال - Centered English digits in Saudi International Format (+9665XXXXXXXX) */}
                      <td className="p-2.5 sm:p-3 text-center align-middle font-mono text-slate-800 whitespace-nowrap" dir="ltr">
                        {toEng(formatSaudiMobileInternational(rec.mobileNumber))}
                      </td>

                      {/* 8. نوع الطلب - Plain text, Centered, no badge/chip/border/rounded */}
                      <td className="p-2.5 sm:p-3 text-center align-middle text-slate-800 font-medium whitespace-nowrap">
                        {rec.requestType || '—'}
                      </td>

                      {/* 9. رقم الطلب - Centered English digits */}
                      <td className="p-2.5 sm:p-3 text-center align-middle font-mono font-bold text-slate-900 whitespace-nowrap">
                        {toEng(rec.requestNumber)}
                      </td>

                      {/* 10. حالة الطلب - Plain text, Centered, semantic text color without badge/chip/border */}
                      <td className="p-2.5 sm:p-3 text-center align-middle whitespace-nowrap">
                        {rec.requestStatus ? (
                          <span className={`font-bold text-[11px] sm:text-xs ${getStatusTextColor(rec.requestStatus)}`}>
                            {rec.requestStatus}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* 11. تاريخ فتح الطلب - Centered English digits */}
                      <td className="p-2.5 sm:p-3 text-center align-middle font-mono text-slate-700 whitespace-nowrap">
                        {toEng(rec.requestOpenDate)}
                      </td>

                      {/* 12. الوصف - Centered, truncated */}
                      <td className="p-2.5 sm:p-3 text-center align-middle text-slate-600 max-w-xs truncate" title={rec.description}>
                        {rec.description || '—'}
                      </td>

                      {/* View Button - Centered */}
                      <td className="p-2.5 sm:p-3 text-center align-middle whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCustomer(rec.accountNumber || rec.customerName);
                          }}
                          className="p-1 sm:p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/60 rounded-lg transition cursor-pointer"
                          title="عرض ملف العميل وطلباته"
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

      {/* Pagination Footer (Responsive on Mobile) */}
      {pageSize !== -1 && totalPages > 1 && (
        <div className="p-3 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-[11px] sm:text-xs">
          <div className="text-slate-500 font-medium text-center sm:text-right">
            الصفحة <strong className="text-slate-800 font-mono">{toEng(safePage)}</strong> من <strong className="text-slate-800 font-mono">{toEng(totalPages)}</strong>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="first-page-btn"
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="hidden sm:inline-flex p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="الصفحة الأولى"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
            <button
              id="prev-page-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center gap-1 text-[11px] sm:text-xs"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>السابق</span>
            </button>

            {/* Numeric Page indicators - visible on sm+ */}
            <div className="hidden sm:flex items-center gap-1 mx-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = safePage;
                if (safePage <= 3) {
                  pageNum = i + 1;
                } else if (safePage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = safePage - 2 + i;
                }

                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold transition cursor-pointer text-xs font-mono ${
                      safePage === pageNum
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              id="next-page-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center gap-1 text-[11px] sm:text-xs"
            >
              <span>التالي</span>
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              id="last-page-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
              className="hidden sm:inline-flex p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="الصفحة الأخيرة"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
