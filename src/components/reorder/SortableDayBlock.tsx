import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DayPlan } from '../../types';
import { GripVertical, Calendar, MapPin } from 'lucide-react';

interface SortableDayBlockProps {
  day: DayPlan;
}

export const SortableDayBlock: React.FC<SortableDayBlockProps> = ({ day }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `day-${day.dayNumber}`,
    data: {
      type: 'Day',
      day,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative p-4 bg-white border border-milk-tea-200 rounded-3xl shadow-sm mb-4 flex items-center space-x-4 select-none transition-transform duration-150 ease-out ${
        isDragging ? 'scale-105 shadow-xl' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="p-2 text-milk-tea-500 pointer-events-none">
        <GripVertical size={24} strokeWidth={2.5} />
      </div>

      <div className="flex-1 pointer-events-none">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-lg font-bold text-milk-tea-900 font-display">
            Day {day.dayNumber} · {day.title || '未命名'}
          </h4>
          <div className="flex items-center text-xs text-milk-tea-400 font-medium">
            <Calendar size={12} className="mr-1" />
            {day.date}
          </div>
        </div>
        <div className="flex items-center text-sm text-milk-tea-500">
          <MapPin size={14} className="mr-1" />
          {day.spots.length} 個景點
        </div>
      </div>

      {day.spots.length > 0 && day.spots[0].photo && (
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-milk-tea-100 flex-shrink-0 pointer-events-none">
          <img src={day.spots[0].photo} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
};
