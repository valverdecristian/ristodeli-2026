import HomeClienteBase from "@/src/components/HomeClienteBase";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function PanelAccionesClienteScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { cerrarSesion } = useAuth();
  const { usuarioId, usuarioNombre, usuarioFoto } = useLocalSearchParams();

  const handleEscanearMesaCliente = () => {
    showToast(
      "info",
      "Escáner de Mesa",
      "Abriendo cámara para vincular tu usuario a la mesa asignada por el Metre.",
    );
    router.push("/(tabs)/mesa/escanearMesa");
  };

  const handleJuegos = () => {
    router.push("/(juegos)" as any);
  };

  const handleLogout = async () => {
    showToast("info", "Cerrando sesión", "Volviendo al inicio...");
    await cerrarSesion();
    router.replace("/login");
  };

  return (
    <HomeClienteBase
      nombre={usuarioNombre as string}
      fotoUrl={usuarioFoto as string}
      tipoCliente="registrado"
      enListaEspera={true}
      onEscanearEntrada={() =>
        showToast(
          "info",
          "Ya registrado",
          "Ya te encuentras en la lista de espera del local.",
        )
      }
      onEscanearMesa={handleEscanearMesaCliente}
      onVerEncuestas={() => router.push("/(tabs)/encuestasPrevias")}
      onJuegos={handleJuegos}
      onLogout={handleLogout}
    />
  );
}
