import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SoundService } from "@/src/services/soundService";
import { useToast } from "@/src/context/ToastContext";
import * as Haptics from "expo-haptics";

const EMOJIS = ["🍔", "🍕", "🍜", "🍣", "🍰", "🍷"];
const CARDS = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);

const styles = StyleSheet.create({
  grid: {
    alignItems: "center",
    gap: 8,
    marginVertical: 20,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#F5C065",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  cardFlipped: {
    backgroundColor: "#E8D9C8",
  },
  cardText: {
    fontSize: 32,
  },
});

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

export default function MemoriaScreen() {
  const router = useRouter();
  const { sesion_id, mesaId } = useLocalSearchParams<{ sesion_id?: string; mesaId?: string }>();
  const { showToast } = useToast();

  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados de descuento
  const [juegoHabilitado, setJuegoHabilitado] = useState(true);
  const [descuentoAplicado, setDescuentoAplicado] = useState(0);
  const [esPrimerIntento, setEsPrimerIntento] = useState(true);
  const [feedback, setFeedback] = useState("Encuentra los pares ocultos");

  useEffect(() => {
    cargarEstadoSesion();
    initializeGame();
  }, [sesion_id]);

  const cargarEstadoSesion = async () => {
    if (!sesion_id) {
      setLoading(false);
      return;
    }
    try {
      const key = `ristodeli_juegos_sesion_${sesion_id}`;
      const json = await AsyncStorage.getItem(key);
      if (json) {
        const state = JSON.parse(json);
        if (state.juegoSeleccionado && state.juegoSeleccionado !== "memoria") {
          setJuegoHabilitado(false); // No califica para descuento
        }
        if (state.juegosJugados && state.juegosJugados.includes("memoria")) {
          setEsPrimerIntento(false); // Ya jugó a este juego en esta sesión
        }
        if (state.descuentoGanado) {
          setDescuentoAplicado(state.descuentoGanado);
        }
      }
    } catch (err) {
      console.error("[MEMORIA] Error al cargar sesión:", err);
    } finally {
      setLoading(false);
    }
  };

  const registrarIntentoJuego = async () => {
    if (!sesion_id) return;
    try {
      const key = `ristodeli_juegos_sesion_${sesion_id}`;
      const json = await AsyncStorage.getItem(key);
      let state = json ? JSON.parse(json) : { juegoSeleccionado: null, juegosJugados: [], descuentoGanado: 0, juegoGanador: null };

      if (!state.juegoSeleccionado) {
        state.juegoSeleccionado = "memoria";
      }
      if (!state.juegosJugados.includes("memoria")) {
        state.juegosJugados.push("memoria");
      }
      await AsyncStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.error(err);
    }
  };

  const aplicarDescuento = async () => {
    if (!sesion_id) return;
    try {
      const key = `ristodeli_juegos_sesion_${sesion_id}`;
      const json = await AsyncStorage.getItem(key);
      let state = json ? JSON.parse(json) : {};
      state.descuentoGanado = 20;
      state.juegoGanador = "memoria";
      await AsyncStorage.setItem(key, JSON.stringify(state));
      setDescuentoAplicado(20);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (flipped.length === 2) {
      const [first, second] = flipped;
      if (cards[first].emoji === cards[second].emoji) {
        setMatched([...matched, first, second]);
        setFlipped([]);
        setAttempts(attempts + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setAttempts(attempts + 1);
        }, 800);
      }
    }
  }, [flipped]);

  useEffect(() => {
    if (matched.length === CARDS.length && matched.length > 0) {
      setWon(true);
      manejarVictoria();
    }
  }, [matched]);

  const manejarVictoria = async () => {
    if (juegoHabilitado && esPrimerIntento && attempts === EMOJIS.length && descuentoAplicado === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await SoundService.reproducir("exito");
      await aplicarDescuento();
      setFeedback("🎉 ¡Perfecto! +20% DESCUENTO APLICADO");
      showToast("success", "¡Descuento Obtenido!", "Se aplicó un 20% de descuento a tu mesa.");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await SoundService.reproducir("exito");
      setFeedback(`Ganaste en ${attempts} intentos (Sin descuento)`);
    }
  };

  const initializeGame = () => {
    const shuffledCards = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
    const newCards = shuffledCards.map((emoji, id) => ({
      id,
      emoji,
      flipped: false,
      matched: false,
    }));
    setCards(newCards);
    setFlipped([]);
    setMatched([]);
    setAttempts(0);
    setWon(false);
  };

  const handleCardPress = async (id: number) => {
    if (
      flipped.includes(id) ||
      matched.includes(id) ||
      flipped.length === 2 ||
      won
    ) {
      return;
    }

    if (attempts === 0 && flipped.length === 0 && matched.length === 0) {
      await registrarIntentoJuego();
    }

    setFlipped([...flipped, id]);
  };

  const handleReinicio = () => {
    setEsPrimerIntento(false);
    initializeGame();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary justify-center items-center">
        <ActivityIndicator size="large" color="#F5C065" />
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
          Memoria
        </Text>
      </View>

      {/* Contenido */}
      <View className="flex-1 justify-center items-center px-6">

        {/* Banner de estado de descuento */}
        <View className="mb-6 w-full px-4">
          {!juegoHabilitado ? (
            <View className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl">
              <Text className="text-red-700 font-bold text-center text-xs uppercase">
                ⚠️ Solo juegas por diversión. No califica para descuento.
              </Text>
            </View>
          ) : descuentoAplicado > 0 ? (
            <View className="bg-green-600/20 border border-green-600/50 p-3 rounded-xl">
              <Text className="text-green-700 font-extrabold text-center text-xs uppercase">
                🎉 ¡Descuento de 20% obtenido en esta sesión!
              </Text>
            </View>
          ) : !esPrimerIntento ? (
            <View className="bg-orange-500/20 border border-orange-500/50 p-3 rounded-xl">
              <Text className="text-orange-700 font-bold text-center text-xs uppercase">
                ⚠️ Juego reiniciado. Ya no califica para descuento.
              </Text>
            </View>
          ) : (
            <View className="bg-primary/10 border border-tertiary/40 p-3 rounded-xl">
              <Text className="text-secondary font-bold text-center text-xs uppercase">
                🎯 ¡Primer intento activo! Junta los pares en 6 intentos para el 20%.
              </Text>
            </View>
          )}
        </View>

        {/* Estadísticas */}
        <View className="bg-secondary rounded-2xl px-6 py-4 mb-6 w-full flex-row justify-around">
          <View className="items-center">
            <Text className="text-primary/60 text-xs font-bold uppercase">
              Pares
            </Text>
            <Text className="text-primary font-bold text-2xl">
              {matched.length / 2}/{EMOJIS.length}
            </Text>
          </View>
          <View className="h-full w-px bg-primary/10" />
          <View className="items-center">
            <Text className="text-primary/60 text-xs font-bold uppercase">
              Intentos
            </Text>
            <Text className="text-primary font-bold text-2xl">{attempts}</Text>
          </View>
        </View>

        {/* Grid de cartas */}
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((row) => (
            <View key={row} style={styles.row}>
              {[0, 1, 2].map((col) => {
                const idx = row * 3 + col;
                const card = cards[idx];
                if (!card) return null;

                const isFlipped = flipped.includes(idx) || matched.includes(idx);

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.card, isFlipped && styles.cardFlipped]}
                    onPress={() => handleCardPress(idx)}
                  >
                    {isFlipped && (
                      <Text style={styles.cardText}>{card.emoji}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Resultado */}
        {won && (
          <View className="mt-8 bg-primary/10 rounded-2xl p-6 border-2 border-tertiary w-full items-center">
            <Text className="text-secondary font-bold text-lg uppercase text-center">
              {feedback}
            </Text>
            <Text className="text-secondary/70 text-xs mt-2 text-center">
              {attempts === EMOJIS.length
                ? "Victoria sin errores"
                : "Intenta hacerlo en menos intentos"}
            </Text>
          </View>
        )}

        {/* Botón */}
        <TouchableOpacity
          onPress={handleReinicio}
          className="mt-8 bg-tertiary rounded-full px-8 py-4 shadow-lg border-b-4 border-orange w-full"
        >
          <Text className="text-primary font-bold uppercase text-center">
            {won ? "Jugar de Nuevo" : "Reiniciar"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
