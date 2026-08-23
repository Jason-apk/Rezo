import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";
import { colors, spacing, typography } from "@/src/theme/tokens";
import { StyleSheet, Text, View } from "react-native";

export default function ConnectivityBadge() {
  const isConnected = useNetworkStatus();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          { backgroundColor: isConnected ? colors.success : colors.error },
        ]}
      />
      <Text style={styles.label}>
        {isConnected ? "En ligne" : "Hors ligne"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
