import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Trip, Spot, DayPlan, Transit, TransportMode, TodoItem } from '../types';
import { SAMPLE_TRIP } from '../data';
import { recalculateDayTransits } from '../utils/recalculateTransits';
import { getAuthHash } from '../components/PasswordGate';

/**
 * 依登入的密碼雜湊值產生儲存 key，確保不同密碼的使用者資料完全隔離。
 * 未登入時使用 'default'（實際上 App.tsx 會先攔截，不應到達此處）。
 */
function getTripStorageKey(): string {
  const hash = getAuthHash();
  return hash ? `milktea-travel-${hash.slice(0, 16)}` : 'milktea-travel-default';
}

interface TripState {
  trip: Trip;
  setTrip: (trip: Trip) => void;
  
  // Trip Info
  updateTripInfo: (updates: Partial<Trip>) => void;
  
  // Day Actions
  updateDay: (dayNumber: number, updates: Partial<DayPlan>) => void;
  addDay: () => void;
  deleteDay: (dayNumber: number) => void;
  reorderDays: (fromIndex: number, toIndex: number) => void;
  
  // Spot Actions
  addSpot: (dayNumber: number, spot: Omit<Spot, 'id' | 'order'>) => void;
  updateSpot: (dayNumber: number, spotId: string, updates: Partial<Spot>) => void;
  deleteSpot: (dayNumber: number, spotId: string) => void;
  reorderSpots: (dayNumber: number, fromIndex: number, toIndex: number) => void;
  moveSpotAcrossDays: (spotId: string, fromDay: number, toDay: number, targetIndex: number) => void;
  // Transit Actions
  updateTransitMode: (dayNumber: number, transitId: string, mode: TransportMode) => void;

  // Todo Actions — Spot todos
  addSpotTodo: (dayNumber: number, spotId: string, text: string) => void;
  toggleSpotTodo: (dayNumber: number, spotId: string, todoId: string) => void;
  updateSpotTodo: (dayNumber: number, spotId: string, todoId: string, text: string) => void;
  deleteSpotTodo: (dayNumber: number, spotId: string, todoId: string) => void;

  // Todo Actions — Unclassified (trip-level)
  addUnclassifiedTodo: (text: string, date?: string) => void;
  toggleUnclassifiedTodo: (todoId: string) => void;
  updateUnclassifiedTodo: (todoId: string, text: string) => void;
  deleteUnclassifiedTodo: (todoId: string) => void;

  // Move an unclassified todo onto a spot (preserves done state)
  linkUnclassifiedTodoToSpot: (todoId: string, dayNumber: number, spotId: string) => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      trip: SAMPLE_TRIP,
      setTrip: (trip) => set({ trip }),

      updateTripInfo: (updates) => set((state) => {
        const newTrip = { ...state.trip, ...updates };
        
        // Handle date range changes
        if (updates.startDate || updates.endDate) {
          const start = new Date(newTrip.startDate);
          const end = new Date(newTrip.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          
          let newDays = [...newTrip.days];
          if (diffDays > newDays.length) {
            // Add days
            for (let i = newDays.length; i < diffDays; i++) {
              const date = new Date(start);
              date.setDate(start.getDate() + i);
              newDays.push({
                dayNumber: i + 1,
                date: date.toISOString().split('T')[0],
                spots: [],
                transits: [],
              });
            }
          } else if (diffDays < newDays.length) {
            // Remove days (with warning handled in UI)
            newDays = newDays.slice(0, diffDays);
          }
          
          // Update all dates to match start date
          newDays = newDays.map((day, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            return {
              ...day,
              dayNumber: i + 1,
              date: date.toISOString().split('T')[0],
            };
          });
          
          newTrip.days = newDays;
        }
        
        return { trip: newTrip };
      }),

      updateDay: (dayNumber, updates) => set((state) => {
        const newDays = state.trip.days.map((day) =>
          day.dayNumber === dayNumber ? { ...day, ...updates } : day
        );
        return { trip: { ...state.trip, days: newDays } };
      }),

      addDay: () => set((state) => {
        const lastDay = state.trip.days[state.trip.days.length - 1];
        const nextDate = new Date(lastDay.date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const newDay: DayPlan = {
          dayNumber: state.trip.days.length + 1,
          date: nextDate.toISOString().split('T')[0],
          spots: [],
          transits: [],
        };
        
        return {
          trip: {
            ...state.trip,
            endDate: nextDate.toISOString().split('T')[0],
            days: [...state.trip.days, newDay],
          },
        };
      }),

      deleteDay: (dayNumber) => set((state) => {
        const newDays = state.trip.days
          .filter((day) => day.dayNumber !== dayNumber)
          .map((day, index) => ({
            ...day,
            dayNumber: index + 1,
          }));

        const newEndDate = newDays.length > 0
          ? newDays[newDays.length - 1].date
          : state.trip.startDate;

        return { trip: { ...state.trip, days: newDays, endDate: newEndDate } };
      }),

      reorderDays: (fromIndex, toIndex) => set((state) => {
        const newDays = [...state.trip.days];
        const [movedDay] = newDays.splice(fromIndex, 1);
        newDays.splice(toIndex, 0, movedDay);
        
        // Re-index and re-date
        const start = new Date(state.trip.startDate);
        const updatedDays = newDays.map((day, i) => {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          return {
            ...day,
            dayNumber: i + 1,
            date: date.toISOString().split('T')[0],
          };
        });
        
        return { trip: { ...state.trip, days: updatedDays } };
      }),

      addSpot: (dayNumber, spotData) => set((state) => {
        const newDays = state.trip.days.map((day) => {
          if (day.dayNumber === dayNumber) {
            const newSpot: Spot = {
              ...spotData,
              id: `spot_${Date.now()}`,
              order: day.spots.length,
            };
            const updatedDay = { ...day, spots: [...day.spots, newSpot] };
            updatedDay.transits = recalculateDayTransits(updatedDay);
            return updatedDay;
          }
          return day;
        });
        return { trip: { ...state.trip, days: newDays } };
      }),

      updateSpot: (dayNumber, spotId, updates) => set((state) => {
        const newDays = state.trip.days.map((day) => {
          if (day.dayNumber === dayNumber) {
            const newSpots = day.spots.map((spot) =>
              spot.id === spotId ? { ...spot, ...updates } : spot
            );
            const updatedDay = { ...day, spots: newSpots };
            
            // If location changed, recalculate transits
            if (updates.lat !== undefined || updates.lng !== undefined) {
              updatedDay.transits = recalculateDayTransits(updatedDay);
            }
            return updatedDay;
          }
          return day;
        });
        return { trip: { ...state.trip, days: newDays } };
      }),

      deleteSpot: (dayNumber, spotId) => set((state) => {
        const newDays = state.trip.days.map((day) => {
          if (day.dayNumber === dayNumber) {
            const newSpots = day.spots
              .filter((spot) => spot.id !== spotId)
              .map((spot, index) => ({ ...spot, order: index }));
            const updatedDay = { ...day, spots: newSpots };
            updatedDay.transits = recalculateDayTransits(updatedDay);
            return updatedDay;
          }
          return day;
        });
        return { trip: { ...state.trip, days: newDays } };
      }),

      reorderSpots: (dayNumber, fromIndex, toIndex) => set((state) => {
        const newDays = state.trip.days.map((day) => {
          if (day.dayNumber === dayNumber) {
            const newSpots = [...day.spots];
            const [movedSpot] = newSpots.splice(fromIndex, 1);
            newSpots.splice(toIndex, 0, movedSpot);
            
            const updatedSpots = newSpots.map((spot, index) => ({ ...spot, order: index }));
            const updatedDay = { ...day, spots: updatedSpots };
            updatedDay.transits = recalculateDayTransits(updatedDay);
            return updatedDay;
          }
          return day;
        });
        return { trip: { ...state.trip, days: newDays } };
      }),

      moveSpotAcrossDays: (spotId, fromDay, toDay, targetIndex) => set((state) => {
        let movedSpot: Spot | null = null;
        
        // Remove from source
        const intermediateDays = state.trip.days.map((day) => {
          if (day.dayNumber === fromDay) {
            const spot = day.spots.find((s) => s.id === spotId);
            if (spot) movedSpot = spot;
            const newSpots = day.spots
              .filter((s) => s.id !== spotId)
              .map((s, i) => ({ ...s, order: i }));
            const updatedDay = { ...day, spots: newSpots };
            updatedDay.transits = recalculateDayTransits(updatedDay);
            return updatedDay;
          }
          return day;
        });

        if (!movedSpot) return state;

        // Add to target
        const finalDays = intermediateDays.map((day) => {
          if (day.dayNumber === toDay) {
            const newSpots = [...day.spots];
            newSpots.splice(targetIndex, 0, movedSpot!);
            const updatedSpots = newSpots.map((s, i) => ({ ...s, order: i }));
            const updatedDay = { ...day, spots: updatedSpots };
            updatedDay.transits = recalculateDayTransits(updatedDay);
            return updatedDay;
          }
          return day;
        });

        return { trip: { ...state.trip, days: finalDays } };
      }),

      updateTransitMode: (dayNumber, transitId, mode) => set((state) => {
        const newDays = state.trip.days.map((day) => {
          if (day.dayNumber !== dayNumber) return day;
          const newTransits = day.transits.map((t) =>
            t.id === transitId ? { ...t, selectedMode: mode } : t
          );
          return { ...day, transits: newTransits };
        });
        return { trip: { ...state.trip, days: newDays } };
      }),

      // ───── Spot todos ─────────────────────────────────────────
      addSpotTodo: (dayNumber, spotId, text) => set((state) => {
        const trimmed = text.trim();
        if (!trimmed) return state;
        const todo: TodoItem = {
          id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text: trimmed,
          done: false,
        };
        const newDays = state.trip.days.map((day) => {
          if (day.dayNumber !== dayNumber) return day;
          const newSpots = day.spots.map((s) =>
            s.id === spotId ? { ...s, todos: [...(s.todos ?? []), todo] } : s
          );
          return { ...day, spots: newSpots };
        });
        return { trip: { ...state.trip, days: newDays } };
      }),

      toggleSpotTodo: (dayNumber, spotId, todoId) => set((state) => {
        const newDays = state.trip.days.map((day) => {
          if (day.dayNumber !== dayNumber) return day;
          const newSpots = day.spots.map((s) => {
            if (s.id !== spotId) return s;
            const todos = (s.todos ?? []).map((t) =>
              t.id === todoId ? { ...t, done: !t.done } : t
            );
            return { ...s, todos };
          });
          return { ...day, spots: newSpots };
        });
        return { trip: { ...state.trip, days: newDays } };
      }),

      updateSpotTodo: (dayNumber, spotId, todoId, text) => set((state) => {
        const trimmed = text.trim();
        if (!trimmed) return state;
        const newDays = state.trip.days.map((day) => {
          if (day.dayNumber !== dayNumber) return day;
          const newSpots = day.spots.map((s) => {
            if (s.id !== spotId) return s;
            const todos = (s.todos ?? []).map((t) =>
              t.id === todoId ? { ...t, text: trimmed } : t
            );
            return { ...s, todos };
          });
          return { ...day, spots: newSpots };
        });
        return { trip: { ...state.trip, days: newDays } };
      }),

      deleteSpotTodo: (dayNumber, spotId, todoId) => set((state) => {
        const newDays = state.trip.days.map((day) => {
          if (day.dayNumber !== dayNumber) return day;
          const newSpots = day.spots.map((s) => {
            if (s.id !== spotId) return s;
            const todos = (s.todos ?? []).filter((t) => t.id !== todoId);
            return { ...s, todos };
          });
          return { ...day, spots: newSpots };
        });
        return { trip: { ...state.trip, days: newDays } };
      }),

      // ───── Unclassified todos ─────────────────────────────────
      addUnclassifiedTodo: (text, date) => set((state) => {
        const trimmed = text.trim();
        if (!trimmed) return state;
        const todo: TodoItem = {
          id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text: trimmed,
          done: false,
          ...(date ? { date } : {}),
        };
        return {
          trip: {
            ...state.trip,
            unclassifiedTodos: [...(state.trip.unclassifiedTodos ?? []), todo],
          },
        };
      }),

      toggleUnclassifiedTodo: (todoId) => set((state) => ({
        trip: {
          ...state.trip,
          unclassifiedTodos: (state.trip.unclassifiedTodos ?? []).map((t) =>
            t.id === todoId ? { ...t, done: !t.done } : t
          ),
        },
      })),

      updateUnclassifiedTodo: (todoId, text) => set((state) => {
        const trimmed = text.trim();
        if (!trimmed) return state;
        return {
          trip: {
            ...state.trip,
            unclassifiedTodos: (state.trip.unclassifiedTodos ?? []).map((t) =>
              t.id === todoId ? { ...t, text: trimmed } : t
            ),
          },
        };
      }),

      deleteUnclassifiedTodo: (todoId) => set((state) => ({
        trip: {
          ...state.trip,
          unclassifiedTodos: (state.trip.unclassifiedTodos ?? []).filter((t) => t.id !== todoId),
        },
      })),

      linkUnclassifiedTodoToSpot: (todoId, dayNumber, spotId) => set((state) => {
        const todo = (state.trip.unclassifiedTodos ?? []).find((t) => t.id === todoId);
        if (!todo) return state;
        const moved: TodoItem = { id: todo.id, text: todo.text, done: todo.done };
        const newDays = state.trip.days.map((day) => {
          if (day.dayNumber !== dayNumber) return day;
          const newSpots = day.spots.map((s) =>
            s.id === spotId ? { ...s, todos: [...(s.todos ?? []), moved] } : s
          );
          return { ...day, spots: newSpots };
        });
        return {
          trip: {
            ...state.trip,
            days: newDays,
            unclassifiedTodos: (state.trip.unclassifiedTodos ?? []).filter((t) => t.id !== todoId),
          },
        };
      }),

      duplicateSpot: (spotId, fromDay, toDay) => set((state) => {
        const sourceDay = state.trip.days.find((d) => d.dayNumber === fromDay);
        if (!sourceDay) return state;

        const spotToCopy = sourceDay.spots.find((s) => s.id === spotId);
        if (!spotToCopy) return state;

        const newDays = state.trip.days.map((day) => {
          if (day.dayNumber === toDay) {
            const newSpot: Spot = {
              ...spotToCopy,
              id: `spot_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              order: day.spots.length,
            };
            const updatedDay = { ...day, spots: [...day.spots, newSpot] };
            updatedDay.transits = recalculateDayTransits(updatedDay);
            return updatedDay;
          }
          return day;
        });

        return { trip: { ...state.trip, days: newDays } };
      }),
    }),
    {
      name: getTripStorageKey(),
    }
  )
);
