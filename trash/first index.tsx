import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useGtfsStore } from "../src/store/gtfsStore";

export default function GtfsCheckScreen() {
  const {
    isReady,
    isLoading,
    error,
    stops,
    routes,
    edgeCount,
    initialize,
    reimport,
    findPath,
  } = useGtfsStore();

  const [testResult, setTestResult] = useState<string>("");
  const [testRunning, setTestRunning] = useState(false);

  // Lance l'initialisation une seule fois au montage de l'écran
  useEffect(() => {
    initialize();
  }, []);

  const handleTestDijkstra = async () => {
    if (stops.length < 2) {
      setTestResult("⚠️ Pas assez d'arrêts pour tester.");
      return;
    }

    setTestRunning(true);
    setTestResult("");

    try {
      // Test simple : premier arrêt de la liste vers le dernier
      const from = stops[418];
      const to = stops[455];

      const result = await findPath(from.stop_id, to.stop_id);

      if (!result.found) {
        setTestResult(
          `❌ Aucun chemin trouvé entre "${from.stop_name}" et "${to.stop_name}".`,
        );
      } else {
        const minutes = Math.round(result.totalCostSeconds / 60);
        const pathNames = result.path.map((step) => step.stopName).join(" → ");
        setTestResult(`✅ Chemin trouvé (${minutes} min) :\n${pathNames}`);
      }
    } catch (err) {
      setTestResult(
        `❌ Erreur : ${err instanceof Error ? err.message : "inconnue"}`,
      );
    } finally {
      setTestRunning(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E2761" />
        <Text style={styles.loadingText}>Chargement du GTFS...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => initialize()}>
          <Text style={styles.buttonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Initialisation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── Compteurs ─── */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{routes.length}</Text>
          <Text style={styles.statLabel}>Lignes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stops.length}</Text>
          <Text style={styles.statLabel}>Arrêts</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{edgeCount}</Text>
          <Text style={styles.statLabel}>Edges</Text>
        </View>
      </View>

      {/* ─── Bouton réimport ─── */}
      <TouchableOpacity style={styles.secondaryButton} onPress={reimport}>
        <Text style={styles.secondaryButtonText}>
          🔄 Réinitialiser & réimporter
        </Text>
      </TouchableOpacity>

      {/* ─── Bouton test Dijkstra ─── */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleTestDijkstra}
        disabled={testRunning}
      >
        <Text style={styles.buttonText}>
          {testRunning ? "Calcul en cours..." : "🧭 Tester Dijkstra"}
        </Text>
      </TouchableOpacity>

      {testResult !== "" && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{testResult}</Text>
        </View>
      )}

      {/* ─── Liste des arrêts (preuve que la DB fonctionne) ─── */}
      <Text style={styles.sectionTitle}>Arrêts importés</Text>
      <FlatList
        data={stops}
        keyExtractor={(item) => item.stop_id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.listRow}>
            <Text style={styles.listRowTitle}>{item.stop_name}</Text>
            <Text style={styles.listRowSubtitle}>{item.stop_id}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 12, color: "#55607A", fontSize: 14 },
  errorText: {
    color: "#F96167",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F4F6FC",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 4,
  },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#1E2761" },
  statLabel: { fontSize: 12, color: "#55607A", marginTop: 4 },

  button: {
    backgroundColor: "#1E2761",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  secondaryButton: {
    backgroundColor: "#F4F6FC",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  secondaryButtonText: { color: "#1E2761", fontWeight: "600", fontSize: 13 },

  resultBox: {
    backgroundColor: "#F4F6FC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  resultText: { fontSize: 13, color: "#1C2333", lineHeight: 20 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E2761",
    marginBottom: 8,
  },
  list: { flex: 1 },
  listRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  listRowTitle: { fontSize: 14, color: "#1C2333", fontWeight: "500" },
  listRowSubtitle: { fontSize: 11, color: "#9AA3BD", marginTop: 2 },
});
