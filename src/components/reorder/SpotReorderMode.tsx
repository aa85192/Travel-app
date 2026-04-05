import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTripStore } from '../../stores/tripStore';
import { SortableSpotCard } from './SortableSpotCard';
import { SpotCard } from '../itinerary/SpotCard';
import { Spot, DayPlan } from '../../types';

// ─── 每一天都包成獨立的 droppable 容器 ────────────────────
// 這讓「拖到空白日子」成為可能（原本 SortableContext 在空陣列時沒有 drop target）
const DayDroppable: React.FC<{ day: DayPlan }> = ({ day }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-container-${day.dayNumber}`,
    data: { type: 'DayContainer', dayNumber: day.dayNumber },
  });

  return (
    <div
      ref={setNodeRef}
      className={`px-6 space-y-4 min-h-[120px] rounded-3xl transition-colors ${isOver ? 'bg-milk-tea-100/60' : ''}`}
    >
      <SortableContext
        id={`day-${day.dayNumber}`}
        items={day.spots.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        {day.spots.map((spot) => (
          <SortableSpotCard
            key={spot.id}
            spot={spot}
            dayNumber={day.dayNumber}
          />
        ))}
        {day.spots.length === 0 && (
          <div className="p-8 border-2 border-dashed border-milk-tea-200 rounded-3xl flex flex-col items-center justify-center text-milk-tea-300">
            <p className="text-sm font-medium">拖拉景點到此處</p>
          </div>
        )}
      </SortableContext>
    </div>
  );
};

export const SpotReorderMode: React.FC = () => {
  const { trip, reorderSpots, moveSpotAcrossDays } = useTripStore();
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [activeDayNumber, setActiveDayNumber] = useState<number | null>(null);

  // ─── 關鍵：改為 delay 啟動，行動裝置上才能同時支援捲動與拖拉 ───
  // 長按 250ms 且移動不超過 8px → 啟動拖拉
  // 其餘情況（快速滑動、輕觸）→ 瀏覽器正常捲動
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === 'Spot') {
      setActiveSpot(data.spot);
      setActiveDayNumber(data.dayNumber);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSpot(null);
    setActiveDayNumber(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    if (activeData?.type !== 'Spot') return;

    const sourceDay: number = activeData.dayNumber;

    // 決定 targetDay —— 正確區分「拖到另一張卡」vs「拖到空白容器」
    let targetDay: number | null = null;
    if (overData?.type === 'Spot') {
      targetDay = overData.dayNumber;
    } else if (overData?.type === 'DayContainer') {
      targetDay = overData.dayNumber;
    }
    if (targetDay === null || Number.isNaN(targetDay)) return;

    const targetDayObj = trip.days.find((d) => d.dayNumber === targetDay);
    if (!targetDayObj) return;

    if (sourceDay === targetDay) {
      // ─── 同一天內排序 ───
      const oldIndex = targetDayObj.spots.findIndex((s) => s.id === active.id);
      const newIndex =
        overData?.type === 'Spot'
          ? targetDayObj.spots.findIndex((s) => s.id === over.id)
          : targetDayObj.spots.length - 1;

      if (oldIndex !== -1 && oldIndex !== newIndex) {
        reorderSpots(sourceDay, oldIndex, newIndex);
      }
    } else {
      // ─── 跨天移動 ───
      const targetIndex =
        overData?.type === 'Spot'
          ? targetDayObj.spots.findIndex((s) => s.id === over.id)
          : targetDayObj.spots.length; // 放到空白容器 → 插在最後

      moveSpotAcrossDays(
        active.id.toString(),
        sourceDay,
        targetDay,
        targetIndex === -1 ? targetDayObj.spots.length : targetIndex
      );
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* 頂部提示：告訴使用者長按啟動 */}
      <div className="sticky top-0 z-30 bg-milk-tea-500 text-white text-center py-2 text-sm font-medium">
        🔀 拖拉模式中 · 長按卡片拖動
      </div>

      <div className="space-y-12 pb-24 pt-4">
        {trip.days.map((day) => (
          <div key={day.dayNumber} className="relative">
            <div className="sticky top-12 z-20 bg-milk-tea-50/80 backdrop-blur-md py-4 px-6 border-b border-milk-tea-200 mb-6">
              <h3 className="text-xl font-bold text-milk-tea-900 font-display">
                Day {day.dayNumber} · {day.title || '未命名'}
              </h3>
            </div>
            <DayDroppable day={day} />
          </div>
        ))}
      </div>

      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: '0.5' } },
          }),
        }}
      >
        {activeSpot ? (
          <div className="scale-105 rotate-2 shadow-2xl opacity-90 pointer-events-none">
            <SpotCard spot={activeSpot} dayNumber={activeDayNumber || 1} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
