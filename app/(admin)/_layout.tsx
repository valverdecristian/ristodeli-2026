import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="agregar-empleado"
        options={{ title: "Agregar Empleado" }}
      />
      <Stack.Screen name="alta-mesa" options={{ title: "Alta de Mesa" }} />
      <Stack.Screen
        name="listado-mesas"
        options={{ title: "Listado de Mesas" }}
      />
      <Stack.Screen
        name="aprobar-clientes"
        options={{ title: "Aprobar Clientes" }}
      />
      <Stack.Screen
        name="visualizar-encuestas"
        options={{ title: "Visualizar Encuestas" }}
      />
    </Stack>
  );
}
