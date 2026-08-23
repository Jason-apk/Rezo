import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

/**
 * Retourne true si l'appareil a une connexion réseau active.
 * Se met à jour automatiquement si la connectivité change.
 */
export function useNetworkStatus(): boolean {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
}
