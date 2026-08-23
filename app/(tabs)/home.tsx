import ConnectivityBadge from "@/src/components/ConnectivityBadge";
import { GtfsRoute } from "@/src/gtfs/types";
import { useGtfsStore } from "@/src/store/gtfsStore";
import { StatusBar } from "expo-status-bar";

import {
  colors,
  getLineColor,
  radius,
  spacing,
  typography,
} from "@/src/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const routes = useGtfsStore((state) => state.routes);

  const handleSelectLine = (route: GtfsRoute) => {
    // Navigue vers l'onglet Map avec la ligne pré-sélectionnée
    router.push({
      pathname: "/(tabs)/map",
      params: { preselectedLineId: route.route_id },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes lignes</Text>
        <ConnectivityBadge />
      </View>

      {/* ─── Accès secondaire à l'itinéraire A→B ─── */}
      <TouchableOpacity
        style={styles.itinerarySearchBar}
        onPress={() => router.push("/(tabs)/itineraire")}
      >
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <Text style={styles.itinerarySearchText}>
          Aller d'un arrêt à un autre
        </Text>
      </TouchableOpacity>

      {/* ─── Liste des lignes ─── */}
      <FlatList
        data={routes}
        keyExtractor={(item) => item.route_id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.lineCard}
            onPress={() => handleSelectLine(item)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.linePictogram,
                { backgroundColor: getLineColor(item.route_short_name) },
              ]}
            >
              <Ionicons name="bus" size={22} color={colors.white} />
            </View>

            <View style={styles.lineInfo}>
              <Text style={styles.lineCode}>{item.route_short_name}</Text>
              <Text style={styles.lineName} numberOfLines={1}>
                {item.route_long_name}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucune ligne disponible.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.screenTitle,
    color: colors.primary,
  },

  itinerarySearchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  itinerarySearchText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  lineCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 72, // cible tactile généreuse
  },
  linePictogram: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  lineInfo: {
    flex: 1,
  },
  lineCode: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  lineName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
