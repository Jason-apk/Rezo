// src/hooks/useEtaLogger.ts
import { ETA_LOGGER_CONFIG } from "@/config/config";
import { supabase } from "@/lib/supabase";
import { RankedBus } from "@/utils/busRanking";
import { getDeviceId } from "@/utils/deviceId";
import { useEffect, useRef } from "react";

const THROTTLE_MS = ETA_LOGGER_CONFIG.THROTTLE_MS;

export function useEtaLogger(
  topBus: RankedBus | undefined,
  stopId: string | null | undefined,
) {
  const lastLogRef = useRef<number>(0);

  useEffect(() => {
    if (!topBus || !stopId) return;
    if (topBus.isBlocked) return; // pas de sens de logger un ETA pour un bus en panne/plein/pause

    const now = Date.now();
    if (now - lastLogRef.current < THROTTLE_MS) return;
    lastLogRef.current = now;

    (async () => {
      const deviceId = await getDeviceId();

      await supabase.from("eta_logs").insert({
        device_id: deviceId,
        bus_id: topBus.bus_id,
        stop_id: stopId,
        eta_minutes: topBus.etaMinutes,
      });

      await supabase.from("events").insert({
        device_id: deviceId,
        action: "consultation_eta",
        bus_id: topBus.bus_id,
      });
    })();
  }, [topBus?.bus_id, topBus?.etaMinutes, stopId]);
}
