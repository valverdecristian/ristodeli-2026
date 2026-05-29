import { useToast } from "@/src/context/ToastContext";
import { supabase } from "@/src/services/SupabaseClient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  ScrollView,
} from "react-native";
import { NotificationService } from "@/src/services/notificationService";

export default function ListaConfirmarPedidosMozo() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pedidosAConfirmar, setPedidosAConfirmar] = useState<any[]>([]);

  const [modalRechazoVisible, setModalRechazoVisible] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [mesaSeleccionada, setMesaSeleccionada] = useState<number | null>(null);
  const [pedidosSeleccionados, setPedidosSeleccionados] = useState<any[]>([]);

  useEffect(() => {
    fetchPedidosAConfirmar();

    const channel = supabase
      .channel("cambios_confirmaciones_mozo")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        () => fetchPedidosAConfirmar(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPedidosAConfirmar = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("estado", "A Confirmar Mozo")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const grupos: { [key: number]: any } = {};
      data?.forEach((item) => {
        if (!grupos[item.mesa_numero]) {
          grupos[item.mesa_numero] = {
            mesa: item.mesa_numero,
            fecha: item.created_at,
            items: [],
          };
        }
        grupos[item.mesa_numero].items.push(item);
      });

      setPedidosAConfirmar(Object.values(grupos));
    } catch (error: any) {
      console.error("Error al cargar pedidos de mozo:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobarPedido = async (mesaNumero: number, items: any[]) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const ids = items.map((i) => i.id);

      const { error } = await supabase
        .from("pedidos")
        .update({ estado: "Pendiente" })
        .in("id", ids);

      if (error) throw error;

      NotificationService.notificarPedidoDerivado(mesaNumero, items).catch(
        (err) =>
          console.warn(
            "[handleAprobarPedido] Error enviando push a preparación:",
            err,
          ),
      );

      showToast(
        "success",
        "Pedido Confirmado",
        `Mesa Nº ${mesaNumero} enviada a preparación.`,
      );
      fetchPedidosAConfirmar();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const iniciarRechazo = (mesaNumero: number, items: any[]) => {
    setMesaSeleccionada(mesaNumero);
    setPedidosSeleccionados(items);
    setMotivoRechazo("");
    setModalRechazoVisible(true);
  };

  const confirmarRechazo = async () => {
    if (!motivoRechazo.trim()) {
      showToast(
        "error",
        "Motivo requerido",
        "Debes escribir por qué rechazas el pedido.",
      );
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const ids = pedidosSeleccionados.map((i) => i.id);

      const estadoFinal = `Rechazado: ${motivoRechazo.trim()}`;

      const { error } = await supabase
        .from("pedidos")
        .update({ estado: estadoFinal })
        .in("id", ids);

      if (error) throw error;

      if (mesaSeleccionada !== null) {
        NotificationService.notificarPedidoRechazado(
          mesaSeleccionada,
          motivoRechazo.trim(),
        ).catch((err) =>
          console.warn("[confirmarRechazo] Error enviando push:", err),
        );
      }

      setModalRechazoVisible(false);
      fetchPedidosAConfirmar();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const HEADER_HEIGHT = 80;
  const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - 120;

  if (loading && pedidosAConfirmar.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#F5C065" />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={pedidosAConfirmar}
        keyExtractor={(item) => item.mesa.toString()}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        ListEmptyComponent={
          <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT }} className="justify-center items-center px-6">
            <View className="items-center mb-4">
              <Image
                source={require("@/assets/images/icon.png")}
                className="w-48 h-48"
                resizeMode="contain"
              />
            </View>
            <Ionicons
              name="notifications-off-outline"
              size={40}
              color="#31603D"
              style={{ opacity: 0.5 }}
            />
            <Text className="text-primary font-black text-center mt-3 uppercase text-lg tracking-wider">
              No hay pedidos pendientes
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const hora = item.fecha
            ? new Date(item.fecha).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
            : "--:--";

          const CARD_WIDTH = SCREEN_WIDTH - 48;
          const CARD_HEIGHT = AVAILABLE_HEIGHT - 40;

          return (
            <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT, paddingHorizontal: 24, justifyContent: 'center' }}>
              <View
                style={{ width: CARD_WIDTH, height: CARD_HEIGHT, elevation: 3 }}
                className="bg-primary rounded-[32px] p-6 border border-tertiary/30 shadow-lg justify-between"
              >
                {/* Header de la mesa */}
                <View className="flex-row justify-between items-center border-b border-tertiary/20 pb-3 mb-3">
                  <Text className="text-white font-black text-lg uppercase">
                    Mesa N° {item.mesa}
                  </Text>
                  <View className="bg-secondary/15 px-3 py-1 rounded-full border border-tertiary/20">
                    <Text className="text-tertiary font-bold text-[9px] uppercase tracking-wider">
                      Recibido: {hora}
                    </Text>
                  </View>
                </View>

                {/* Lista de productos scrollable adentro de la tarjeta fija */}
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 my-2">
                  {item.items.map((prod: any) => (
                    <View
                      key={prod.id}
                      className="flex-row justify-between py-2 border-b border-tertiary/10"
                    >
                      <Text className="text-white/90 font-medium text-sm uppercase max-w-[80%]">
                        {prod.producto_nombre}
                      </Text>
                      <Text className="text-tertiary font-black text-sm">
                        x{prod.cantidad}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                {/* Botones de acción */}
                <View className="flex-row justify-between space-x-3 gap-2 mt-3">
                  <TouchableOpacity
                    onPress={() => iniciarRechazo(item.mesa, item.items)}
                    className="flex-1 bg-red-500 rounded-full py-4 items-center justify-center border-b-4 border-red-700 active:mt-1 active:border-b-0"
                  >
                    <Text className="text-white font-black text-xs uppercase tracking-wider">
                      Rechazar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAprobarPedido(item.mesa, item.items)}
                    className="flex-1 bg-tertiary rounded-full py-4 items-center justify-center border-b-4 border-orange active:mt-1 active:border-b-0"
                  >
                    <Text className="text-primary font-black text-xs uppercase tracking-wider">
                      Confirmar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {pedidosAConfirmar.length > 1 && (
        <View className="flex-row justify-center items-center pb-6 bg-secondary">
          <Ionicons name="swap-horizontal" size={14} color="#31603D" style={{ marginRight: 6 }} />
          <Text className="text-primary/75 font-bold text-[10px] uppercase tracking-widest">
            Desliza para ver más ({pedidosAConfirmar.length} comandas)
          </Text>
        </View>
      )}

      <Modal visible={modalRechazoVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-secondary p-6 rounded-[24px] w-full border border-tertiary/20">
            <Text className="text-primary font-black uppercase mb-2">
              Motivo del rechazo
            </Text>
            <Text className="text-primary/60 text-xs mb-4">
              El cliente verá este mensaje en su pantalla.
            </Text>

            <TextInput
              className="bg-primary/5 text-primary p-4 rounded-xl mb-4 text-sm font-medium"
              placeholder="Ej: No queda stock de este plato..."
              placeholderTextColor="#9ca3af"
              value={motivoRechazo}
              onChangeText={setMotivoRechazo}
              multiline
            />

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                className="px-4 py-3 rounded-lg bg-primary/10"
                onPress={() => setModalRechazoVisible(false)}
              >
                <Text className="text-primary font-bold text-xs uppercase">
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-4 py-3 rounded-lg bg-red-600 border-b-2 border-red-800 active:mt-0.5 active:border-b-0"
                onPress={confirmarRechazo}
              >
                <Text className="text-white font-black tracking-wider text-xs uppercase">
                  Confirmar Rechazo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
