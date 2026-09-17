// app/free/map.tsx
import { L12_shape_aller, L12_shape_retour } from "@/data/shapes";
import { L12_stops_aller, L12_stops_retour } from "@/data/stops";
import { useBusSubscription } from "@/hooks/useBusSubscription";
import { useRiderStore } from "@/store/useRiderStore";
import { colors, fontSize, radius, spacing } from "@/theme/tokens";
import { rankBuses } from "@/utils/busRanking";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Callout, Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

//const BUS_MARKER = require("../../assets/images/bus-marker.png");

export default function MapScreen() {
  const router = useRouter();
  useBusSubscription();

  const direction = useRiderStore((s) => s.direction);
  const selectedStopId = useRiderStore((s) => s.selectedStopId);
  const buses = useRiderStore((s) => s.buses);

  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  const stops = direction === "aller" ? L12_stops_aller : L12_stops_retour;
  const shape = direction === "aller" ? L12_shape_aller : L12_shape_retour;
  const userStop = stops.find((s) => s.id === selectedStopId);

  const routeStopsByDirection = {
    aller: L12_stops_aller,
    retour: L12_stops_retour,
  };

  const rankedBuses = userStop
    ? rankBuses(buses, userStop, routeStopsByDirection)
    : [];

  const availableBuses = rankedBuses.filter((b) => !b.isBlocked);
  const topBus = availableBuses[0];

  const initialRegion = userStop
    ? {
        latitude: userStop.lat,
        longitude: userStop.lon,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }
    : {
        latitude: shape[0]?.lat ?? 6.13,
        longitude: shape[0]?.lon ?? 1.21,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <MapView
        //provider={PROVIDER_GOOGLE}
        style={styles.map}
        mapType="terrain"
        initialRegion={initialRegion}
      >
        <Polyline
          coordinates={shape.map((p) => ({
            latitude: p.lat,
            longitude: p.lon,
          }))}
          strokeColor={colors.primary}
          strokeWidth={4}
        />

        {userStop && (
          <Marker
            coordinate={{ latitude: userStop.lat, longitude: userStop.lon }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.stopPin}>
              <Ionicons name="location" size={28} color={colors.statusRose} />
            </View>
            <Callout tooltip>
              <View style={styles.calloutCard}>
                <Text style={styles.calloutLabel}>{userStop.nom}</Text>
              </View>
            </Callout>
          </Marker>
        )}

        {rankedBuses.map((bus) => {
          const isTop = bus.bus_id === topBus?.bus_id;
          return (
            <Marker
              key={bus.bus_id}
              coordinate={{ latitude: bus.lat, longitude: bus.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => setSelectedBusId(bus.bus_id)}
            >
              <View style={isTop ? styles.busMarkerHighlighted : undefined}>
                <Image
                  source={require("@/assets/images/bus-marker.png")}
                  style={styles.busMarkerImage}
                  resizeMode="contain"
                />
              </View>

              {isTop && (
                <View style={styles.permanentLabel}>
                  <Text style={styles.permanentLabelEta}>
                    {bus.etaMinutes} min
                  </Text>
                  <Text style={styles.permanentLabelId}>{bus.bus_id}</Text>
                </View>
              )}

              <Callout tooltip>
                <View style={styles.calloutCard}>
                  <Text style={styles.calloutEta}>
                    {bus.isBlocked ? "—" : `${bus.etaMinutes} min`}
                  </Text>
                  <Text style={styles.calloutLabel}>Bus {bus.bus_id}</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {topBus && (
        <View style={styles.bottomCard}>
          <View style={styles.bottomCardRow}>
            <Ionicons name="navigate" size={20} color={colors.primary} />
            <View style={styles.bottomCardText}>
              <Text style={styles.bottomCardEta}>{topBus.etaMinutes} min</Text>
              <Text style={styles.bottomCardSub}>
                Bus {topBus.bus_id} · {userStop?.nom}
              </Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  backButton: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundCard,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  stopPin: {
    alignItems: "center",
    justifyContent: "center",
  },
  busMarkerImage: {
    width: 100,
    height: 100,
  },
  busMarkerHighlighted: {
    borderRadius: radius.pill,
    backgroundColor: `${colors.primary}22`,
    padding: 4,
  },
  permanentLabel: {
    position: "absolute",
    top: -34,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  permanentLabelEta: {
    color: colors.primaryText,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  permanentLabelId: {
    color: colors.primaryText,
    fontSize: fontSize.sm,
    opacity: 0.85,
  },
  calloutCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  calloutEta: {
    fontSize: fontSize.base,
    fontWeight: "700",
    color: colors.primary,
  },
  calloutLabel: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  bottomCard: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  bottomCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bottomCardText: { flex: 1 },
  bottomCardEta: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  bottomCardSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
