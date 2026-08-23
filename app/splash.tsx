import { useGtfsStore } from "@/src/store/gtfsStore";
import { colors, spacing, typography } from "@/src/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const { isReady, isLoading, error, initialize } = useGtfsStore();

  useEffect(() => {
    initialize();
  }, []);

  // Dès que le GTFS est prêt, on redirige automatiquement vers Home
  if (isReady) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoBlock}>
        <Text style={styles.logo}>REZO</Text>
        <Text style={styles.tagline}>
          Se déplacer à Lomé, en toute confiance.
        </Text>
      </View>

      <View style={styles.statusBlock}>
        {error ? (
          <>
            <Ionicons name="alert-circle" size={28} color={colors.error} />
            <Text style={styles.errorText}>
              Une erreur est survenue au chargement.
            </Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="small" color={colors.white} />
            <Text style={styles.loadingText}>
              {isLoading ? "Préparation de l'application..." : "Chargement..."}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
  },
  logoBlock: {
    marginTop: spacing.xl * 2,
    alignItems: "center",
  },
  logo: {
    ...typography.screenTitle,
    fontSize: 44,
    color: colors.white,
    fontWeight: "800",
    letterSpacing: 2,
  },
  tagline: {
    ...typography.body,
    color: "#CADCFC",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  statusBlock: {
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: "#CADCFC",
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
