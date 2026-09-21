import React from 'react';
import { 
  FileSpreadsheet, 
  UserCheck, 
  Layers, 
  Users, 
  UserX
} from 'lucide-react';
import { ImportSummary } from '../types';

interface StatsCardsProps {
  summary: ImportSummary | null;
  filteredCount: number;
  totalExtracted: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  summary,
  filteredCount,
  totalExtracted
}) => {
  if (!summary) return null;

  const cards = [
    {
      id: 'stat-total-rows',
      title: 'إجمالي السجلات المستوردة',
      value: summary.totalRows.toLocaleString('ar-SA'),
      subtext: `من ملف: ${summary.fileName}`,
      icon: FileSpreadsheet,
      accentColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100'
    },
    {
      id: 'stat-extracted-requests',
      title: 'العملاء الذين لديهم طلبات',
      value: totalExtracted.toLocaleString('ar-SA'),
      subtext: `${((totalExtracted / (summary.totalRows || 1)) * 100).toFixed(1)}% من إجمالي الملف`,
      icon: UserCheck,
      accentColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100'
    },
    {
      id: 'stat-total-requests',
      title: 'عدد الطلبات',
      value: summary.totalRequests.toLocaleString('ar-SA'),
      subtext: 'سجلات طلبات صالحة ومستقلة',
      icon: Layers,
      accentColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-100'
    },
    {
      id: 'stat-unique-customers',
      title: 'عدد العملاء الفريدين',
      value: summary.uniqueCustomers.toLocaleString('ar-SA'),
      subtext: 'عملاء بدون تكرار الحسابات',
      icon: Users,
      accentColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100'
    },
    {
      id: 'stat-excluded-rows',
      title: 'السجلات المستبعدة لعدم وجود طلب',
      value: summary.excludedNoRequests.toLocaleString('ar-SA'),
      subtext: 'نوع الطلب ورقم الطلب فارغان',
      icon: UserX,
      accentColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100'
    }
  ];

  return (
    <div className="space-y-2.5 my-3 sm:my-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const isLastOnMobileOdd = idx === 4; // 5th card spans 2 columns on mobile 2-col grid
          return (
            <div
              key={card.id}
              id={card.id}
              className={`bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-4 shadow-2xs hover:shadow-xs transition relative overflow-hidden ${
                isLastOnMobileOdd ? 'col-span-2 sm:col-span-1 lg:col-span-1' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500 leading-tight truncate sm:whitespace-normal">
                    {card.title}
                  </p>
                  <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                    {card.value}
                  </p>
                </div>
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg ${card.bgColor} ${card.accentColor} flex items-center justify-center shrink-0 border ${card.borderColor}`}>
                  <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 truncate">
                {card.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {filteredCount !== totalExtracted && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs font-medium flex items-center justify-between">
          <span>
            يتم حالياً عرض <strong>{filteredCount.toLocaleString('ar-SA')}</strong> سجل بعد الفلترة (من أصل {totalExtracted.toLocaleString('ar-SA')} سجل).
          </span>
        </div>
      )}
    </div>
  );
};
