import ConnectivityBadge from "@/src/components/ConnectivityBadge";
import { useSimulatedBusPosition } from "@/src/hooks/useSimulatedBusPosition";
import { useGtfsStore } from "@/src/store/gtfsStore";
import {
  colors,
  getLineColor,
  radius,
  spacing,
  typography,
} from "@/src/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const LOME_CENTRE: Region = {
  latitude: 6.1375,
  longitude: 1.2125,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const router = useRouter();
  const { preselectedLineId } = useLocalSearchParams<{
    preselectedLineId?: string;
  }>();
  const mapRef = useRef<MapView>(null);

  const routes = useGtfsStore((state) => state.routes);
  const loadRouteDetails = useGtfsStore((state) => state.loadRouteDetails);
  const routeShapesCache = useGtfsStore((state) => state.routeShapesCache);
  const routeStopsCache = useGtfsStore((state) => state.routeStopsCache);

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(
    preselectedLineId ?? null,
  );
  const [directionId, setDirectionId] = useState<0 | 1>(0);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);

  const cacheKey = selectedRouteId ? `${selectedRouteId}_${directionId}` : null;
  const selectedShape = cacheKey ? routeShapesCache[cacheKey] : undefined;
  const selectedStops = cacheKey ? routeStopsCache[cacheKey] : undefined;

  const busPosition = useSimulatedBusPosition(
    selectedShape ?? [],
    selectedStops ?? [],
  );

  // Charge le tracé + arrêts dès qu'une ligne est sélectionnée (ou direction changée)
  useEffect(() => {
    if (!selectedRouteId) return;
    loadRouteDetails(selectedRouteId, directionId);
  }, [selectedRouteId, directionId]);

  // Précharge le tracé (direction "aller" par défaut) de toutes les lignes
  // dès l'arrivée sur l'écran, pour avoir une vue d'ensemble immédiate.
  useEffect(() => {
    routes.forEach((route) => {
      loadRouteDetails(route.route_id, 0);
    });
  }, [routes]);

  // Si on arrive depuis Home avec une ligne pré-sélectionnée, on centre la carte dessus
  useEffect(() => {
    if (preselectedLineId) {
      setSelectedRouteId(preselectedLineId);
    }
  }, [preselectedLineId]);

  // Recentre la carte sur le tracé une fois chargé
  useEffect(() => {
    if (selectedShape && selectedShape.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(selectedShape, {
        edgePadding: { top: 100, right: 60, bottom: 300, left: 60 },
        animated: true,
      });
    }
  }, [selectedShape]);

  const handleSelectLine = (routeId: string) => {
    if (selectedRouteId === routeId) {
      // Reclique sur la même ligne → désélection, retour vue globale
      setSelectedRouteId(null);
      setDirectionId(0);
    } else {
      setSelectedRouteId(routeId);
      setDirectionId(0);
    }
  };

  const handleGoToMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    setUserLocation(location);

    mapRef.current?.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={LOME_CENTRE}
        showsUserLocation
        showsCompass={false}
        toolbarEnabled={false}
      >
        {routes.map((route) => {
          const isSelected = selectedRouteId === route.route_id;
          const color = getLineColor(route.route_short_name);

          // Les lignes non sélectionnées affichent toujours leur tracé "aller"
          // (préchargé au montage). Seule la ligne sélectionnée suit le toggle.
          const shapeDirection = isSelected ? directionId : 0;
          const key = `${route.route_id}_${shapeDirection}`;
          const shape = routeShapesCache[key];

          if (!shape) return null;

          return (
            <Polyline
              key={route.route_id}
              coordinates={shape}
              strokeWidth={isSelected ? 5 : 2}
              strokeColor={
                !selectedRouteId || isSelected ? color : `${color}33`
              }
              tappable
              onPress={() => handleSelectLine(route.route_id)}
            />
          );
        })}

        {/* Arrêts de la ligne sélectionnée uniquement */}
        {selectedStops?.map((stop) => (
          <Marker
            key={stop.stop_id}
            coordinate={{ latitude: stop.stop_lat, longitude: stop.stop_lon }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <Ionicons
              name="location-sharp"
              size={28}
              color={getLineColor(
                routes.find((r) => r.route_id === selectedRouteId)
                  ?.route_short_name ?? "",
              )}
            />
          </Marker>
        ))}

        {/* Bus simulé */}
        {busPosition && (
          <Marker
            coordinate={{
              latitude: busPosition.latitude,
              longitude: busPosition.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.busMarker}>
              <Ionicons name="bus" size={16} color={colors.white} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* ─── Header overlay ─── */}
      <SafeAreaView style={styles.headerOverlay} edges={["top"]}>
        <ConnectivityBadge />
      </SafeAreaView>

      {/* ─── Sélecteur de lignes ─── */}
      <SafeAreaView style={styles.selectorOverlay} edges={["top"]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorContent}
        >
          {routes.map((route) => {
            const isSelected = selectedRouteId === route.route_id;
            const color = getLineColor(route.route_short_name);
            return (
              <TouchableOpacity
                key={route.route_id}
                onPress={() => handleSelectLine(route.route_id)}
                style={[
                  styles.pill,
                  { backgroundColor: isSelected ? color : colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? colors.white : colors.textPrimary },
                  ]}
                >
                  {route.route_short_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* ─── Toggle Aller/Retour ─── */}
      {selectedRouteId && (
        <View style={styles.directionToggle}>
          <TouchableOpacity
            style={[
              styles.directionOption,
              directionId === 0 && styles.directionOptionActive,
            ]}
            onPress={() => setDirectionId(0)}
          >
            <Text
              style={[
                styles.directionText,
                directionId === 0 && styles.directionTextActive,
              ]}
            >
              Aller
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.directionOption,
              directionId === 1 && styles.directionOptionActive,
            ]}
            onPress={() => setDirectionId(1)}
          >
            <Text
              style={[
                styles.directionText,
                directionId === 1 && styles.directionTextActive,
              ]}
            >
              Retour
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Bouton ma position ─── */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={handleGoToMyLocation}
      >
        <Ionicons name="locate" size={24} color={colors.white} />
      </TouchableOpacity>

      {/* ─── Bandeau info bus (prochain arrêt / ETA) ─── */}
      {selectedRouteId && busPosition && (
        <View style={styles.busInfoBar}>
          <Ionicons name="bus" size={18} color={colors.primary} />
          <Text style={styles.busInfoText}>
            Prochain arrêt : {busPosition.nextStopName} · dans{" "}
            {Math.round((busPosition.etaSeconds ?? 0) / 60)} min
          </Text>
        </View>
      )}

      {/* ─── Bouton Détails (vers bottom sheet, étape suivante) ─── */}
      {selectedRouteId && (
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() =>
            router.push({
              pathname: "/ligneDetailModal/[id]",
              params: { id: selectedRouteId, direction: directionId },
            })
          }
        >
          <Text style={styles.detailsButtonText}>Voir les détails</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { width: "100%", height: "100%" },

  headerOverlay: {
    position: "absolute",
    top: 0,
    right: spacing.md,
  },
  selectorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  selectorContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  pillText: {
    ...typography.caption,
    fontWeight: "700",
  },

  directionToggle: {
    position: "absolute",
    top: 110,
    left: 10,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  directionOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  directionOptionActive: {
    backgroundColor: colors.primary,
  },
  directionText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  directionTextActive: {
    color: colors.white,
  },

  locationButton: {
    position: "absolute",
    bottom: 160,
    right: spacing.md,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },

  busMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },

  busInfoBar: {
    position: "absolute",
    bottom: 90,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  busInfoText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },

  detailsButton: {
    position: "absolute",
    bottom: 24,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  detailsButtonText: {
    ...typography.cardTitle,
    color: colors.white,
  },
});
