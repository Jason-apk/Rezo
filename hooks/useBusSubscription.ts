// src/hooks/useBusSubscription.ts
import { supabase } from "@/lib/supabase";
import { BusPosition, useRiderStore } from "@/store/useRiderStore";
import { useEffect } from "react";

export function useBusSubscription() {
  const setBuses = useRiderStore((s) => s.setBuses);
  const upsertBus = useRiderStore((s) => s.upsertBus);
  const removeBus = useRiderStore((s) => s.removeBus);

  useEffect(() => {
    // Chargement initial : un seul select, au montage.
    supabase
      .from("bus_positions")
      .select("*")
      .then(({ data }) => {
        if (data) setBuses(data as BusPosition[]);
      });

    //const channelName = `bus_positions_realtime_${Date.now()}`;

    const channel = supabase
      //.channel(channelName)
      .channel("bus_positions_realtime")

      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bus_positions" },
        (payload) => {
          // Le payload contient déjà la ligne modifiée — plus besoin de refetch.
          if (payload.eventType === "DELETE") {
            removeBus((payload.old as BusPosition).bus_id);
          } else {
            upsertBus(payload.new as BusPosition);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
