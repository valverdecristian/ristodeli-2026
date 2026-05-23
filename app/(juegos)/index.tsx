import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Juego {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  descuento: number;
  ruta: string;
  color: string;
}

const JUEGOS: Juego[] = [
  {
    id: "tateti",
    nombre: "Tateti",
    descripcion: "Derrota la IA en 3 en línea",
    icono: "grid",
    descuento: 10,
    ruta: "/(juegos)/tateti",
    color: "#31603D",
  },
  {
    id: "adivinanza",
    nombre: "Adivinanza",
    descripcion: "Adivina el número secreto",
    icono: "help-circle",
    descuento: 15,
    ruta: "/(juegos)/adivinanza",
    color: "#1B4D2E",
  },
  {
    id: "memoria",
    nombre: "Memoria",
    descripcion: "Encuentra los pares ocultos",
    icono: "shuffle",
    descuento: 20,
    ruta: "/(juegos)/memoria",
    color: "#2A5F3A",
  },
];

interface EstadoJuegoSesion {
  juegoSeleccionado: string | null;
  juegosJugados: string[];
  descuentoGanado: number;
  juegoGanador: string | null;
}

export default function JuegosMenuScreen() {
  const router = useRouter();
  const { sesion_id, mesaId } = useLocalSearchParams<{ sesion_id?: string; mesaId?: string }>();
  const [loading, setLoading] = useState(true);
  const [sessionState, setSessionState] = useState<EstadoJuegoSesion | null>(null);

  useEffect(() => {
    cargarEstadoJuegos();
  }, [sesion_id]);

  const cargarEstadoJuegos = async () => {
    if (!sesion_id) {
      setLoading(false);
      return;
    }
    try {
      const key = `ristodeli_juegos_sesion_${sesion_id}`;
      const json = await AsyncStorage.getItem(key);
      if (json) {
        setSessionState(JSON.parse(json));
      } else {
        setSessionState({
          juegoSeleccionado: null,
          juegosJugados: [],
          descuentoGanado: 0,
          juegoGanador: null
        });
      }
    } catch (err) {
      console.error("[JUEGOS_INDEX] Error al cargar AsyncStorage:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJugar = (ruta: string) => {
    router.push({
      pathname: ruta as any,
      params: { sesion_id, mesaId }
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary justify-center items-center">
        <ActivityIndicator size="large" color="#F5C065" />
        <Text className="text-secondary font-bold mt-4 uppercase text-xs">Cargando estado...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      {/* Header */}
      <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center shadow-2xl">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={30} color="#31603D" />
        </TouchableOpacity>
        <Text className="text-primary font-bold text-2xl uppercase tracking-tighter">
          Juegos
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6 pt-8 pb-8"
      >
        {/* Título descriptivo */}
        <View className="mb-8">
          <Text className="text-secondary font-bold text-lg uppercase text-center">
            Gana Descuentos
          </Text>
          <Text className="text-secondary/70 text-xs text-center mt-2">
            Juega y gana descuentos en tu primera victoria
          </Text>
        </View>

        {/* Grid de juegos */}
        <View className="gap-6">
          {JUEGOS.map((juego) => {
            // Evaluamos la elegibilidad de este juego para descuento
            const primerJuegoSeleccionado = sessionState?.juegoSeleccionado;
            const esEsteJuegoSeleccionado = primerJuegoSeleccionado === juego.id;
            const yaJugoAlgono = !!primerJuegoSeleccionado;

            // Reglas de mensajes de estado
            let statusLabel = "Disponible para descuento";
            let statusColor = "text-primary/50";

            if (yaJugoAlgono) {
              if (esEsteJuegoSeleccionado) {
                if (sessionState.descuentoGanado > 0 && sessionState.juegoGanador === juego.id) {
                  statusLabel = `¡Descuento del ${sessionState.descuentoGanado}% ganado! 🎉`;
                  statusColor = "text-green-600 font-extrabold";
                } else if (sessionState.juegosJugados.includes(juego.id)) {
                  statusLabel = "Primer intento jugado (Sin descuento)";
                  statusColor = "text-orange-600 font-bold";
                } else {
                  statusLabel = "Juego seleccionado (Intento activo)";
                  statusColor = "text-yellow-600 font-bold";
                }
              } else {
                statusLabel = "Solo por diversión (No califica)";
                statusColor = "text-red-500 font-bold";
              }
            }

            return (
              <View
                key={juego.id}
                className="bg-secondary rounded-3xl p-6 shadow-lg border-2 border-tertiary/20"
              >
                {/* Header de la tarjeta */}
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-row items-center flex-1">
                    {/* Icono del juego */}
                    <View className="bg-primary/10 p-4 rounded-2xl mr-4">
                      <Ionicons
                        name={juego.icono as any}
                        size={28}
                        color="#31603D"
                      />
                    </View>

                    {/* Nombre y descripción */}
                    <View className="flex-1">
                      <Text className="text-primary font-bold text-xl uppercase">
                        {juego.nombre}
                      </Text>
                      <Text className="text-primary/60 text-xs mt-1">
                        {juego.descripcion}
                      </Text>
                    </View>
                  </View>

                  {/* Badge de descuento */}
                  <View
                    style={{ backgroundColor: juego.color }}
                    className="px-4 py-2 rounded-full"
                  >
                    <Text className="text-white font-black text-sm">
                      +{juego.descuento}%
                    </Text>
                  </View>
                </View>

                {/* Línea divisoria */}
                <View className="h-px bg-primary/10 mb-4" />

                {/* Footer con botón */}
                <View className="flex-row items-center justify-between">
                  <Text className={`font-semibold text-xs uppercase ${statusColor}`}>
                    {statusLabel}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleJugar(juego.ruta)}
                    style={{ backgroundColor: juego.color }}
                    className="px-6 py-3 rounded-full shadow-md flex-row items-center gap-2"
                  >
                    <Text className="text-white font-bold text-sm uppercase tracking-wider">
                      Jugar
                    </Text>
                    <Ionicons name="play" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Información importante */}
        <View className="mt-8 bg-primary/5 border border-tertiary/30 rounded-2xl p-5">
          <Text className="text-primary font-bold text-xs uppercase mb-3">
            📋 Cómo funciona
          </Text>
          <Text className="text-primary/70 text-xs leading-relaxed">
            • Solo obtienes descuento en tu{" "}
            <Text className="font-bold">primer juego ganado</Text>
            {"\n"}• Debe ser una{" "}
            <Text className="font-bold">victoria sin errores</Text>
            {"\n"}• Los descuentos NO se acumulan entre juegos
            {"\n"}• Aplica en tu próxima comanda
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
