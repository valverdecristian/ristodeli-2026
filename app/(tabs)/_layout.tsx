import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="panelAccionesAnonimo" />

      <Stack.Screen name="mesa/escanearMesa" />
      <Stack.Screen name="mesa/panelMesaCliente" />
      <Stack.Screen name="mesa/menuProductos" />
      <Stack.Screen name="mesa/chatMozo" />
    </Stack>
  );
}