// app/subscription/thanks.tsx
import { colors, fontSize, radius, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// À remplacer par les vraies valeurs
const WHATSAPP_NUMBER = "+22893677876"; // format international, sans espaces
const CONTACT_EMAIL = "agbenotojason06@gmail.com";

function openWhatsApp() {
  const phone = WHATSAPP_NUMBER.replace("+", "");
  Linking.openURL(`https://wa.me/${phone}`);
}

function openEmail() {
  Linking.openURL(`mailto:${CONTACT_EMAIL}`);
}

export default function ThanksScreen() {
  return (
    <SafeAreaView style={styles.main}>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.communityBadge}>
          <Ionicons name="people" size={18} color={colors.primary} />
          <Text style={styles.communityBadgeText}>Communauté REZO</Text>
        </View>

        <Text style={styles.title}>Bienvenue à bord 🎉</Text>
        <Text style={styles.message}>
          Vous faites désormais partie des premiers à recevoir la version
          complète de REZO. Vous serez informé dès que l'accès à la Ligne 12
          sera activé.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.contactLabel}>Une question, une suggestion ?</Text>

        <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsApp}>
          <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
          <Text style={styles.whatsappButtonText}>
            Discuter avec l'équipe REZO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={openEmail}>
          <Text style={styles.emailText}>{CONTACT_EMAIL}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: spacing.md,
  },
  communityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundChip,
    borderRadius: radius.pill ?? 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: 6,
  },
  communityBadgeText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: fontSize.sm,
  },
  title: {
    fontSize: fontSize.huge,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  contactLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#25D366",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  whatsappButtonText: {
    color: "#FFFFFF",
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  emailText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textDecorationLine: "underline",
  },
});
