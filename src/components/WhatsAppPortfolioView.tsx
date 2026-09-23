import React, { useState, useMemo } from 'react';
import { 
  MessageCircle, 
  Search, 
  FolderDown, 
  Trash2, 
  ArrowUpDown, 
  PhoneCall, 
  ExternalLink,
  Layers,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { WhatsAppRecord } from '../types';
import { exportWhatsAppPortfolioToExcel } from '../utils/whatsappPortfolioStorage';
import { getProductDisplay, PRODUCT_MAPPINGS } from '../utils/productHelper';
import { normalizeArabicNumerals, formatSaudiMobileInternational } from '../utils/whatsappHelper';

interface WhatsAppPortfolioViewProps {
  records: WhatsAppRecord[];
  onClear: () => void;
  onImportClick: () => void;
}

export const WhatsAppPortfolioView: React.FC<WhatsAppPortfolioViewProps> = ({
  records,
  onClear,
  onImportClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('ALL');
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'WITH_REQ' | 'NO_REQ'>('ALL');
  const [sortField, setSortField] = useState<'account' | 'name' | 'debt' | 'product'>('debt');
  const [sortAsc, setSortAsc] = useState(false); // Default: Highest debt first (ترتيب تنازلي حسب مبلغ المديونية)
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState<string | null>(null);

  // Extract unique products for dropdown
  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.productType && r.productType.trim()) {
        set.add(r.productType.trim());
      }
    });
    return Array.from(set).sort();
  }, [records]);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) => 
        (r.accountNumber && r.accountNumber.toLowerCase().includes(q)) ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.nationalId && r.nationalId.toLowerCase().includes(q)) ||
        (r.mobileNumber && r.mobileNumber.toLowerCase().includes(q)) ||
        (r.productType && r.productType.toLowerCase().includes(q)) ||
        (r.requestType && r.requestType.toLowerCase().includes(q))
      );
    }

    // Product filter
    if (productFilter !== 'ALL') {
      result = result.filter((r) => r.productType === productFilter);
    }

    // Request filter (with request vs without request)
    if (requestFilter === 'WITH_REQ') {
      result = result.filter((r) => Boolean(r.requestType && r.requestType.trim()));
    } else if (requestFilter === 'NO_REQ') {
      result = result.filter((r) => !r.requestType || !r.requestType.trim());
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'account') {
        comparison = (a.accountNumber || '').localeCompare(b.accountNumber || '');
      } else if (sortField === 'name') {
        comparison = (a.customerName || '').localeCompare(b.customerName || '', 'ar');
      } else if (sortField === 'debt') {
        const valA = parseFloat(String(a.debtAmount).replace(/,/g, '')) || 0;
        const valB = parseFloat(String(b.debtAmount).replace(/,/g, '')) || 0;
        comparison = valA - valB;
      } else if (sortField === 'product') {
        comparison = (a.productType || '').localeCompare(b.productType || '', 'ar');
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [records, searchQuery, productFilter, requestFilter, sortField, sortAsc]);

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    let withReq = 0;
    let noReq = 0;
    let totalDebt = 0;

    records.forEach((r) => {
      if (r.requestType && r.requestType.trim()) {
        withReq++;
      } else {
        noReq++;
      }
      const debt = parseFloat(String(r.debtAmount).replace(/,/g, '')) || 0;
      totalDebt += debt;
    });

    return { total, withReq, noReq, totalDebt };
  }, [records]);

  const handleExport = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `محفظة_واتساب_الدائمة_${dateStr}.xlsx`;
    exportWhatsAppPortfolioToExcel(filteredRecords, filename);
  };

  const handleCopyMobile = (mobile: string) => {
    navigator.clipboard?.writeText(mobile);
    setCopiedMobile(mobile);
    setTimeout(() => setCopiedMobile(null), 2000);
  };

  const toggleSort = (field: 'account' | 'name' | 'debt' | 'product') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'debt' ? false : true);
    }
  };

  const toEng = (val: unknown): string => {
    if (val === null || val === undefined || val === '') return '—';
    return normalizeArabicNumerals(String(val));
  };

  return (
    <div className="space-y-4 sm:space-y-6" dir="rtl">
      {/* Top Banner / Hero Info */}
      <div className="bg-gradient-to-l from-emerald-950/70 via-slate-900 to-slate-900 rounded-2xl p-4 sm:p-6 border border-emerald-800/40 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
              <h2 className="text-base sm:text-2xl font-black text-white">
                محفظة واتساب الدائمة
              </h2>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                مستقلة وتعمل تلقائياً
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              تحتوي على جميع العملاء الذين يمتلكون أرقام جوال صالحة مع روابط واتساب مباشرة، بغض النظر عن وجود طلب من عدمه. يتم الحفظ والتحديث تلقائياً عند استيراد أي ملف.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-slate-950/50 p-2.5 sm:p-3 rounded-xl border border-slate-800/80">
            <div className="px-2 py-1">
              <span className="text-[10px] sm:text-xs text-slate-400 block font-medium">إجمالي العملاء</span>
              <span className="text-sm sm:text-lg font-black text-emerald-400 font-mono">
                {stats.total.toLocaleString()}
              </span>
            </div>
            <div className="px-2 py-1">
              <span className="text-[10px] sm:text-xs text-slate-400 block font-medium">إجمالي المديونيات</span>
              <span className="text-sm sm:text-lg font-black text-white font-mono">
                {stats.totalDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="px-2 py-1">
              <span className="text-[10px] sm:text-xs text-slate-400 block font-medium">لديهم طلب</span>
              <span className="text-sm sm:text-lg font-black text-teal-400 font-mono">
                {stats.withReq.toLocaleString()}
              </span>
            </div>
            <div className="px-2 py-1">
              <span className="text-[10px] sm:text-xs text-slate-400 block font-medium">بدون طلب</span>
              <span className="text-sm sm:text-lg font-black text-amber-400 font-mono">
                {stats.noReq.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="whatsapp-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الحساب، اسم العميل، الهوية، الجوال، نوع المنتج، أو الطلب..."
              className="w-full pl-9 pr-10 py-2 sm:py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="whatsapp-export-btn"
              onClick={handleExport}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition cursor-pointer"
              title="تصدير السجلات إلى ملف Excel بالأعمدة الـ 8 المحددة"
            >
              <FolderDown className="w-4 h-4" />
              <span>تصدير Excel ({filteredRecords.length})</span>
            </button>

            {records.length > 0 && (
              <button
                id="whatsapp-clear-btn"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1 px-2.5 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer"
                title="تفريغ محفظة واتساب الدائمة"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">تفريغ</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>فلترة:</span>
          </div>

          {/* Product Filter */}
          <select
            id="whatsapp-product-filter"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">جميع المنتجات ({uniqueProducts.length})</option>
            {uniqueProducts.map((p) => {
              const display = getProductDisplay(p);
              return (
                <option key={p} value={p}>
                  {display.fullTitle}
                </option>
              );
            })}
          </select>

          {/* Request Status Filter */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setRequestFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                requestFilter === 'ALL' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setRequestFilter('WITH_REQ')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                requestFilter === 'WITH_REQ' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مع طلب ({stats.withReq})
            </button>
            <button
              onClick={() => setRequestFilter('NO_REQ')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                requestFilter === 'NO_REQ' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              بدون طلب ({stats.noReq})
            </button>
          </div>

          {/* Result Count Badge */}
          <span className="mr-auto text-[11px] font-bold text-slate-500">
            معروض: {filteredRecords.length.toLocaleString()} من {records.length.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {records.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            محفظة واتساب فارغة حالياً
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            بمجرد استيراد أي ملف Excel يحتوي على عملاء بأرقام جوال صالحة، ستتم معالجتهم وحفظهم هنا تلقائياً في المحفظة الدائمة.
          </p>
          <div className="pt-2">
            <button
              onClick={onImportClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>استيراد ملف Excel الآن</span>
            </button>
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">لا توجد نتائج مطابقة لشروط البحث والفلترة</p>
          <button
            onClick={() => { setSearchQuery(''); setProductFilter('ALL'); setRequestFilter('ALL'); }}
            className="mt-3 text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                    <th className="py-3 px-3.5 w-12 text-center text-slate-400">#</th>
                    <th 
                      onClick={() => toggleSort('account')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-800 transition text-center"
                    >
                      <div className="flex items-center gap-1.5 justify-center">
                        <span>رقم الحساب</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => toggleSort('debt')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-800 transition text-center"
                    >
                      <div className="flex items-center gap-1.5 justify-center">
                        <span>مبلغ المديونية</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => toggleSort('name')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-800 transition text-center"
                    >
                      <div className="flex items-center gap-1.5 justify-center">
                        <span>اسم العميل</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3.5 text-center">رقم الهوية</th>
                    <th 
                      onClick={() => toggleSort('product')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-800 transition text-center"
                    >
                      <div className="flex items-center gap-1.5 justify-center">
                        <span>نوع المنتج</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3.5 text-center">نوع الطلب</th>
                    <th className="py-3 px-3.5 text-center">رقم الجوال</th>
                    <th className="py-3 px-3.5 text-center">إجراء واتساب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRecords.map((rec, index) => {
                    const isEven = index % 2 === 0;
                    const rowBg = isEven ? 'bg-white' : 'bg-slate-50/70';

                    return (
                      <tr 
                        key={rec.id}
                        className={`${rowBg} hover:bg-emerald-50/50 transition group`}
                      >
                        <td className="py-2.5 px-3.5 text-center align-middle text-[11px] text-slate-400 font-mono whitespace-nowrap">
                          {toEng(index + 1)}
                        </td>
                        <td className="py-2.5 px-3.5 text-center align-middle font-mono font-bold text-slate-900 whitespace-nowrap">
                          {toEng(rec.accountNumber)}
                        </td>
                        <td className="py-2.5 px-3.5 text-center align-middle font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {toEng(rec.debtAmount)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right align-middle font-semibold text-slate-900 max-w-xs truncate whitespace-nowrap">
                          {rec.customerName || '—'}
                        </td>
                        <td className="py-2.5 px-3.5 text-center align-middle font-mono text-slate-600 whitespace-nowrap">
                          {toEng(rec.nationalId)}
                        </td>
                        <td className="py-2.5 px-3.5 text-center align-middle text-slate-700 font-medium whitespace-nowrap">
                          {rec.productType ? (() => {
                            const display = getProductDisplay(rec.productType);
                            return <span className="font-mono font-bold text-slate-800">{display.code}</span>;
                          })() : '—'}
                        </td>
                        <td className="py-2.5 px-3.5 text-center align-middle whitespace-nowrap text-slate-800 font-medium">
                          {rec.requestType || '—'}
                        </td>
                        <td className="py-2.5 px-3.5 text-center align-middle font-mono text-slate-800 whitespace-nowrap" dir="ltr">
                          <button
                            onClick={() => handleCopyMobile(formatSaudiMobileInternational(rec.mobileNumber))}
                            className="hover:text-emerald-700 transition cursor-pointer font-bold inline-flex items-center gap-1 justify-center"
                            title="انقر لنسخ رقم الجوال"
                          >
                            <span>{toEng(formatSaudiMobileInternational(rec.mobileNumber))}</span>
                            {copiedMobile === formatSaudiMobileInternational(rec.mobileNumber) && (
                              <span className="text-[10px] text-emerald-600 font-bold">تم النسخ!</span>
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-3.5 text-center align-middle whitespace-nowrap">
                          <a
                            href={rec.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-xs transition hover:scale-102"
                            title={`مراسلة عبر واتساب: ${rec.whatsappUrl}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>واتساب</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Responsive Cards View */}
          <div className="block lg:hidden space-y-3">
            {filteredRecords.map((rec, index) => (
              <div 
                key={rec.id}
                className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">#{index + 1}</span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{rec.customerName || 'عميل بدون اسم'}</h4>
                    <span className="text-[11px] font-mono text-slate-500 block">حساب: {rec.accountNumber || '-'}</span>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-xs sm:text-sm font-black font-mono text-emerald-700 block">
                      {rec.debtAmount || '-'}
                    </span>
                    {rec.productType && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 mt-1">
                        {rec.productType}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الهوية:</span>
                    <span className="font-mono text-slate-700">{rec.nationalId || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">نوع الطلب:</span>
                    <span className="text-slate-700 font-medium">{rec.requestType || 'بدون طلب'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-800" dir="ltr">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                    <span>{toEng(formatSaudiMobileInternational(rec.mobileNumber))}</span>
                  </div>

                  <a
                    href={rec.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>مراسلة واتساب</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirmation Modal for Clearing WhatsApp Portfolio */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-2xl max-w-sm w-full p-5 text-right space-y-4 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">تفريغ محفظة واتساب؟</h3>
              <p className="text-xs text-slate-500">
                سيتم مسح جميع سجلات محفظة واتساب الدائمة ({records.length} عميل). هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onClear();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer"
              >
                تأكيد التفريغ
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
