import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ListChecks, Plus, X, Check, ChevronDown, MapPin, CalendarDays,
} from 'lucide-react';
import { useTripStore } from '../stores/tripStore';
import { Spot, TodoItem } from '../types';
import { PhotoThumbnail } from '../components/common/PhotoThumbnail';

interface TodoListProps {
  onBack: () => void;
}

// 目標選擇：spotId 為 null 表示「該日的未分類」；dayNumber 為 null 表示「未指定日期」。
type Target = {
  dayNumber: number | null;
  spotId: string | null;
};

const DEFAULT_TARGET: Target = { dayNumber: null, spotId: null };

function targetLabel(target: Target, days: { dayNumber: number; spots: Spot[] }[]): string {
  if (target.dayNumber === null) return '未指定 · 未分類';
  const day = days.find((d) => d.dayNumber === target.dayNumber);
  if (!day) return '未指定 · 未分類';
  if (!target.spotId) return `Day ${day.dayNumber} · 未分類`;
  const spot = day.spots.find((s) => s.id === target.spotId);
  return spot ? `Day ${day.dayNumber} · ${spot.name}` : `Day ${day.dayNumber}`;
}

function formatDateLabel(dateStr: string): string {
  // 2026-05-10 -> 5/10 週日
  try {
    const d = new Date(dateStr);
    const wk = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return `${d.getMonth() + 1}/${d.getDate()} 週${wk}`;
  } catch {
    return dateStr;
  }
}

// 通用 Todo 行：可勾選 / 編輯文字 / 刪除
interface RowProps {
  todo: TodoItem;
  onToggle: () => void;
  onUpdate: (text: string) => void;
  onDelete: () => void;
}

const TodoRow: React.FC<RowProps> = ({ todo, onToggle, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = () => {
    if (text.trim() && text.trim() !== todo.text) onUpdate(text);
    else setText(todo.text);
    setEditing(false);
  };

  return (
    <div className="flex items-center group py-1">
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all active:scale-90"
        style={{
          borderColor: todo.done ? '#FF8FAF' : '#FFBFCA',
          backgroundColor: todo.done ? '#FF8FAF' : 'transparent',
        }}
        aria-label={todo.done ? '標記為未完成' : '標記為已完成'}
      >
        {todo.done && <Check size={12} className="text-white" strokeWidth={3} />}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') { setText(todo.text); setEditing(false); }
          }}
          className="flex-1 ml-2 mr-1 text-sm bg-milk-tea-50 border border-milk-tea-200 rounded-lg px-2 py-1 focus:outline-none focus:border-milk-tea-400 text-milk-tea-800"
        />
      ) : (
        <button
          onClick={() => { setText(todo.text); setEditing(true); }}
          className={`flex-1 ml-2 mr-1 text-left text-sm leading-snug py-1 transition-colors ${
            todo.done
              ? 'line-through text-milk-tea-300'
              : 'text-milk-tea-800 hover:text-milk-tea-600'
          }`}
        >
          {todo.text}
        </button>
      )}

      <button
        onClick={onDelete}
        className="flex-shrink-0 p-1 text-milk-tea-200 hover:text-red-400 transition-colors"
        aria-label="刪除"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const TodoList: React.FC<TodoListProps> = ({ onBack }) => {
  const {
    trip,
    addSpotTodo, toggleSpotTodo, updateSpotTodo, deleteSpotTodo,
    addUnclassifiedTodo, toggleUnclassifiedTodo, updateUnclassifiedTodo, deleteUnclassifiedTodo,
  } = useTripStore();

  const [draft, setDraft] = useState('');
  const [target, setTarget] = useState<Target>(DEFAULT_TARGET);
  const [pickerOpen, setPickerOpen] = useState(false);

  const totals = useMemo(() => {
    let done = 0, total = 0;
    trip.days.forEach((d) => {
      d.spots.forEach((s) => {
        (s.todos ?? []).forEach((t) => { total++; if (t.done) done++; });
      });
    });
    (trip.unclassifiedTodos ?? []).forEach((t) => { total++; if (t.done) done++; });
    return { done, total };
  }, [trip]);

  const unclassifiedByDate = useMemo(() => {
    const map = new Map<string, TodoItem[]>();
    const noDate: TodoItem[] = [];
    (trip.unclassifiedTodos ?? []).forEach((t) => {
      if (t.date) {
        if (!map.has(t.date)) map.set(t.date, []);
        map.get(t.date)!.push(t);
      } else {
        noDate.push(t);
      }
    });
    return { map, noDate };
  }, [trip.unclassifiedTodos]);

  const handleAdd = () => {
    if (!draft.trim()) return;
    if (target.dayNumber !== null && target.spotId) {
      addSpotTodo(target.dayNumber, target.spotId, draft);
    } else if (target.dayNumber !== null) {
      // 該日的「未分類」→ 帶 date 的 unclassified todo
      const day = trip.days.find((d) => d.dayNumber === target.dayNumber);
      addUnclassifiedTodo(draft, day?.date);
    } else {
      addUnclassifiedTodo(draft);
    }
    setDraft('');
  };

  return (
    <div className="min-h-screen bg-milk-tea-50 pb-32">
      {/* Header */}
      <header className="px-6 pt-10 pb-4 flex items-center space-x-3">
        <button
          onClick={onBack}
          className="w-9 h-9 bg-white rounded-full shadow-sm flex items-center justify-center border border-milk-tea-100 text-milk-tea-500"
          aria-label="返回"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight text-milk-tea-900 flex items-center">
            <ListChecks className="w-5 h-5 mr-2 text-milk-tea-500" />
            待辦總表
          </h1>
          <p className="text-[11px] text-milk-tea-400 mt-0.5">
            自動同步各景點待辦 · {totals.done}/{totals.total} 已完成
          </p>
        </div>
      </header>

      {/* Quick Add */}
      <div className="px-6 mb-4">
        <div className="bg-white rounded-3xl shadow-sm border border-milk-tea-100 p-3 space-y-2">
          <div className="flex items-center">
            <Plus size={16} className="text-milk-tea-400 ml-1 mr-2 flex-shrink-0" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="新增一則待辦事項…"
              className="flex-1 text-sm bg-transparent border-none focus:outline-none placeholder:text-milk-tea-300 text-milk-tea-800 py-1"
            />
            <button
              onClick={handleAdd}
              disabled={!draft.trim()}
              className="ml-2 px-3 py-1.5 bg-milk-tea-500 text-white rounded-xl text-xs font-bold disabled:opacity-30 disabled:bg-milk-tea-300 active:scale-95 transition-all"
            >
              加入
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="w-full flex items-center justify-between bg-milk-tea-50 border border-milk-tea-100 rounded-2xl px-3 py-2 text-xs text-milk-tea-700 hover:border-milk-tea-300 transition-colors"
            >
              <span className="flex items-center min-w-0">
                <MapPin size={12} className="mr-1.5 text-milk-tea-400 flex-shrink-0" />
                <span className="truncate">加到：<span className="font-bold text-milk-tea-800 ml-1">{targetLabel(target, trip.days)}</span></span>
              </span>
              <ChevronDown
                size={14}
                className={`text-milk-tea-400 transition-transform flex-shrink-0 ml-2 ${pickerOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {pickerOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setPickerOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 z-40 bg-white rounded-2xl shadow-xl border border-milk-tea-100 max-h-72 overflow-y-auto py-1.5"
                  >
                    <button
                      onClick={() => { setTarget({ dayNumber: null, spotId: null }); setPickerOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center hover:bg-milk-tea-50 ${
                        target.dayNumber === null ? 'bg-milk-tea-50' : ''
                      }`}
                    >
                      <span className="text-milk-tea-400 mr-2">📌</span>
                      <span className="font-bold text-milk-tea-700">未指定 · 未分類</span>
                    </button>

                    {trip.days.map((day) => (
                      <div key={day.dayNumber} className="border-t border-milk-tea-50 mt-1 pt-1">
                        <p className="px-4 pb-1 text-[10px] uppercase tracking-wider font-bold text-milk-tea-400">
                          Day {day.dayNumber} · {formatDateLabel(day.date)}
                        </p>
                        <button
                          onClick={() => { setTarget({ dayNumber: day.dayNumber, spotId: null }); setPickerOpen(false); }}
                          className={`w-full text-left px-4 py-1.5 text-xs flex items-center hover:bg-milk-tea-50 ${
                            target.dayNumber === day.dayNumber && !target.spotId ? 'bg-milk-tea-50' : ''
                          }`}
                        >
                          <span className="text-milk-tea-400 mr-2">📌</span>
                          <span className="text-milk-tea-700">未分類（此日）</span>
                        </button>
                        {day.spots.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => { setTarget({ dayNumber: day.dayNumber, spotId: s.id }); setPickerOpen(false); }}
                            className={`w-full text-left px-4 py-1.5 text-xs flex items-center hover:bg-milk-tea-50 ${
                              target.dayNumber === day.dayNumber && target.spotId === s.id ? 'bg-milk-tea-50' : ''
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-milk-tea-300 mr-2 flex-shrink-0" />
                            <span className="text-milk-tea-800 truncate">{s.name}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Day-by-day sections */}
      <div className="px-6 space-y-5">
        {trip.days.map((day) => {
          const datedUnclassified = unclassifiedByDate.map.get(day.date) ?? [];
          const spotTodoCount = day.spots.reduce((acc, s) => acc + (s.todos?.length ?? 0), 0);
          const dayTotal = spotTodoCount + datedUnclassified.length;
          if (dayTotal === 0) return (
            <DaySection
              key={day.dayNumber}
              dayNumber={day.dayNumber}
              dateLabel={formatDateLabel(day.date)}
              dayTotal={0}
            >
              <p className="text-xs text-milk-tea-300 italic px-1 py-2">這一天還沒有待辦，從上方加入吧。</p>
            </DaySection>
          );

          const dayDoneCount =
            day.spots.reduce((acc, s) => acc + ((s.todos ?? []).filter((t) => t.done).length), 0) +
            datedUnclassified.filter((t) => t.done).length;

          return (
            <DaySection
              key={day.dayNumber}
              dayNumber={day.dayNumber}
              dateLabel={formatDateLabel(day.date)}
              dayTotal={dayTotal}
              dayDone={dayDoneCount}
            >
              <div className="space-y-3">
                {day.spots
                  .filter((s) => (s.todos?.length ?? 0) > 0)
                  .map((s) => (
                    <SpotGroup key={s.id} spot={s}>
                      {(s.todos ?? []).map((t) => (
                        <TodoRow
                          key={t.id}
                          todo={t}
                          onToggle={() => toggleSpotTodo(day.dayNumber, s.id, t.id)}
                          onUpdate={(text) => updateSpotTodo(day.dayNumber, s.id, t.id, text)}
                          onDelete={() => deleteSpotTodo(day.dayNumber, s.id, t.id)}
                        />
                      ))}
                    </SpotGroup>
                  ))}

                {datedUnclassified.length > 0 && (
                  <UnclassifiedGroup label="未分類（此日）">
                    {datedUnclassified.map((t) => (
                      <TodoRow
                        key={t.id}
                        todo={t}
                        onToggle={() => toggleUnclassifiedTodo(t.id)}
                        onUpdate={(text) => updateUnclassifiedTodo(t.id, text)}
                        onDelete={() => deleteUnclassifiedTodo(t.id)}
                      />
                    ))}
                  </UnclassifiedGroup>
                )}
              </div>
            </DaySection>
          );
        })}

        {/* 未指定日期 */}
        <div className="bg-white rounded-3xl shadow-sm border border-milk-tea-100 overflow-hidden">
          <div className="px-4 py-3 flex items-center bg-gradient-to-r from-milk-tea-50 to-white border-b border-milk-tea-50">
            <div className="w-8 h-8 rounded-xl bg-milk-tea-100 flex items-center justify-center mr-3 text-milk-tea-500">
              <CalendarDays size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-milk-tea-900 font-display">未指定日期</p>
              <p className="text-[10px] text-milk-tea-400">{unclassifiedByDate.noDate.length} 則待辦</p>
            </div>
          </div>
          <div className="p-3">
            {unclassifiedByDate.noDate.length === 0 ? (
              <p className="text-xs text-milk-tea-300 italic px-1 py-2">尚未有未指定日期的待辦。</p>
            ) : (
              unclassifiedByDate.noDate.map((t) => (
                <TodoRow
                  key={t.id}
                  todo={t}
                  onToggle={() => toggleUnclassifiedTodo(t.id)}
                  onUpdate={(text) => updateUnclassifiedTodo(t.id, text)}
                  onDelete={() => deleteUnclassifiedTodo(t.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────── Sub-components ────────────

const DaySection: React.FC<{
  dayNumber: number;
  dateLabel: string;
  dayTotal: number;
  dayDone?: number;
  children: React.ReactNode;
}> = ({ dayNumber, dateLabel, dayTotal, dayDone = 0, children }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-milk-tea-100 overflow-hidden">
    <div className="px-4 py-3 flex items-center bg-gradient-to-r from-milk-tea-100/40 to-white border-b border-milk-tea-50">
      <div className="w-8 h-8 rounded-xl bg-milk-tea-500 text-white flex items-center justify-center mr-3 text-xs font-extrabold font-display">
        {dayNumber}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-milk-tea-900 font-display">Day {dayNumber}</p>
        <p className="text-[10px] text-milk-tea-400">{dateLabel}</p>
      </div>
      {dayTotal > 0 && (
        <span className="text-[10px] font-mono font-bold text-milk-tea-500 bg-milk-tea-50 px-2 py-0.5 rounded-full">
          {dayDone}/{dayTotal}
        </span>
      )}
    </div>
    <div className="p-3">{children}</div>
  </div>
);

const SpotGroup: React.FC<{ spot: Spot; children: React.ReactNode }> = ({ spot, children }) => {
  const total = spot.todos?.length ?? 0;
  const done = (spot.todos ?? []).filter((t) => t.done).length;
  return (
    <div className="bg-milk-tea-50/60 rounded-2xl p-2.5 border border-milk-tea-100">
      <div className="flex items-center mb-1.5">
        <PhotoThumbnail src={spot.photo} alt={spot.name} size="sm" />
        <div className="ml-2.5 flex-1 min-w-0">
          <p className="text-xs font-extrabold text-milk-tea-900 truncate font-display">{spot.name}</p>
          <p className="text-[9px] text-milk-tea-400 font-mono">{done}/{total} 完成</p>
        </div>
      </div>
      <div className="pl-1">{children}</div>
    </div>
  );
};

const UnclassifiedGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="bg-accent-cream/40 rounded-2xl p-2.5 border border-accent-warning/40">
    <p className="text-[10px] font-bold uppercase tracking-wider text-milk-tea-500 flex items-center mb-1">
      <span className="mr-1.5">📌</span>
      {label}
    </p>
    <div className="pl-1">{children}</div>
  </div>
);
