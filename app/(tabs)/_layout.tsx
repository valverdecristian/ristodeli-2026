// app/(tabs)/_layout.tsx
import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 🌟 REGISTRAMOS EXPLICITAMENTE CADA PANTALLA DE ESTA SUB-CARPETA */}
      <Stack.Screen name="home" />
      <Stack.Screen name="panelAccionesAnonimo" />
      
      {/* 🌟 Mapeamos las subcarpetas internas como la de la mesa */}
      <Stack.Screen name="mesa/escanearMesa" />
      <Stack.Screen name="mesa/panelMesaCliente" />
      <Stack.Screen name="mesa/menuProductos" />
      <Stack.Screen name="mesa/chatMozo" />
    </Stack>
  );
}