// app/subscription.tsx
import { supabase } from "@/lib/supabase";
import { useRiderStore } from "@/store/useRiderStore";
import { colors, fontSize, radius, spacing } from "@/theme/tokens";
import { getDeviceId } from "@/utils/deviceId";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BENEFITS = [
  "Position du bus en temps réel, à chaque instant",
  "Temps d'arrivée estimé, fini l'attente à l'aveugle",
  "Alertes embouteillage, panne ou bus plein",
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "Quitter l'application ?",
        "Vous devez vous abonner pour continuer à suivre votre bus.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Quitter",
            style: "destructive",
            onPress: () => BackHandler.exitApp(),
          },
        ],
      );
      return true; // on gère l'événement nous-mêmes
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => subscription.remove();
  }, []);

  async function handleContinue() {
    const digits = phone.trim().replace(/\D/g, "");
    if (digits.length < 8) {
      Alert.alert(
        "Numéro invalide",
        "Merci de renseigner un numéro WhatsApp valide.",
      );
      return;
    }

    const fullNumber = `+228${digits}`;

    setSubmitting(true);
    try {
      const deviceId = await getDeviceId();

      await supabase.from("waitlist_subscriptions").insert({
        device_id: deviceId,
        whatsapp_number: fullNumber,
      });

      await supabase.from("events").insert({
        device_id: deviceId,
        action: "subscribe_click",
      });

      useRiderStore.getState().markSubscribed();
      router.replace("/subcription/thanks");
    } catch (e) {
      Alert.alert("Erreur", "Une erreur s'est produite, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.main}>
      <View style={styles.container}>
        <StatusBar style="dark" />

        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.headline}>Ne ratez plus jamais votre bus</Text>
        <Text style={styles.subHeadline}>
          Continuez à suivre la Ligne 12 en temps réel
        </Text>

        <View style={styles.priceCard}>
          <Text style={styles.priceAmount}>700 FCFA</Text>
          <Text style={styles.priceUnit}>pour 2 mois — soit 350 F/mois</Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.phoneRow}>
          <View style={styles.phonePrefix}>
            <Text style={styles.phonePrefixText}>🇹🇬 +228</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="90 00 00 00"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            submitting && styles.primaryButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? "Envoi..." : "Continuer sur WhatsApp"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footNote}>
          Les autres lignes seront progressivement intégrées
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: "center",
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: spacing.md,
  },
  headline: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subHeadline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  priceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
    width: "100%",
  },
  priceAmount: {
    fontSize: fontSize.hugeX,
    fontWeight: "800",
    color: colors.primaryText,
  },
  priceUnit: {
    fontSize: fontSize.sm,
    color: colors.primaryText,
    opacity: 0.9,
    marginTop: 2,
  },
  benefits: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  benefitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 7,
    marginRight: spacing.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  phoneRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: spacing.md,
  },
  phonePrefix: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRightWidth: 0,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
  },
  phonePrefixText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  footNote: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
const styles1 = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
  },
  headline: {
    fontSize: fontSize.lg,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  priceText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  laterLink: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: fontSize.base,
  },
});
