import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { usePositionsStore } from "../store/usePositionsStore";

const NAVY = "#0A1F44";
const CORAL = "#FF6B5B";
const WHITE = "#FFFFFF";
const GREEN = "#2ECC71";
const LINE_ID = "L12";

export default function RealtimeTestScreen() {
  const { positions, upsertPosition } = usePositionsStore();
  const [connected, setConnected] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel("l12-realtime-test")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bus_positions",
          filter: `line_id=eq.${LINE_ID}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (!row) return;
          upsertPosition({
            bus_id: row.bus_id,
            line_id: row.line_id,
            direction: row.direction,
            lat: row.lat,
            lng: row.lng,
            speed: row.speed,
            accuracy: row.accuracy,
            updated_at: row.updated_at,
          });
          setEventCount((c) => c + 1);
        },
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const list = Object.values(positions).sort((a, b) =>
    a.bus_id.localeCompare(b.bus_id),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: connected ? GREEN : "#CCC" },
            ]}
          />
          <Text style={styles.statusText}>
            {connected ? "Connecté (Postgres Changes)" : "Connexion..."}
          </Text>
        </View>
        <Text style={styles.eventCount}>{eventCount} events reçus</Text>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.bus_id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>
            En attente de position sur {LINE_ID}...
          </Text>
        }
        renderItem={({ item }) => <PositionCard position={item} />}
      />
    </View>
  );
}

function PositionCard({
  position,
}: {
  position: ReturnType<typeof Object.values>[number];
}) {
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 100);
    return () => clearTimeout(t);
  }, [position.receivedAt]);

  return (
    <View style={[styles.card, flash && styles.cardFlash]}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.busId}>{position.bus_id}</Text>
        <Text style={styles.direction}>{position.direction}</Text>
      </View>

      <View style={styles.coordRow}>
        <Text style={styles.coordLabel}>lat</Text>
        <Text style={styles.coordValue}>{position.lat.toFixed(6)}</Text>
      </View>
      <View style={styles.coordRow}>
        <Text style={styles.coordLabel}>lng</Text>
        <Text style={styles.coordValue}>{position.lng.toFixed(6)}</Text>
      </View>
      <View style={styles.coordRow}>
        <Text style={styles.coordLabel}>vitesse</Text>
        <Text style={styles.coordValue}>
          {position.speed != null ? `${position.speed.toFixed(1)} m/s` : "—"}
        </Text>
      </View>
      <View style={styles.coordRow}>
        <Text style={styles.coordLabel}>précision</Text>
        <Text style={styles.coordValue}>
          {position.accuracy != null
            ? `${position.accuracy.toFixed(0)} m`
            : "—"}
        </Text>
      </View>

      <Text style={styles.updatedAt}>
        maj serveur : {new Date(position.updated_at).toLocaleTimeString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  statusRow: { flexDirection: "row", alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: "600", color: NAVY },
  eventCount: { fontSize: 12, color: "#888", marginTop: 4 },
  listContent: { padding: 16 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
  card: {
    backgroundColor: "#F7F8FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardFlash: { borderColor: CORAL, backgroundColor: "#FFF1EF" },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  busId: { fontSize: 18, fontWeight: "800", color: NAVY },
  direction: {
    fontSize: 12,
    fontWeight: "700",
    color: WHITE,
    backgroundColor: NAVY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  coordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  coordLabel: { fontSize: 13, color: "#888" },
  coordValue: {
    fontSize: 13,
    fontWeight: "600",
    color: NAVY,
    fontVariant: ["tabular-nums"],
  },
  updatedAt: { fontSize: 11, color: "#AAA", marginTop: 8, textAlign: "right" },
});
