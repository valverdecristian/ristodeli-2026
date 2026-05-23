import HomeClienteBase from "@/src/components/HomeClienteBase";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function PanelAccionesAnonimoScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { currentUser, cerrarSesion } = useAuth();

  const { clienteId, nombre, foto } = useLocalSearchParams<{
    clienteId?: string;
    nombre?: string;
    foto?: string;
  }>();

  if (!clienteId) {
    return (
      <View className="flex-1 bg-primary justify-center items-center">
        <ActivityIndicator size="large" color="#F5C065" />
        <Text className="text-white mt-2 text-xs uppercase">
          Cargando perfil temporal...
        </Text>
      </View>
    );
  }

  const handleEscanearMesaAsignada = () => {
    showToast(
      "info",
      "Escáner de Mesa",
      "Abriendo cámara para vincular tu usuario a la mesa asignada por el Metre.",
    );
    router.push({
      pathname: "/(tabs)/mesa/escanearMesa" as any,
      params: {
        clienteId: clienteId,
        tipoCliente: "anonimo",
      },
    });
  };

  const handleJuegos = () => {
    router.push("/(juegos)" as any);
  };

  const handleLogout = async () => {
    showToast("info", "Cerrando sesión", "Volviendo al inicio...");
    await cerrarSesion();
    router.replace("/login");
  };

  const fotoSegura =
    foto ||
    currentUser?.foto_url ||
    "https://wtjylfdfdwowzzvunlpa.supabase.co/storage/v1/object/public/avatares/icon.png";

  return (
    <HomeClienteBase
      nombre={nombre || currentUser?.nombres || "Cliente Anónimo"}
      fotoUrl={fotoSegura}
      tipoCliente="anonimo"
      enListaEspera={true}
      onEscanearEntrada={() =>
        showToast(
          "info",
          "Ya registrado",
          "Ya te encuentras anotado en la lista de espera.",
        )
      }
      onEscanearMesa={handleEscanearMesaAsignada}
      onVerEncuestas={() => router.push("/(tabs)/encuestasPrevias" as any)}
      onJuegos={handleJuegos}
      onLogout={handleLogout}
    />
  );
}
