// app/eta.tsx
import { FeedbackOverlay } from "@/components/FeedbackOverlay";
import { L12_stops_aller, L12_stops_retour } from "@/data/stops";
import { useBusSubscription } from "@/hooks/useBusSubscription";
import { useEtaLogger } from "@/hooks/useEtaLogger";
import { usePostTripFeedback } from "@/hooks/usePostTripFeedback";
import { useRiderStore } from "@/store/useRiderStore";
import { colors, fontSize, radius, spacing } from "@/theme/tokens";
import { rankBuses } from "@/utils/busRanking";
import { getScreenVariant } from "@/utils/etaScreenState";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EtaScreen() {
  const router = useRouter();
  useBusSubscription();

  const direction = useRiderStore((s) => s.direction);
  const selectedStopId = useRiderStore((s) => s.selectedStopId);
  const buses = useRiderStore((s) => s.buses);

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const stops = direction === "aller" ? L12_stops_aller : L12_stops_retour;
  const userStop = stops.find((s) => s.id === selectedStopId);

  if (!userStop) {
    return null;
  }

  // Nécessaire pour que rankBuses sache où se situe chaque bus sur SA direction,
  // et détecte s'il a déjà dépassé l'arrêt choisi par l'usager.
  const routeStopsByDirection = {
    aller: L12_stops_aller,
    retour: L12_stops_retour,
  };

  const rankedBuses = rankBuses(buses, userStop, routeStopsByDirection);
  // Seul un bus disponible (ni bloqué, ni dépassé, ni signal perdu) peut être
  // affiché comme "le" bus suivi en haut de l'écran — évite l'incohérence
  // avec son propre statut affiché plus bas dans la liste.
  const availableBuses = rankedBuses.filter((b) => !b.isBlocked);
  const topBus = availableBuses[0];
  const variant = getScreenVariant(rankedBuses, isOffline, topBus);

  const { showFeedback, respond } = usePostTripFeedback(
    variant === "arrived",
    topBus?.bus_id,
  );

  useEtaLogger(topBus, selectedStopId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {direction === "aller" ? "→ BIA" : "→ Entreprise de l'Union"}
            {topBus ? `  ·  Bus ${topBus.bus_id}` : ""}
          </Text>
        </View>

        <AlertZone variant={variant} />
        <EtaZone variant={variant} topBus={topBus} />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/free")}
          >
            <Text style={styles.secondaryButtonText}>Changer d'arrêt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
              la carte bientôt disponible
            </Text>
          </TouchableOpacity>
        </View>

        <RankingList rankedBuses={rankedBuses} />

        {showFeedback && <FeedbackOverlay onRespond={respond} />}
      </View>
    </SafeAreaView>
  );
}

// --- Zone alerte ---
function AlertZone({ variant }: { variant: string }) {
  if (variant === "normal") {
    return (
      <View style={styles.normalRow}>
        <Ionicons name="bus" size={20} color={colors.statusGreen} />
        <Text style={styles.normalText}>Le bus arrive bientôt</Text>
      </View>
    );
  }

  if (variant === "embouteillage") {
    return (
      <View style={[styles.alertCard, styles.alertAmber]}>
        <Ionicons name="warning" size={20} color={colors.statusAmber} />
        <View style={styles.alertTextBlock}>
          <Text style={styles.alertLabel}>Info</Text>
          <Text style={styles.alertMessage}>
            Léger retard possible, le bus est en route
          </Text>
        </View>
      </View>
    );
  }

  if (variant === "panne") {
    return (
      <>
        <View style={[styles.alertCard, styles.alertRose]}>
          <Ionicons name="alert-circle" size={20} color={colors.statusRose} />
          <View style={styles.alertTextBlock}>
            <Text style={styles.alertLabel}>Alerte</Text>
            <Text style={styles.alertMessage}>
              Ce bus rencontre un souci, nous suivons le suivant pour vous
            </Text>
          </View>
        </View>
        <Text style={styles.toast}>
          Bus suivant sélectionné automatiquement
        </Text>
      </>
    );
  }

  if (variant === "plein") {
    return (
      <>
        <View style={[styles.alertCard, styles.alertRose]}>
          <Ionicons name="people" size={20} color={colors.statusRose} />
          <View style={styles.alertTextBlock}>
            <Text style={styles.alertLabel}>Alerte</Text>
            <Text style={styles.alertMessage}>
              Ce bus est complet, nous suivons le suivant pour vous
            </Text>
          </View>
        </View>
        <Text style={styles.toast}>
          Bus suivant sélectionné automatiquement
        </Text>
      </>
    );
  }

  if (variant === "pause") {
    return (
      <View style={[styles.alertCard, styles.alertAmber]}>
        <Ionicons name="pause-circle" size={20} color={colors.statusAmber} />
        <View style={styles.alertTextBlock}>
          <Text style={styles.alertLabel}>Alerte</Text>
          <Text style={styles.alertMessage}>Service en pause sur ce sens</Text>
        </View>
      </View>
    );
  }

  return null;
}

// --- Zone ETA ---
function EtaZone({ variant, topBus }: { variant: string; topBus: any }) {
  if (variant === "normal" || variant === "embouteillage") {
    if (!topBus) return null;
    const arrivalTime = new Date(Date.now() + topBus.etaMinutes * 60000);
    const timeLabel = arrivalTime.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View style={styles.etaZone}>
        <Text style={styles.etaNumber}>{topBus.etaMinutes} min</Text>
        <Text style={styles.arrivalTime}>Arrivée à {timeLabel}</Text>
      </View>
    );
  }

  if (variant === "panne" || variant === "plein") {
    return (
      <View style={styles.etaZone}>
        <Ionicons name="time-outline" size={32} color={colors.statusGray} />
        <Text style={styles.etaMessage}>En attente d'un bus disponible</Text>
      </View>
    );
  }

  if (variant === "pause") {
    return (
      <View style={styles.etaZone}>
        <Ionicons
          name="pause-circle-outline"
          size={32}
          color={colors.statusGray}
        />
        <Text style={styles.etaMessage}>Service en pause</Text>
      </View>
    );
  }

  if (variant === "no_tracking") {
    return (
      <View style={styles.etaZone}>
        <Ionicons name="search" size={32} color={colors.statusGray} />
        <Text style={styles.etaMessage}>
          Aucun suivi disponible pour le moment
        </Text>
      </View>
    );
  }

  if (variant === "offline") {
    return (
      <View style={styles.etaZone}>
        <Ionicons name="cloud-offline" size={32} color={colors.statusGray} />
        <Text style={styles.etaMessage}>Pas de connexion internet</Text>
        <Text style={styles.arrivalTime}>Reconnexion automatique en cours</Text>
      </View>
    );
  }

  if (variant === "arrived") {
    return (
      <View style={styles.etaZone}>
        <Ionicons
          name="checkmark-circle"
          size={32}
          color={colors.statusGreen}
        />
        <Text style={styles.etaMessage}>Le bus est arrivé à votre arrêt</Text>
      </View>
    );
  }

  return null;
}

function RankingList({ rankedBuses }: { rankedBuses: any[] }) {
  return (
    <View style={styles.rankingList}>
      {rankedBuses.map((bus, index) => {
        const { icon, iconColor, label } = getStatusDisplay(bus);
        return (
          <View key={bus.bus_id} style={styles.rankingRow}>
            <Text style={styles.rankingText}>
              {index + 1} - {bus.bus_id}
            </Text>
            <View style={styles.rankingStatus}>
              {icon && <Ionicons name={icon} size={16} color={iconColor} />}
              <Text style={[styles.rankingText, { color: iconColor }]}>
                {label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Centralise l'affichage (icône + couleur + texte) pour chaque état d'un bus dans la liste.
// hasPassedStop est vérifié en premier : un bus qui a dépassé l'arrêt n'est pas "en panne",
// il faut que l'usager comprenne que c'est normal, pas un problème.
function getStatusDisplay(bus: any): {
  icon: keyof typeof Ionicons.glyphMap | null;
  iconColor: string;
  label: string;
} {
  if (bus.isStale) {
    return {
      icon: "cloud-offline-outline",
      iconColor: colors.statusGray,
      label: "Signal perdu",
    };
  }
  if (bus.hasPassedStop) {
    return {
      icon: "refresh-circle",
      iconColor: colors.statusGray,
      label: "Vient de passer",
    };
  }
  if (bus.status === "panne") {
    return {
      icon: "alert-circle",
      iconColor: colors.statusRose,
      label: "En panne",
    };
  }
  if (bus.status === "plein") {
    return {
      icon: "people",
      iconColor: colors.statusRose,
      label: "Plein",
    };
  }
  if (bus.status === "pause") {
    return {
      icon: "pause-circle",
      iconColor: colors.statusAmber,
      label: "En pause",
    };
  }
  if (bus.isBlocked) {
    return { icon: null, iconColor: colors.statusGray, label: "" };
  }
  return {
    icon: "navigate",
    iconColor: colors.statusGreen,
    label: `${bus.etaMinutes} min`,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  header: { marginBottom: spacing.md },
  headerText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: "center",
  },

  normalText: {
    color: colors.statusGreen,
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.md,
  },

  etaZone: {
    flex: 1, // ← prend tout l'espace vertical disponible
    alignItems: "center",
    justifyContent: "center", // ← centre l'ETA dans cet espace
  },
  etaNumber: {
    fontSize: fontSize.hugeX,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  arrivalTime: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundChip,
    alignItems: "center",
  },
  secondaryButtonText: { color: colors.textPrimary, fontSize: fontSize.base },

  rankingList: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rankingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  rankingText: { fontSize: fontSize.base, color: colors.textPrimary },

  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  alertAmber: { backgroundColor: colors.statusAmber },
  alertRose: { backgroundColor: colors.statusRose },
  alertLabel: {
    fontWeight: "600",
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  alertMessage: { flex: 1, color: colors.textPrimary, fontSize: fontSize.base },
  toast: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  etaMessage: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  normalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertTextBlock: {
    flex: 1,
    marginLeft: 8,
  },
  rankingStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
