import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SoundService } from "@/src/services/soundService";
import { useToast } from "@/src/context/ToastContext";
import * as Haptics from "expo-haptics";

const styles = StyleSheet.create({
  board: {
    width: 300,
    height: 300,
    backgroundColor: "#F5C065",
    borderRadius: 16,
    padding: 8,
    alignSelf: "center",
    gap: 8,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  cell: {
    flex: 1,
    backgroundColor: "#E8D9C8",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#31603D",
  },
});

export default function TatetiScreen() {
  const router = useRouter();
  const { sesion_id, mesaId } = useLocalSearchParams<{ sesion_id?: string; mesaId?: string }>();
  const { showToast } = useToast();

  const [board, setBoard] = useState(Array(9).fill(null));
  const [winner, setWinner] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [loading, setLoading] = useState(true);

  // Estados de descuento
  const [juegoHabilitado, setJuegoHabilitado] = useState(true);
  const [descuentoAplicado, setDescuentoAplicado] = useState(0);
  const [esPrimerIntento, setEsPrimerIntento] = useState(true);
  const [feedback, setFeedback] = useState("Gana sin errores para obtener 10% descuento");

  useEffect(() => {
    cargarEstadoSesion();
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
        if (state.juegoSeleccionado && state.juegoSeleccionado !== "tateti") {
          setJuegoHabilitado(false); // No califica para descuento
        }
        if (state.juegosJugados && state.juegosJugados.includes("tateti")) {
          setEsPrimerIntento(false); // Ya jugó a este juego antes en esta sesión
        }
        if (state.descuentoGanado) {
          setDescuentoAplicado(state.descuentoGanado);
        }
      }
    } catch (err) {
      console.error("[TATETI] Error al cargar sesión:", err);
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
        state.juegoSeleccionado = "tateti";
      }
      if (!state.juegosJugados.includes("tateti")) {
        state.juegosJugados.push("tateti");
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
      state.descuentoGanado = 10;
      state.juegoGanador = "tateti";
      await AsyncStorage.setItem(key, JSON.stringify(state));
      setDescuentoAplicado(10);
    } catch (err) {
      console.error(err);
    }
  };

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return squares[a];
      }
    }
    return null;
  };

  const handleCellPress = async (index: number) => {
    if (board[index] || winner || moves === 9) return;

    // Registrar primer movimiento en esta sesión
    if (moves === 0) {
      await registrarIntentoJuego();
    }

    const newBoard = [...board];
    newBoard[index] = "X";
    let currentMoves = moves + 1;
    let gameWinner = calculateWinner(newBoard);

    if (!gameWinner && currentMoves < 9) {
      const emptyCells = newBoard
        .map((cell, idx) => (cell === null ? idx : null))
        .filter((cell) => cell !== null) as number[];

      if (emptyCells.length > 0) {
        const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        newBoard[randomIndex] = "O";
        currentMoves += 1;
        gameWinner = calculateWinner(newBoard);
      }
    }

    setBoard(newBoard);
    setMoves(currentMoves);

    if (gameWinner) {
      setWinner(gameWinner);
      if (gameWinner === "X") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await SoundService.reproducir("exito");

        if (juegoHabilitado && esPrimerIntento && descuentoAplicado === 0) {
          await aplicarDescuento();
          setFeedback("🎉 ¡Ganaste! +10% DESCUENTO APLICADO");
          showToast("success", "¡Descuento Obtenido!", "Se aplicó un 10% de descuento a tu mesa.");
        } else {
          setFeedback("¡Ganaste! (Sin descuento: ya jugaste otro juego o no es tu primer intento)");
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        await SoundService.reproducir("error");
        setFeedback("La IA ganó esta vez. Intenta de nuevo.");
      }
    } else if (currentMoves === 9) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFeedback("¡Empate! Intenta de nuevo.");
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setMoves(0);
    setEsPrimerIntento(false);
    setFeedback("Nueva partida. Los reinicios anulan el descuento.");
  };

  const isBoardFull = moves === 9 && !winner;
  const gameWinner = calculateWinner(board);

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
          Tateti
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
                🎉 ¡Descuento de 10% obtenido en esta sesión!
              </Text>
            </View>
          ) : !esPrimerIntento ? (
            <View className="bg-orange-500/20 border border-orange-500/50 p-3 rounded-xl">
              <Text className="text-orange-700 font-bold text-center text-xs uppercase">
                ⚠️ Partida reiniciada. Ya no califica para descuento.
              </Text>
            </View>
          ) : (
            <View className="bg-primary/10 border border-tertiary/40 p-3 rounded-xl">
              <Text className="text-secondary font-bold text-center text-xs uppercase">
                🎯 ¡Primer intento activo! Gana para obtener 10% de descuento.
              </Text>
            </View>
          )}
        </View>

        {/* Informacion de partida */}
        {!gameWinner && !isBoardFull && (
          <View className="mb-8 items-center">
            <Text className="text-secondary font-bold text-lg uppercase">
              Tu turno (X)
            </Text>
            <Text className="text-secondary/60 text-xs mt-2">
              {feedback}
            </Text>
          </View>
        )}

        {/* Tablero */}
        <View style={styles.board}>
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.row}>
              {[0, 1, 2].map((col) => {
                const index = row * 3 + col;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.cell}
                    onPress={() => handleCellPress(index)}
                  >
                    <Text style={styles.cellText}>{board[index]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Resultado */}
        {gameWinner && (
          <View className="mt-8 bg-primary/10 rounded-2xl p-6 border-2 border-tertiary w-full items-center">
            <Text className="text-secondary font-bold text-lg uppercase">
              {gameWinner === "X" ? "¡Ganaste!" : "IA Ganó"}
            </Text>
            <Text className="text-secondary/70 text-xs mt-2 text-center">
              {feedback}
            </Text>
          </View>
        )}

        {isBoardFull && (
          <View className="mt-8 bg-primary/10 rounded-2xl p-6 border-2 border-tertiary w-full items-center">
            <Text className="text-secondary font-bold text-lg uppercase">
              Empate
            </Text>
            <Text className="text-secondary/70 text-xs mt-2">
              Sin ganador, sin descuento
            </Text>
          </View>
        )}

        {/* Boton reiniciar */}
        <TouchableOpacity
          onPress={resetGame}
          className="mt-8 bg-tertiary rounded-full px-8 py-4 shadow-lg border-b-4 border-orange w-full"
        >
          <Text className="text-primary font-bold uppercase text-center">
            {gameWinner || isBoardFull ? "Jugar de nuevo" : "Reiniciar"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
