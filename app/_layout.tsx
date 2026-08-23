import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="ligneDetailModal/[id]"
          options={{
            presentation: "transparentModal",
            animation: "slide_from_bottom",
            headerShown: false,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
