// src/components/FeedbackOverlay.tsx
import { colors, fontSize, radius, spacing } from "@/theme/tokens";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function FeedbackOverlay({
  onRespond,
}: {
  onRespond: (positive: boolean) => void;
}) {
  return (
    <View style={styles.overlay}>
      <Text style={styles.question}>Le bus est arrivé à l'heure ?</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={() => onRespond(true)}>
          <Text style={styles.emoji}>👍</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onRespond(false)}
        >
          <Text style={styles.emoji}>👎</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  question: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: { flexDirection: "row", gap: spacing.lg },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundChip,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: { fontSize: fontSize.xl },
});
