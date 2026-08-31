import { create } from 'zustand';

export interface LivePosition {
  bus_id: string;
  line_id: string;
  direction: string;
  lat: number;
  lng: number;
  speed: number | null;
  accuracy: number | null;
  updated_at: string;
  receivedAt: number; // Date.now() côté client, pour flash visuel
}

interface PositionsStore {
  positions: Record<string, LivePosition>;
  upsertPosition: (pos: Omit<LivePosition, 'receivedAt'>) => void;
}

export const usePositionsStore = create<PositionsStore>((set) => ({
  positions: {},
  upsertPosition: (pos) =>
    set((state) => ({
      positions: {
        ...state.positions,
        [pos.bus_id]: { ...pos, receivedAt: Date.now() },
      },
    })),
}));
