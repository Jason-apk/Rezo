// src/store/useRiderStore.ts
import { resetArrivedBuses } from "@/utils/busRanking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Direction = "aller" | "retour";

export type BusPosition = {
  bus_id: string;
  lat: number;
  lng: number;
  direction: Direction;
  status: "normal" | "embouteillage" | "panne" | "plein" | "pause";
  updated_at: string;
};

type RiderState = {
  direction: Direction;
  selectedStopId: string | null;
  buses: BusPosition[];
  favoriteStopIds: string[];
  firstLaunchAt: string | null;
  hasSubscribed: boolean;

  setDirection: (direction: Direction) => void;
  setSelectedStopId: (stopId: string) => void;
  setBuses: (buses: BusPosition[]) => void;
  toggleFavorite: (stopId: string) => void;
  setFirstLaunchIfNeeded: () => void;
  markSubscribed: () => void;
  upsertBus: (bus: BusPosition) => void;
  removeBus: (busId: string) => void;
};

export const useRiderStore = create<RiderState>()(
  persist(
    (set, get) => ({
      direction: "aller",
      selectedStopId: null,
      buses: [],
      favoriteStopIds: [],
      firstLaunchAt: null,
      hasSubscribed: false,

      setDirection: (direction) => {
        resetArrivedBuses();

        set({ direction });
      },
      setSelectedStopId: (stopId) => {
        resetArrivedBuses();

        set({ selectedStopId: stopId });
      },
      setBuses: (buses) => set({ buses }),
      toggleFavorite: (stopId) => {
        const current = get().favoriteStopIds;
        const isFavorite = current.includes(stopId);
        set({
          favoriteStopIds: isFavorite
            ? current.filter((id) => id !== stopId)
            : [...current, stopId],
        });
      },
      markSubscribed: () => set({ hasSubscribed: true }),

      setFirstLaunchIfNeeded: () => {
        if (!get().firstLaunchAt) {
          set({ firstLaunchAt: new Date().toISOString() });
        }
      },
      upsertBus: (bus) => {
        const current = get().buses;
        const idx = current.findIndex((b) => b.bus_id === bus.bus_id);
        if (idx === -1) {
          set({ buses: [...current, bus] });
        } else {
          const next = [...current];
          next[idx] = bus;
          set({ buses: next });
        }
      },
      removeBus: (busId) => {
        set({ buses: get().buses.filter((b) => b.bus_id !== busId) });
      },
    }),
    {
      name: "rezo-rider-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favoriteStopIds: state.favoriteStopIds,
        selectedStopId: state.selectedStopId,
        direction: state.direction,
        firstLaunchAt: state.firstLaunchAt,
        hasSubscribed: state.hasSubscribed,
      }),
    },
  ),
);
