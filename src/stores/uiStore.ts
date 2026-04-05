import { create } from 'zustand';

export type ModalType = 'spot-edit' | 'day-edit' | 'trip-info' | 'add-spot' | 'spot-copy' | null;
export type ReorderMode = 'spots' | 'days' | null;

interface EditingContext {
  tripId: string;
  dayNumber: number;
  spotId?: string;
}

interface UIState {
  activeModal: ModalType;
  editingContext: EditingContext | null;
  reorderMode: ReorderMode;
  toasts: { id: string; message: string; type: 'success' | 'error' | 'warning' }[];
  
  openModal: (type: ModalType, context: EditingContext) => void;
  closeModal: () => void;
  setReorderMode: (mode: ReorderMode) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  editingContext: null,
  reorderMode: null,
  toasts: [],

  openModal: (type, context) => set({ activeModal: type, editingContext: context }),
  closeModal: () => set({ activeModal: null, editingContext: null }),
  setReorderMode: (mode) => set({ reorderMode: mode }),
  addToast: (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}));
