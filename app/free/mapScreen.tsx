// app/map.tsx
import { L12_shape_aller, L12_shape_retour } from "@/data/shapes";
import { L12_stops_aller, L12_stops_retour } from "@/data/stops";
import { useBusSubscription } from "@/hooks/useBusSubscription";
import { useRiderStore } from "@/store/useRiderStore";
import { colors, fontSize, radius, spacing } from "@/theme/tokens";
import { rankBuses } from "@/utils/busRanking";
import { getBusColor, getBusStatusLabel } from "@/utils/busVisuals";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Callout, Marker, Polyline } from "react-native-maps";

function formatArrivalTime(etaMinutes: number): string {
  const arrival = new Date(Date.now() + etaMinutes * 60000);
  return arrival.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  useBusSubscription();

  const direction = useRiderStore((s) => s.direction);
  const selectedStopId = useRiderStore((s) => s.selectedStopId);
  const buses = useRiderStore((s) => s.buses);

  const stops = direction === "aller" ? L12_stops_aller : L12_stops_retour;
  const shape = direction === "aller" ? L12_shape_aller : L12_shape_retour;
  const userStop = stops.find((s) => s.id === selectedStopId);

  if (!userStop) return null;

  const rankedBuses = rankBuses(buses, userStop);
  const activeBuses = rankedBuses.filter((b) => !b.isStale);
  const topBus = rankedBuses[0];

  const routeCoords = [...shape]
    .sort((a, b) => a.ordre - b.ordre)
    .map((p) => ({ latitude: p.lat, longitude: p.lon }));

  function centerOnStop() {
    mapRef.current?.animateToRegion(
      {
        latitude: userStop!.lat,
        longitude: userStop!.lon,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500,
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType="terrain"
        initialRegion={{
          latitude: 6.176652615227258,
          longitude: 1.1912292055785656,
          latitudeDelta: 0.16179523578350086,
          longitudeDelta: 0.13244714587926865,
        }}
        showsIndoors={false}
        showsPointsOfInterest={false}
        maxZoomLevel={14.5}
        minZoomLevel={13}
      >
        <Polyline
          coordinates={routeCoords}
          strokeWidth={5}
          strokeColor="#3B7DDE"
        />

        {activeBuses.map((bus) => {
          const isTop = bus.bus_id === topBus?.bus_id;
          return (
            <Marker
              key={bus.bus_id}
              coordinate={{ latitude: bus.lat, longitude: bus.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.busMarkerWrapper}>
                {isTop && (
                  <View style={styles.busPersistentLabel}>
                    <Text style={styles.busPersistentLabelText}>
                      {bus.bus_id}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.busMarker,
                    { backgroundColor: getBusColor(bus) },
                  ]}
                >
                  <Ionicons name="bus" size={28} color="#fff" />
                </View>
              </View>

              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>Bus {bus.bus_id}</Text>
                  <Text style={styles.calloutLine}>
                    Ligne 12 ·{" "}
                    {direction === "aller"
                      ? "Vers BIA"
                      : "Vers Entreprise de l'Union"}
                  </Text>
                  <Text style={styles.calloutStatus}>
                    {bus.isBlocked
                      ? getBusStatusLabel(bus)
                      : `${bus.etaMinutes} min · ${getBusStatusLabel(bus)}`}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}

        <Marker
          coordinate={{ latitude: userStop.lat, longitude: userStop.lon }}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.stopMarkerWrapper}>
            <View style={styles.stopLabel}>
              <Text style={styles.stopLabelName}>{userStop.nom}</Text>
              {topBus && !topBus.isBlocked && (
                <Text style={styles.stopLabelTime}>
                  {formatArrivalTime(topBus.etaMinutes)}
                </Text>
              )}
            </View>
            <Ionicons name="location" size={36} color={colors.textPrimary} />
          </View>
        </Marker>
      </MapView>

      <TouchableOpacity style={styles.topLeft} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="black" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.bottomRight} onPress={centerOnStop}>
        <Ionicons name="locate" size={26} color="white" />
      </TouchableOpacity>

      {topBus && (
        <View style={styles.etaCard}>
          {topBus.isBlocked ? (
            <Text style={styles.etaCardMessage}>
              {getBusStatusLabel(topBus)}
            </Text>
          ) : (
            <View>
              <Text style={styles.etaCardMinutes}>{topBus.etaMinutes} min</Text>
              <Text style={styles.etaCardArrival}>
                Arrivée à {formatArrivalTime(topBus.etaMinutes)}
              </Text>
            </View>
          )}
          <View style={styles.etaCardLineBadge}>
            <View
              style={[
                styles.etaCardDot,
                { backgroundColor: getBusColor(topBus) },
              ]}
            />
            <Text style={styles.etaCardLineText}>L12</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { width: "100%", height: "100%" },

  busMarkerWrapper: { alignItems: "center" },
  busMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  busPersistentLabel: {
    backgroundColor: colors.textPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: 4,
  },
  busPersistentLabelText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: "700",
  },

  callout: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    minWidth: 180,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  calloutTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  calloutLine: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  calloutStatus: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    fontWeight: "600",
  },

  stopMarkerWrapper: { alignItems: "center" },
  stopLabel: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  stopLabelName: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  stopLabelTime: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 1,
  },

  topLeft: {
    position: "absolute",
    top: 60,
    left: 15,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 12,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomRight: {
    position: "absolute",
    bottom: 140,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.85)",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  etaCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  etaCardMinutes: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  etaCardArrival: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: 2,
  },
  etaCardMessage: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  etaCardLineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  etaCardDot: { width: 8, height: 8, borderRadius: 4 },
  etaCardLineText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
