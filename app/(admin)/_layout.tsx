import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="agregar-empleado"
        options={{ title: "Agregar Empleado", headerShown: false }}
      />
      <Stack.Screen name="alta-mesa" options={{ headerShown: false }} />
      <Stack.Screen name="listado-mesas" options={{ headerShown: false }} />
      <Stack.Screen
        name="aprobar-clientes"
        options={{ title: "Aprobar Clientes" }}
      />
      <Stack.Screen
        name="visualizar-encuestas"
        options={{ title: "Visualizar Encuestas" }}
      />
      <Stack.Screen name="test-camera" options={{ title: "Test de Cámara" }} />
    </Stack>
  );
}
