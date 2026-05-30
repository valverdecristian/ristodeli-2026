import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="panelAccionesAnonimo" />
      <Stack.Screen name="panelAccionesCliente" />
      <Stack.Screen name="encuestasPrevias" />
      <Stack.Screen name="graficoDetalle" />
      <Stack.Screen name="explore" />

      <Stack.Screen name="mesa/escanearMesa" />
      <Stack.Screen name="mesa/panelMesaCliente" />
      <Stack.Screen name="mesa/menuProductos" />
      <Stack.Screen name="mesa/chatMozo" />
      <Stack.Screen name="mesa/pedirCuenta" />
      <Stack.Screen name="mesa/estadoPedido" />
      <Stack.Screen name="mesa/formularioEncuesta" />
      <Stack.Screen name="mesa/[numero]" />

      <Stack.Screen name="cantinero/[id]" />
      <Stack.Screen name="cocinero/[id]" />
      <Stack.Screen name="metre/[id]" />
    </Stack>
  );
}
