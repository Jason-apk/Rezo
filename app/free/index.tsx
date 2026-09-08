// app/stop-selection.tsx
import { L12_stops_aller, L12_stops_retour } from "@/data/stops";
import { useNearestStopDetection } from "@/hooks/useNearestStop";
import { Direction, useRiderStore } from "@/store/useRiderStore";
import { colors, fontSize, radius, spacing } from "@/theme/tokens";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StopSelectionScreen() {
  const router = useRouter();
  const direction = useRiderStore((s) => s.direction);
  const setDirection = useRiderStore((s) => s.setDirection);
  const selectedStopId = useRiderStore((s) => s.selectedStopId);
  const setSelectedStopId = useRiderStore((s) => s.setSelectedStopId);
  const favoriteStopIds = useRiderStore((s) => s.favoriteStopIds);
  const toggleFavorite = useRiderStore((s) => s.toggleFavorite);

  useNearestStopDetection(direction);
  const stops = direction === "aller" ? L12_stops_aller : L12_stops_retour;
  const selectedStop = stops.find((s) => s.id === selectedStopId);

  const favoriteStops = stops.filter((s) => favoriteStopIds.includes(s.id));

  function handleDirectionChange(newDirection: Direction) {
    setDirection(newDirection);
    setSelectedStopId(""); // reset pour forcer une nouvelle détection/sélection dans la nouvelle direction
  }

  function handleFindBus() {
    router.push("/free/etaScreen"); // adapte au nom réel de ta route Screen 3
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <View style={styles.container}>
        <View style={styles.directionRow}>
          <TouchableOpacity
            style={[
              styles.directionButton,
              direction === "aller" && styles.directionButtonActive,
            ]}
            onPress={() => handleDirectionChange("aller")}
          >
            <Text
              style={
                direction === "aller"
                  ? styles.directionTextActive
                  : styles.directionText
              }
            >
              Aller → BIA
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.directionButton,
              direction === "retour" && styles.directionButtonActive,
            ]}
            onPress={() => handleDirectionChange("retour")}
          >
            <Text
              style={
                direction === "retour"
                  ? styles.directionTextActive
                  : styles.directionText
              }
            >
              Retour → Entreprise de l'Union
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.selectedBox}>
          <Text style={styles.selectedLabel}>Arrêt sélectionné</Text>
          <Text style={styles.selectedName}>
            {selectedStop ? selectedStop.nom : "Détection en cours..."}
          </Text>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {favoriteStops.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Favoris</Text>
              {favoriteStops.map((stop) => (
                <StopRow
                  key={stop.id}
                  name={stop.nom}
                  isSelected={stop.id === selectedStopId}
                  isFavorite
                  onPress={() => setSelectedStopId(stop.id)}
                  onToggleFavorite={() => toggleFavorite(stop.id)}
                />
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tous les arrêts</Text>
            {stops.map((stop) => (
              <StopRow
                key={stop.id}
                name={stop.nom}
                isSelected={stop.id === selectedStopId}
                isFavorite={favoriteStopIds.includes(stop.id)}
                onPress={() => setSelectedStopId(stop.id)}
                onToggleFavorite={() => toggleFavorite(stop.id)}
              />
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !selectedStopId && styles.primaryButtonDisabled,
          ]}
          onPress={handleFindBus}
          disabled={!selectedStopId}
        >
          <Text style={styles.primaryButtonText}>Trouver mon bus</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StopRow({
  name,
  isSelected,
  isFavorite,
  onPress,
  onToggleFavorite,
}: {
  name: string;
  isSelected: boolean;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.stopRow, isSelected && styles.stopRowSelected]}
      onPress={onPress}
    >
      <Text style={styles.stopName}>{name}</Text>
      <TouchableOpacity onPress={onToggleFavorite} hitSlop={8}>
        <Text style={styles.star}>{isFavorite ? "★" : "☆"}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  directionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  directionButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundChip,
    alignItems: "center",
  },
  directionButtonActive: { backgroundColor: colors.primary },
  directionText: { color: colors.textSecondary },
  directionTextActive: { color: colors.primaryText, fontWeight: "600" },

  selectedBox: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  selectedLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  selectedName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  scroll: { flex: 1 },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  stopRowSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  stopName: { fontSize: fontSize.md, color: colors.textPrimary },
  star: { fontSize: fontSize.lg, color: colors.primary },

  primaryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    marginTop: spacing.md,
  },
  primaryButtonDisabled: { backgroundColor: colors.backgroundChip },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
});
