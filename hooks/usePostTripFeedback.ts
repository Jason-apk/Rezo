// hooks/usePostTripFeedback.ts
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/utils/deviceId";
import { useEffect, useRef, useState } from "react";

const ARRIVED_TO_FEEDBACK_DELAY_MS = 5 * 60 * 1000; // 5 minutes
const FEEDBACK_TIMEOUT_MS = 20_000; // 20s sans réponse = no_response

//const ARRIVED_TO_FEEDBACK_DELAY_MS = 5_000; // 5 secondes au lieu de 5 minutes, pour tester vite
//const FEEDBACK_TIMEOUT_MS = 10_000; // 10 secondes au lieu de 20

export function usePostTripFeedback(
  isArrived: boolean,
  busId: string | undefined,
) {
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isArrived) {
      setShowFeedback(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowFeedback(true);
    }, ARRIVED_TO_FEEDBACK_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isArrived]);

  useEffect(() => {
    if (!showFeedback) return;

    feedbackTimeoutRef.current = setTimeout(async () => {
      await logFeedback("no_response", busId);
      setShowFeedback(false);
    }, FEEDBACK_TIMEOUT_MS);

    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, [showFeedback]);

  async function respond(positive: boolean) {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    await logFeedback(
      positive ? "feedback_positive" : "feedback_negative",
      busId,
    );
    setShowFeedback(false);
  }

  return { showFeedback, respond };
}

async function logFeedback(action: string, busId: string | undefined) {
  const deviceId = await getDeviceId();
  await supabase.from("events").insert({
    device_id: deviceId,
    action,
    bus_id: busId,
  });
}
