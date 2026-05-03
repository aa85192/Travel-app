import { create } from 'zustand';

export type ModalType = 'spot-edit' | 'day-edit' | 'trip-info' | 'add-spot' | 'spot-copy' | null;
export type ReorderMode = 'spots' | 'days' | null;

interface EditingContext {
  tripId: string;
  dayNumber: number;
  spotId?: string;
}

export interface MapRouteRequest {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  mode: 'walking' | 'bus' | 'subway' | 'taxi' | 'uber';
}

export interface MapPreviewSpot {
  lat: number;
  lng: number;
  name: string;
}

interface UIState {
  activeModal: ModalType;
  editingContext: EditingContext | null;
  reorderMode: ReorderMode;
  toasts: { id: string; message: string; type: 'success' | 'error' | 'warning' }[];
  navigateTo: string | null;
  mapRouteRequest: MapRouteRequest | null;
  mapPreviewSpot: MapPreviewSpot | null;

  openModal: (type: ModalType, context: EditingContext) => void;
  closeModal: () => void;
  setReorderMode: (mode: ReorderMode) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
  removeToast: (id: string) => void;
  setNavigateTo: (tab: string | null) => void;
  setMapRoute: (req: MapRouteRequest | null) => void;
  setMapPreviewSpot: (spot: MapPreviewSpot | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  editingContext: null,
  reorderMode: null,
  toasts: [],
  navigateTo: null,
  mapRouteRequest: null,
  mapPreviewSpot: null,

  openModal: (type, context) => set({ activeModal: type, editingContext: context }),
  closeModal: () => set({ activeModal: null, editingContext: null }),
  setReorderMode: (mode) => set({ reorderMode: mode }),
  setNavigateTo: (tab) => set({ navigateTo: tab }),
  setMapRoute: (req) => set({ mapRouteRequest: req }),
  setMapPreviewSpot: (spot) => set({ mapPreviewSpot: spot }),
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
