import React from 'react';
import { X, Download, FileText, Image as ImageIcon, ExternalLink, Maximize2 } from 'lucide-react';
import { CustomerAttachment } from '../types';

interface AttachmentPreviewModalProps {
  attachment: CustomerAttachment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  attachment,
  isOpen,
  onClose
}) => {
  if (!isOpen || !attachment) return null;

  const isImage = attachment.fileType.startsWith('image/') || 
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(attachment.fileName);
  const isPdf = attachment.fileType === 'application/pdf' || 
    /\.pdf$/i.test(attachment.fileName);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = attachment.dataUrl;
    a.download = attachment.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInNewTab = () => {
    const win = window.open();
    if (win) {
      if (isPdf) {
        win.document.write(
          `<iframe src="${attachment.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      } else if (isImage) {
        win.document.write(
          `<body style="margin:0; background:#0f172a; display:flex; justify-content:center; align-items:center; height:100vh;"><img src="${attachment.dataUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" /></body>`
        );
      } else {
        win.location.href = attachment.dataUrl;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="p-3 sm:p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              {isImage ? <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>
            <div className="truncate min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate" title={attachment.fileName}>
                {attachment.fileName}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">
                {attachment.slotTitle} • {attachment.formattedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleOpenInNewTab}
              className="p-1 sm:p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              title="فتح في نافذة جديدة كاملة"
            >
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>تحميل</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-slate-950/70 min-h-[250px] sm:min-h-[350px]">
          {isImage ? (
            <img 
              src={attachment.dataUrl} 
              alt={attachment.fileName}
              className="max-w-full max-h-[65vh] sm:max-h-[70vh] object-contain rounded-lg shadow-lg border border-slate-800" 
            />
          ) : isPdf ? (
            <iframe
              src={attachment.dataUrl}
              title={attachment.fileName}
              className="w-full h-[60vh] sm:h-[65vh] rounded-lg border border-slate-800 bg-white"
            />
          ) : (
            <div className="text-center p-6 sm:p-8 space-y-3 sm:space-y-4 max-w-md">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-200">
                  معاينة مباشرة غير متاحة لهذا النوع من الملفات
                </h5>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                  يمكنك تحميل الملف والاطلاع عليه على جهازك مباشرة
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold shadow-md transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>تحميل المستند الآن</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
