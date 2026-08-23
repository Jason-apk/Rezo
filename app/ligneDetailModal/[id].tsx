import { RouteStop } from "@/src/gtfs/queries";
import { useGtfsStore } from "@/src/store/gtfsStore";
import {
    colors,
    getLineColor,
    radius,
    spacing,
    typography,
} from "@/src/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type StopStatus = "passed" | "current" | "upcoming";

function timeToSeconds(time: string): number {
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function getCurrentSecondsOfDay(): number {
  const now = new Date();
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}

function getStopStatus(etaMinutes: number): StopStatus {
  if (etaMinutes < 0) return "passed";
  if (etaMinutes <= 3) return "current";
  return "upcoming";
}

function formatEta(etaMinutes: number): string {
  if (etaMinutes < 0) return `il y a ${Math.abs(etaMinutes)} min`;
  if (etaMinutes <= 3) return "~En approche";
  if (etaMinutes >= 60) {
    const h = Math.floor(etaMinutes / 60);
    const m = etaMinutes % 60;
    return `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}`;
  }
  return `Dans ${etaMinutes} min`;
}

/**
 * Calcule, pour chaque arrêt, le temps restant (en minutes) avant le
 * passage du bus, basé sur les horaires réels de stop_times.
 * Négatif = déjà passé.
 */
function computeStopEtas(stops: RouteStop[]): Record<string, number> {
  const nowSeconds = getCurrentSecondsOfDay();
  const etaMap: Record<string, number> = {};

  for (const stop of stops) {
    const stopSeconds = timeToSeconds(stop.arrival_time);
    etaMap[stop.stop_id] = Math.round((stopSeconds - nowSeconds) / 60);
  }

  return etaMap;
}

function TimelineDot({ status, color }: { status: StopStatus; color: string }) {
  if (status === "passed") {
    return (
      <View
        style={[styles.dot, { backgroundColor: color, borderColor: color }]}
      />
    );
  }
  if (status === "current") {
    return (
      <View style={[styles.dotCurrent, { borderColor: color }]}>
        <View style={[styles.dotInner, { backgroundColor: color }]} />
      </View>
    );
  }
  return (
    <View
      style={[
        styles.dot,
        { backgroundColor: "transparent", borderColor: colors.border },
      ]}
    />
  );
}

function StopRow({
  stop,
  status,
  eta,
  color,
  isLast,
}: {
  stop: RouteStop;
  status: StopStatus;
  eta: number;
  color: string;
  isLast: boolean;
}) {
  const label =
    status === "passed"
      ? formatEta(eta)
      : status === "current"
        ? "En approche"
        : formatEta(eta);

  const badgeStyle =
    status === "passed"
      ? styles.badgePassed
      : status === "current"
        ? [styles.badgeCurrent, { backgroundColor: `${color}22` }]
        : styles.badgeUpcoming;

  const badgeTextStyle =
    status === "passed"
      ? styles.badgePassedText
      : status === "current"
        ? [styles.badgeCurrentText, { color }]
        : styles.badgeUpcomingText;

  return (
    <View style={styles.stopRow}>
      <View style={styles.timelineCol}>
        <TimelineDot status={status} color={color} />
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              { backgroundColor: status === "passed" ? color : colors.border },
            ]}
          />
        )}
      </View>
      <View style={styles.stopContent}>
        <Text
          style={[
            styles.stopName,
            status === "passed" && { color: colors.textMuted },
          ]}
        >
          {stop.stop_name}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.etaBadge, badgeStyle]}>
            <Text style={[styles.etaText, badgeTextStyle]}>{label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function LigneDetailModal() {
  const router = useRouter();
  const { id, direction: initialDirection } = useLocalSearchParams<{
    id: string;
    direction?: string;
  }>();

  const [directionId, setDirectionId] = useState<0 | 1>(
    initialDirection === "1" ? 1 : 0,
  );

  const routes = useGtfsStore((state) => state.routes);
  const loadRouteDetails = useGtfsStore((state) => state.loadRouteDetails);
  const routeStopsCache = useGtfsStore((state) => state.routeStopsCache);

  const route = routes.find((r) => r.route_id === id);
  const lineColor = getLineColor(route?.route_short_name ?? "");

  const cacheKey = `${id}_${directionId}`;
  const stops = routeStopsCache[cacheKey] ?? [];

  useEffect(() => {
    if (id) {
      loadRouteDetails(id, directionId);
    }
  }, [id, directionId]);

  if (!route) return null;

  const etaMap = computeStopEtas(stops);

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        onPress={() => router.back()}
        activeOpacity={1}
      />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.lineBadgeRow}>
            <View style={[styles.lineBadge, { backgroundColor: lineColor }]}>
              <Text style={styles.lineBadgeText}>{route.route_short_name}</Text>
            </View>
            <Text style={styles.lineName} numberOfLines={1}>
              {route.route_long_name}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ─── Toggle Aller/Retour ─── */}
        <View style={styles.toggleWrap}>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              directionId === 0 && { backgroundColor: lineColor },
            ]}
            onPress={() => setDirectionId(0)}
          >
            <Text
              style={[
                styles.toggleText,
                directionId === 0 && styles.toggleTextActive,
              ]}
            >
              Aller
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              directionId === 1 && { backgroundColor: lineColor },
            ]}
            onPress={() => setDirectionId(1)}
          >
            <Text
              style={[
                styles.toggleText,
                directionId === 1 && styles.toggleTextActive,
              ]}
            >
              Retour
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* ─── Liste des arrêts ─── */}
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {stops.map((stop, index) => {
            const eta = etaMap[stop.stop_id] ?? 0;
            const status = getStopStatus(eta);
            return (
              <StopRow
                key={stop.stop_id}
                stop={stop}
                status={status}
                eta={eta}
                color={lineColor}
                isLast={index === stops.length - 1}
              />
            );
          })}
          {stops.length === 0 && (
            <Text style={styles.emptyText}>Chargement des arrêts...</Text>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "75%",
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  lineBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  lineBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  lineBadgeText: {
    ...typography.cardTitle,
    color: colors.white,
  },
  lineName: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  toggleWrap: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  toggleOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  toggleText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.white,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },

  scroll: { flex: 1 },

  stopRow: {
    flexDirection: "row",
  },
  timelineCol: {
    width: 24,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 4,
  },
  dotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 2,
  },

  stopContent: {
    flex: 1,
    paddingBottom: spacing.md,
    paddingLeft: spacing.sm,
  },
  stopName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  etaBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  etaText: {
    ...typography.caption,
    fontWeight: "600",
  },
  badgePassed: {
    backgroundColor: colors.surface,
  },
  badgePassedText: {
    color: colors.textMuted,
  },
  badgeCurrent: {},
  badgeCurrentText: {
    fontWeight: "700",
  },
  badgeUpcoming: {
    backgroundColor: colors.surface,
  },
  badgeUpcomingText: {
    color: colors.textSecondary,
  },

  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
