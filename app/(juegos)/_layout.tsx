import { Stack } from "expo-router";

export default function JuegosLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="tateti" options={{ headerShown: false }} />
      <Stack.Screen name="adivinanza" options={{ headerShown: false }} />
      <Stack.Screen name="memoria" options={{ headerShown: false }} />
    </Stack>
  );
}
