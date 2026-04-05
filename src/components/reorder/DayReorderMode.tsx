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
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTripStore } from '../../stores/tripStore';
import { SortableDayBlock } from './SortableDayBlock';
import { DayPlan } from '../../types';

export const DayReorderMode: React.FC = () => {
  const { trip, reorderDays } = useTripStore();
  const [activeDay, setActiveDay] = useState<DayPlan | null>(null);

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
    const { active } = event;
    const data = active.data.current;
    if (data?.type === 'Day') {
      setActiveDay(data.day);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDay(null);

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId !== overId) {
      const oldIndex = trip.days.findIndex((d) => `day-${d.dayNumber}` === activeId);
      const newIndex = trip.days.findIndex((d) => `day-${d.dayNumber}` === overId);
      reorderDays(oldIndex, newIndex);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="px-6 py-24 space-y-4">
        <SortableContext
          items={trip.days.map((d) => `day-${d.dayNumber}`)}
          strategy={verticalListSortingStrategy}
        >
          {trip.days.map((day) => (
            <SortableDayBlock key={day.dayNumber} day={day} />
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeDay ? (
          <div className="scale-105 rotate-2 shadow-2xl opacity-90">
            <SortableDayBlock day={activeDay} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
