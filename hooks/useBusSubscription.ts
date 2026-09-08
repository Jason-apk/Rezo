// src/hooks/useBusSubscription.ts
import { supabase } from "@/lib/supabase";
import { BusPosition, useRiderStore } from "@/store/useRiderStore";
import { useEffect } from "react";

export function useBusSubscription() {
  const setBuses = useRiderStore((s) => s.setBuses);

  useEffect(() => {
    supabase
      .from("bus_positions")
      .select("*")
      .then(({ data }) => {
        if (data) setBuses(data as BusPosition[]);
      });

    // nom unique à chaque montage, évite les conflits si un ancien channel n'est pas encore nettoyé
    const channelName = `bus_positions_realtime_${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bus_positions" },
        () => {
          supabase
            .from("bus_positions")
            .select("*")
            .then(({ data }) => {
              if (data) setBuses(data as BusPosition[]);
            });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
