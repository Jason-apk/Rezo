// app/index.tsx
import { supabase } from "@/lib/supabase";
import { useRiderStore } from "@/store/useRiderStore";
import { colors } from "@/theme/tokens";
import { getDeviceId } from "@/utils/deviceId";
import { isTrialExpired } from "@/utils/trial";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();
  const firstLaunchAt = useRiderStore((s) => s.firstLaunchAt);
  const hasSubscribed = useRiderStore((s) => s.hasSubscribed);
  const setFirstLaunchIfNeeded = useRiderStore((s) => s.setFirstLaunchIfNeeded);

  useEffect(() => {
    const isFirstLaunch = !useRiderStore.getState().firstLaunchAt;
    useRiderStore.getState().setFirstLaunchIfNeeded();

    (async () => {
      const deviceId = await getDeviceId();
      await supabase
        .from("events")
        .insert({ device_id: deviceId, action: "session_start" });

      if (isFirstLaunch) {
        await supabase
          .from("events")
          .insert({ device_id: deviceId, action: "trial_started" });
      }
    })();

    const timer = setTimeout(() => {
      const { firstLaunchAt, hasSubscribed } = useRiderStore.getState();

      if (hasSubscribed) {
        router.replace("/subcription/thanks");
        return;
      }

      const expired = isTrialExpired(firstLaunchAt);
      if (expired) {
        router.replace("/subcription");
      } else {
        router.replace("/free");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Image
        source={require("@/assets/images/icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Où est mon bus ?</Text>
      <ActivityIndicator
        size="small"
        color={colors.primary}
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 120, height: 120, marginBottom: 24 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 32,
  },
  loader: { marginTop: 8 },
});
