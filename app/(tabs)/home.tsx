import LoadingModal from "@/src/components/LoadingModal";
import { AuthService } from "@/src/services/authService";
import { NotificationService } from "@/src/services/notificationService";
import { useToast } from "@/src/context/ToastContext";
import { ListaEsperaService } from "@/src/services/listaEsperaService";
import { SoundService } from "@/src/services/soundService";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/src/services/SupabaseClient";

export default function HomeEntradaScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const { usuarioId, usuarioNombre, usuarioFoto, clienteId, nombre, foto } =
    useLocalSearchParams();

  const isAnonimo = !!clienteId;
  const currentId = String(isAnonimo ? clienteId : usuarioId);
  const currentNombre = String(
    isAnonimo ? nombre : usuarioNombre || "Cliente Express",
  );
  const currentFoto = String(isAnonimo ? usuarioFoto || foto || "" : usuarioFoto || foto || "");

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await AuthService.cerrarSesion();

      router.replace("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      showToast("error", "Error", "No se pudo cerrar la sesión correctamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-primary justify-center items-center">
        <ActivityIndicator size="large" color="#F5C065" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-primary justify-center items-center p-6">
        <Text className="text-secondary font-bold text-center uppercase mb-4 text-xs">
          Se necesitan permisos de cámara para escanear el QR de entrada
        </Text>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);

    const valorEsperadoQR = "RISTODELI_ENTRADA";

    if (data !== valorEsperadoQR) {
      SoundService.reproducir("error");
      showToast(
        "error",
        "Código Inválido",
        "Este QR no corresponde a la entrada de Ristodeli.",
      );
      setTimeout(() => setScanned(false), 3000);
      return;
    }

    setLoading(true);
    try {
      if (currentId && currentId !== "undefined" && currentId !== "null" && currentId !== "") {
        const { data: cicloCompletado } = await supabase
          .from("lista_espera")
          .select("id")
          .eq("cliente_id", currentId)
          .eq("estado", "completado")
          .limit(1)
          .maybeSingle();

        if (cicloCompletado) {
          await supabase.from("lista_espera").delete().eq("id", cicloCompletado.id);
          await SoundService.reproducir("exito");
          showToast("success", "Visita Completada", "Gracias por tu visita. Resultados de encuestas.");
          router.replace("/(tabs)/encuestasPrevias" as any);
          return;
        }
      }

      if (isAnonimo) {
        await ListaEsperaService.agregarClienteAnonimo({
          nombre: currentNombre,
          foto: currentFoto,
          clienteId: currentId,
        });

        await SoundService.reproducir("exito");
        showToast(
          "success",
          "¡Anunciado!",
          "Te has unido a la lista de espera con éxito.",
        );

        NotificationService.notificarNuevoClienteEnEspera(currentNombre);

        router.replace({
          pathname: "/panelAccionesAnonimo" as any,
          params: {
            clienteId: currentId,
            nombre: currentNombre,
            foto: currentFoto,
          },
        });
      } else {
        await ListaEsperaService.agregarClienteRegistrado({
          nombre: currentNombre,
          foto: currentFoto,
          clienteId: currentId,
        });

        await SoundService.reproducir("exito");
        showToast(
          "success",
          "¡Anunciado!",
          "Te has unido a la lista de espera. El Metre te asignará una mesa pronto.",
        );

        NotificationService.notificarNuevoClienteEnEspera(currentNombre);

        router.replace({
          pathname: "/(tabs)/panelAccionesCliente",
          params: {
            usuarioNombre: currentNombre,
            usuarioFoto: currentFoto,
            usuarioId: currentId,
          },
        });
      }
    } catch (error: any) {
      SoundService.reproducir("error");
      showToast(
        "error",
        "Error",
        error.message || "No se pudo procesar el ingreso.",
      );
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <LoadingModal visible={loading} message="Procesando Entrada..." />

      <View className="px-6 pt-4 pb-4 bg-tertiary flex-row justify-between items-center shadow-md z-10">
        <View>
          <Text className="text-primary font-black text-xl uppercase tracking-tighter">
            Ristodeli
          </Text>
          <Text className="text-primary/70 font-bold text-[10px] uppercase">
            {isAnonimo ? "Modo Anónimo" : "Modo Registrado"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-primary/20 p-2.5 rounded-full active:bg-primary/40"
        >
          <Ionicons name="log-out-outline" size={24} color="#31603D" />
        </TouchableOpacity>
      </View>

      <View className="p-6 bg-secondary border-b border-tertiary/20 items-center">
        <Text className="text-primary font-black text-base uppercase tracking-wider">
          ¡Hola, {currentNombre.split(" ")[0]}!
        </Text>
        <Text className="text-primary/60 text-xs mt-1 text-center font-medium">
          Escanea el QR de la entrada para solicitar mesa
        </Text>
      </View>

      <View className="flex-1 overflow-hidden relative justify-center items-center">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        <View className="w-64 h-64 border-4 border-tertiary rounded-3xl opacity-70" />
      </View>
    </SafeAreaView>
  );
}
