import React from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  FileSpreadsheet, 
  Filter, 
  Database,
  ArrowRight
} from 'lucide-react';
import { PORTFOLIO_COLUMNS } from '../types';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 text-slate-800">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="p-3.5 sm:p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black">
                قواعد وشروط عمل نظام «محفظتي»
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400">
                منظومة المعالجة الذكية لملفات Excel وحماية بيانات العملاء
              </p>
            </div>
          </div>
          <button
            id="close-rules-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-6 text-[11px] sm:text-sm overflow-y-auto flex-1">
          {/* Rule 1: Extraction Condition */}
          <div className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              1. شرط استخراج العميل (استخراج الطلبات فقط)
            </h4>
            <p className="text-slate-700 leading-relaxed text-[11px] sm:text-xs">
              يتم إدراج الصف في المحفظة إذا تحقق أحد الشرطين:
            </p>
            <div className="bg-white p-2 sm:p-3 rounded-lg border border-emerald-200 font-mono text-[10px] sm:text-xs font-bold text-emerald-800">
              نوع الطلب != فارغ OR رقم الطلب != فارغ
            </div>
            <p className="text-slate-500 text-[10px] sm:text-xs">
              إذا كان كلا الحقلين فارغين، يتم استبعاد الصف تلقائياً من محفظتي.
            </p>
          </div>

          {/* Rule 2: Column Headers & Aliases */}
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
              2. آلية مطابقة أسماء الأعمدة والمرادفات مع الأولوية الذكية
            </h4>
            <p className="text-slate-700 leading-relaxed text-[10px] sm:text-xs">
              لا يعتمد النظام على ترتيب العمود داخل الملف، بل يطابق الأسماء والمرادفات المحددة بحيادية تامة لحالة الأحرف (Case-insensitive) مع تجاهل المسافات الزائدة:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-700">
              <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 space-y-0.5 sm:space-y-1">
                <span className="font-bold text-emerald-800 block">1. رقم الطلب:</span>
                <span className="text-slate-600">رقم الطلب = رقم طلب سيبل = رقم طلب الخدمة = رقم طلب siebel</span>
              </div>
              <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 space-y-0.5 sm:space-y-1">
                <span className="font-bold text-emerald-800 block">2. نوع الطلب:</span>
                <span className="text-slate-600">نوع الطلب = التصنيف الفرعي = نوع طلب الخدمة</span>
              </div>
              <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 space-y-0.5 sm:space-y-1">
                <span className="font-bold text-emerald-800 block">3. الوصف:</span>
                <span className="text-slate-600">الوصف = ملاحظات على الطلب</span>
              </div>
              <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 space-y-0.5 sm:space-y-1">
                <span className="font-bold text-emerald-800 block">4. مبلغ المديونية:</span>
                <span className="text-slate-600">مبلغ المديونية = المبلغ = المديونية = LOAN_BALANCE = BALANCE</span>
              </div>
              <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 space-y-0.5 sm:space-y-1">
                <span className="font-bold text-emerald-800 block">5. نوع المنتج:</span>
                <span className="text-slate-600">نوع المنتج = المنتج = PRODUCT_CATEGORY = PRODUCT</span>
              </div>
              <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 space-y-0.5 sm:space-y-1">
                <span className="font-bold text-emerald-800 block">6. رقم الحساب:</span>
                <span className="text-slate-600">رقم الحساب = الحساب = ACCOUNT_NUMBER</span>
              </div>
              <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 space-y-0.5 sm:space-y-1">
                <span className="font-bold text-emerald-800 block">7. رقم الهوية:</span>
                <span className="text-slate-600">رقم الهوية = الهوية = ID = CUS_ID_NO</span>
              </div>
              <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 space-y-0.5 sm:space-y-1">
                <span className="font-bold text-emerald-800 block">8. اسم العميل:</span>
                <span className="text-slate-600">اسم العميل = العميل = CUST_NAME</span>
              </div>
            </div>
            <div className="bg-blue-50/70 p-2 sm:p-2.5 rounded-lg border border-blue-200 text-blue-900 text-[10px] sm:text-[11px] leading-relaxed">
              <strong>قاعدة أولوية المطابقة:</strong> عند وجود أكثر من مرادف لنفس الحقل في الملف، تُعطى الأولوية للاسم الأساسي أولاً ثم للمرادفات بحسب ترتيبها المعتمد دون اختيار عشوائي.
            </div>
          </div>

          {/* Rule 3: 12 Strict Columns */}
          <div className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
              3. الأعمدة الـ12 المعتمدة في «محفظتي»
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-1.5 pt-1">
              {PORTFOLIO_COLUMNS.map((col, idx) => (
                <div key={col.key} className="bg-white p-1.5 sm:p-2 rounded border border-slate-200 text-[10px] sm:text-xs">
                  <span className="font-bold text-slate-800">{idx + 1}. {col.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rule 4: Deduplication */}
          <div className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
              4. قواعد منع التكرار والاحتفاظ بجميع طلبات العميل
            </h4>
            <p className="text-slate-700 leading-relaxed text-[10px] sm:text-xs">
              لا يتم حذف العميل لمجرد تكرار رقم الحساب، لأن العميل قد يملك أكثر من طلب. يعتمد النظام المفتاح المركب:
              <strong className="text-slate-900 mr-1">(رقم الحساب + رقم الطلب)</strong>.
            </p>
          </div>

          {/* Rule 5: Privacy */}
          <div className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 rounded-xl bg-teal-50/60 border border-teal-100">
            <h4 className="font-bold text-teal-900 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 shrink-0" />
              5. الخصوصية ومعالجة البيانات محلياً
            </h4>
            <p className="text-teal-950 leading-relaxed text-[10px] sm:text-xs">
              تتم قراءة ومعالجة ملفات Excel محلياً بالكامل داخل متصفح المستخدم دون إرسال البيانات لأي خوادم خارجية أو نماذج ذكاء اصطناعي، ويتم الحفاظ على دقة الأرقام الحساسة (أرقام الحسابات، الهويات، الجوالات) كنصوص لمنع حذف الأصفار أو تغيير صياغتها.
            </p>
          </div>

          {/* Rule 6: WhatsApp Portfolio */}
          <div className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              6. محفظة واتساب الدائمة المستقلة
            </h4>
            <p className="text-emerald-950 leading-relaxed text-[10px] sm:text-xs">
              وظيفة موازية ومستقلة تماماً: تستخرج كل عميل يمتلك رقم جوال صالح (سواء كان لديه طلب أو بدون طلب)، وتنشئ له رابط واتساب مباشر بصيغة <code>https://wa.me/966...</code> وتُحفظ تلقائياً في المحفظة الدائمة الخاصة بها مع منع التكرار وإمكانية تصديرها المستقل إلى Excel بالأعمدة الـ 8 المحددة.
            </p>
          </div>

          {/* Rule 7: Sorting by Debt Descending */}
          <div className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <h4 className="font-bold text-amber-950 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
              7. الترتيب التلقائي حسب مبلغ المديونية تنازلياً
            </h4>
            <p className="text-amber-950 leading-relaxed text-[10px] sm:text-xs">
              في كل من «محفظة واتساب» و«محفظة الطلبات»، يتم ترتيب العملاء تلقائياً تنازلياً بحسب مبلغ المديونية، بحيث يظهر صاحب أعلى مديونية في أعلى الجدول ثم الأقل فالأقل حتى الوصول إلى أقل مبلغ مديونية، سواء في العرض أو عند تصدير الملفات.
            </p>
          </div>

          {/* Rule 8: Standard Product Codes */}
          <div className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
              8. اعتماد رموز تصنيف المنتجات الموحدة (RF, PF, AL, CC)
            </h4>
            <p className="text-indigo-950 leading-relaxed text-[10px] sm:text-xs">
              يتم توحيد عمود «نوع المنتج» تلقائياً إلى الرموز الائتمانية الأربعة المعتمدة:
              <span className="block mt-1 font-mono font-bold text-slate-800 space-y-0.5">
                <span>• <b>RF</b> : التمويل العقاري</span><br />
                <span>• <b>PF</b> : التمويل الشخصي</span><br />
                <span>• <b>AL</b> : التمويل التأجيري</span><br />
                <span>• <b>CC</b> : البطاقة الائتمانية</span>
              </span>
            </p>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            id="close-rules-footer-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer text-center"
          >
            فهمت ذلك، إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
