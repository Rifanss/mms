import React, { useRef, useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Download,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { generateTestExcelFile, downloadSampleExcel } from '../utils/sampleGenerator';

interface DropZoneProps {
  isCompact?: boolean;
  isProcessing: boolean;
  onFileSelected: (file: File) => void;
  onBufferLoaded: (buffer: ArrayBuffer, fileName: string) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  isCompact = false,
  isProcessing,
  onFileSelected,
  onBufferLoaded
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setErrorMsg(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
    // Reset file input value so user can upload the same file again if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndProcessFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setErrorMsg('يرجى اختيار ملف Excel بصيغة (.xlsx أو .xls) فقط.');
      return;
    }
    onFileSelected(file);
  };

  const handleQuickSample = (count: number) => {
    const bytes = generateTestExcelFile(count);
    const fileName = `ملف_محفظة_اختباري_${count}_سجل.xlsx`;
    onBufferLoaded(bytes.buffer as ArrayBuffer, fileName);
  };

  if (isCompact) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isProcessing}
        />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                استيراد ملف Excel إضافي أو استبدال المحفظة
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500">
                يدعم .xlsx و .xls مع المعالجة الفورية واستبعاد السجلات الخالية من الطلبات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="compact-import-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري المعالجة...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>استيراد ملف Excel</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-2 text-[11px] sm:text-xs text-rose-600 flex items-center gap-1.5 bg-rose-50 p-2 rounded border border-rose-100">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-3 sm:my-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={isProcessing}
      />

      <div
        id="main-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/70 ring-4 ring-emerald-500/10 scale-[1.01]'
            : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-slate-50/60 shadow-sm'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-emerald-50 to-emerald-100/60 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-inner group-hover:scale-105 transition-transform">
            {isProcessing ? (
              <Loader2 className="w-7 h-7 sm:w-10 sm:h-10 animate-spin text-emerald-600" />
            ) : (
              <Upload className="w-7 h-7 sm:w-10 sm:h-10 text-emerald-600" />
            )}
          </div>

          <div className="space-y-1 sm:space-y-1.5 max-w-lg">
            <h2 className="text-base sm:text-2xl font-bold text-slate-800">
              {isProcessing ? 'جاري قراءة ومعالجة ملف Excel...' : 'اسحب وأفلت ملف Excel هنا، أو اضغط للاختيار'}
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-500">
              يدعم ملفات <strong className="text-slate-700">.xlsx</strong> و <strong className="text-slate-700">.xls</strong> بجميع الأحجام والأعمدة
            </p>
          </div>

          <button
            id="main-import-btn"
            type="button"
            disabled={isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-1 sm:mt-2 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-base font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-700/20 transition cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>جاري معالجة البيانات واستخراج الطلبات...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>استيراد ملف Excel</span>
              </>
            )}
          </button>

          {/* Privacy and Automation notes */}
          <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-6 text-[10px] sm:text-xs text-slate-500 border-t border-slate-100 w-full mt-1 sm:mt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              <span>قراءة بالاعتماد على أسماء الأعمدة Header Name</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              <span>تطبيق شرط: نوع الطلب != فارغ OR رقم الطلب != فارغ</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 shrink-0" />
              <span>معالجة محلية داخل المتصفح (حماية البيانات)</span>
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-2 rounded-lg border border-rose-200 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Quick Test / Sample generator bar */}
      <div className="mt-3 sm:mt-6 bg-slate-100/80 rounded-xl p-3 sm:p-4 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[11px] sm:text-xs">
            <strong>ليس لديك ملف جاهز؟</strong> يمكنك تجربة النظام مباشرة أو تنزيل ملف نموذجي:
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            id="test-sample-500-btn"
            onClick={() => handleQuickSample(500)}
            disabled={isProcessing}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer text-[10px] sm:text-xs"
          >
            <span>تجربة 500</span>
          </button>
          <button
            id="test-sample-2000-btn"
            onClick={() => handleQuickSample(2000)}
            disabled={isProcessing}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer text-[10px] sm:text-xs"
          >
            <span>تجربة 2,000 سجل</span>
          </button>
          <button
            id="download-sample-excel-btn"
            onClick={() => downloadSampleExcel(500)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg border border-emerald-200 shadow-2xs transition cursor-pointer"
            title="تنزيل ملف Excel خام على جهازك"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تنزيل نموذج Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
