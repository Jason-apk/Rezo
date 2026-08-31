// hooks/useBusPosition.ts
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type BusPosition = {
  bus_id: string;
  lat: number;
  lng: number;
  updated_at: string;
};

export function useBusPosition(busId: string) {
  const [position, setPosition] = useState<BusPosition | null>(null);

  useEffect(() => {
    // charge la position initiale
    supabase
      .from("bus_positions")
      .select("*")
      .eq("bus_id", busId)
      .single()
      .then(({ data }) => data && setPosition(data));

    // s'abonne aux updates en live
    const channel = supabase
      .channel(`bus_positions_${busId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bus_positions",
          filter: `bus_id=eq.${busId}`,
        },
        (payload) => setPosition(payload.new as BusPosition),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [busId]);

  return position;
}
