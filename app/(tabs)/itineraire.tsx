import { DijkstraResult, GtfsStop } from "@/src/gtfs/types";
import { useGtfsStore } from "@/src/store/gtfsStore";
import {
  colors,
  getLineColor,
  radius,
  spacing,
  typography,
} from "@/src/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FieldBeingEdited = "from" | "to" | null;

export default function ItineraireScreen() {
  const router = useRouter();
  const stops = useGtfsStore((state) => state.stops);
  const routes = useGtfsStore((state) => state.routes);
  const findPath = useGtfsStore((state) => state.findPath);

  const [fromStop, setFromStop] = useState<GtfsStop | null>(null);
  const [toStop, setToStop] = useState<GtfsStop | null>(null);
  const [fieldBeingEdited, setFieldBeingEdited] =
    useState<FieldBeingEdited>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState<DijkstraResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const filteredStops = useMemo(() => {
    if (searchQuery.trim() === "") return stops.slice(0, 300);
    const q = searchQuery.toLowerCase();
    return stops.filter((s) => s.stop_name.toLowerCase().includes(q));
  }, [stops, searchQuery]);

  // Nombre de correspondances (changements de ligne) dans le résultat
  const transferCount = useMemo(() => {
    if (!result || !result.found) return 0;
    const routeIds = result.path
      .map((step) => step.routeId)
      .filter((id): id is string => id !== null);
    const uniqueRouteIds = new Set(routeIds);
    return Math.max(0, uniqueRouteIds.size - 1);
  }, [result]);

  const getRouteInfo = (routeId: string | null) => {
    if (!routeId) return null;
    return routes.find((r) => r.route_id === routeId) ?? null;
  };

  const openStopPicker = (field: FieldBeingEdited) => {
    setFieldBeingEdited(field);
    setSearchQuery("");
  };

  const handlePickStop = (stop: GtfsStop) => {
    if (fieldBeingEdited === "from") setFromStop(stop);
    if (fieldBeingEdited === "to") setToStop(stop);
    setFieldBeingEdited(null);
    setResult(null);
    setHasSearched(false);
  };

  const handleSwap = () => {
    const temp = fromStop;
    setFromStop(toStop);
    setToStop(temp);
    setResult(null);
    setHasSearched(false);
  };

  const handleSearch = async () => {
    if (!fromStop || !toStop) return;
    setIsSearching(true);
    setHasSearched(true);
    setResult(null);

    try {
      const pathResult = await findPath(fromStop.stop_id, toStop.stop_id);
      setResult(pathResult);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewOnMap = () => {
    if (!result || !result.found) return;
    router.push({
      pathname: "/(tabs)/map",
      params: {
        itineraryStopIds: JSON.stringify(result.path.map((s) => s.stopId)),
      },
    });
  };

  const canSearch = fromStop !== null && toStop !== null && !isSearching;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Itinéraire</Text>

      {/* ─── Champs Départ / Arrivée ─── */}
      <View style={styles.fieldsBlock}>
        <TouchableOpacity
          style={styles.field}
          onPress={() => openStopPicker("from")}
        >
          <View
            style={[styles.fieldDot, { backgroundColor: colors.success }]}
          />
          <Text
            style={
              fromStop ? styles.fieldTextFilled : styles.fieldTextPlaceholder
            }
            numberOfLines={1}
          >
            {fromStop?.stop_name ?? "Choisir un arrêt de départ"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.fieldConnectorRow}>
          <View style={styles.fieldConnectorLine} />
        </View>

        <TouchableOpacity
          style={styles.field}
          onPress={() => openStopPicker("to")}
        >
          <View style={[styles.fieldDot, { backgroundColor: colors.accent }]} />
          <Text
            style={
              toStop ? styles.fieldTextFilled : styles.fieldTextPlaceholder
            }
            numberOfLines={1}
          >
            {toStop?.stop_name ?? "Choisir un arrêt d'arrivée"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {fromStop && toStop && (
          <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
            <Ionicons name="swap-vertical" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.searchButton, !canSearch && styles.searchButtonDisabled]}
        onPress={handleSearch}
        disabled={!canSearch}
      >
        {isSearching ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.searchButtonText}>Rechercher</Text>
        )}
      </TouchableOpacity>

      {/* ─── État initial (avant toute recherche) ─── */}
      {!hasSearched && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="navigate-outline"
              size={32}
              color={colors.primary}
            />
          </View>
          <Text style={styles.emptyStateText}>
            Choisis un point de départ et une arrivée pour voir le meilleur
            trajet.
          </Text>
        </View>
      )}

      {/* ─── Résultat ─── */}
      {hasSearched && !isSearching && result && (
        <View style={styles.resultBlock}>
          {!result.found ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: `${colors.error}15` },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={32}
                  color={colors.error}
                />
              </View>
              <Text style={styles.emptyStateText}>
                Aucun itinéraire trouvé entre ces deux arrêts.
              </Text>
            </View>
          ) : (
            <>
              {/* Résumé du trajet */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.summaryValue}>
                    {Math.round(result.totalCostSeconds / 60)} min
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.summaryValue}>
                    {result.path.length} arrêts
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.summaryValue}>
                    {transferCount === 0
                      ? "Direct"
                      : `${transferCount} correspondance${transferCount > 1 ? "s" : ""}`}
                  </Text>
                </View>
              </View>

              <FlatList
                data={result.path}
                keyExtractor={(item, index) => `${item.stopId}_${index}`}
                style={styles.resultList}
                renderItem={({ item, index }) => {
                  const routeInfo = getRouteInfo(item.routeId);
                  const dotColor = routeInfo
                    ? getLineColor(routeInfo.route_short_name)
                    : colors.textMuted;

                  return (
                    <View style={styles.resultRow}>
                      <View style={styles.resultConnector}>
                        <View
                          style={[
                            styles.resultDot,
                            { backgroundColor: dotColor },
                          ]}
                        />
                        {index < result.path.length - 1 && (
                          <View
                            style={[
                              styles.resultLine,
                              { backgroundColor: dotColor },
                            ]}
                          />
                        )}
                      </View>
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultStopName} numberOfLines={1}>
                          {item.stopName}
                        </Text>
                        {routeInfo && (
                          <View
                            style={[
                              styles.routeBadge,
                              { backgroundColor: `${dotColor}18` },
                            ]}
                          >
                            <Text
                              style={[
                                styles.routeBadgeText,
                                { color: dotColor },
                              ]}
                            >
                              {routeInfo.route_short_name}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                }}
              />

              <TouchableOpacity
                style={styles.mapButton}
                onPress={handleViewOnMap}
              >
                <Ionicons name="map-outline" size={18} color={colors.white} />
                <Text style={styles.mapButtonText}>Voir sur la carte</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* ─── Modal sélection d'arrêt ─── */}
      <Modal
        visible={fieldBeingEdited !== null}
        animationType="slide"
        onRequestClose={() => setFieldBeingEdited(null)}
      >
        <SafeAreaView style={styles.pickerContainer} edges={["top"]}>
          <View style={styles.pickerTitleRow}>
            <Text style={styles.pickerTitle}>
              {fieldBeingEdited === "from"
                ? "Point de départ"
                : "Point d'arrivée"}
            </Text>
            <TouchableOpacity onPress={() => setFieldBeingEdited(null)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerSearchWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.pickerSearchInput}
              placeholder="Rechercher un arrêt..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredStops}
            keyExtractor={(item) => item.stop_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => handlePickStop(item)}
              >
                <View style={styles.pickerRowIcon}>
                  <Ionicons name="location" size={16} color={colors.primary} />
                </View>
                <Text style={styles.pickerRowText}>{item.stop_name}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aucun arrêt trouvé.</Text>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.screenTitle,
    color: colors.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  fieldsBlock: {
    marginBottom: spacing.md,
    position: "relative",
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  fieldDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fieldTextFilled: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  fieldTextPlaceholder: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
  },
  fieldConnectorRow: {
    height: 12,
    paddingLeft: 19,
  },
  fieldConnectorLine: {
    width: 2,
    height: "100%",
    backgroundColor: colors.border,
  },
  swapButton: {
    position: "absolute",
    right: spacing.md,
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    minHeight: 50,
  },
  searchButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  searchButtonText: {
    ...typography.cardTitle,
    color: colors.white,
  },

  emptyState: {
    alignItems: "center",
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  resultBlock: {
    flex: 1,
  },

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },

  resultList: {
    flex: 1,
  },
  resultRow: {
    flexDirection: "row",
  },
  resultConnector: {
    width: 20,
    alignItems: "center",
  },
  resultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  resultLine: {
    width: 2,
    flex: 1,
    marginTop: 2,
    opacity: 0.35,
  },
  resultInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: spacing.sm,
    paddingBottom: spacing.md,
  },
  resultStopName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  routeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  routeBadgeText: {
    ...typography.caption,
    fontWeight: "700",
  },

  mapButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  mapButtonText: {
    ...typography.cardTitle,
    color: colors.white,
  },

  pickerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pickerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  pickerTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  pickerSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  pickerSearchInput: {
    flex: 1,
    paddingVertical: 10,
    ...typography.body,
    color: colors.textPrimary,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerRowText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
