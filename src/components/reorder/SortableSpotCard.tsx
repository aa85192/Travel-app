import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Spot } from '../../types';
import { SpotCard } from '../itinerary/SpotCard';
import { GripVertical } from 'lucide-react';

interface SortableSpotCardProps {
  spot: Spot;
  dayNumber: number;
  index: number;
}

export const SortableSpotCard: React.FC<SortableSpotCardProps> = ({ spot, dayNumber, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: spot.id,
    data: {
      type: 'Spot',
      spot,
      dayNumber,
      index,
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
      // 關鍵：整張 wrapper 都是拖拉目標，不再依賴細小的把手
      className={`relative select-none transition-transform duration-150 ease-out ${isDragging ? 'scale-105' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* 拖拉提示圖示 —— 永遠可見（不用 group-hover），pointer-events-none 不吃事件 */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-milk-tea-500">
        <GripVertical size={22} strokeWidth={2.5} />
      </div>

      {/* 內層 SpotCard：pointer-events-none 阻擋內部按鈕誤觸
          觸控事件會穿透此元素，被外層 wrapper 的 listeners 接收 */}
      <div className="pointer-events-none pl-9">
        <SpotCard spot={spot} dayNumber={dayNumber} index={index} />
      </div>
    </div>
  );
};
