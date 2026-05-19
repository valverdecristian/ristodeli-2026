import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);

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

  const handleCellPress = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);
    setIsXNext(!isXNext);
    setMoves(moves + 1);

    const gameWinner = calculateWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setMoves(0);
  };

  const isBoardFull = moves === 9 && !winner;
  const gameWinner = calculateWinner(board);

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
        {/* Información */}
        {!gameWinner && !isBoardFull && (
          <View className="mb-8 items-center">
            <Text className="text-secondary font-bold text-lg uppercase">
              {isXNext ? "Tu turno (X)" : "Turno IA (O)"}
            </Text>
            <Text className="text-secondary/60 text-xs mt-2">
              {moves === 0
                ? "Gana sin errores para obtener 10% descuento"
                : "Jugadas: " + moves}
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
            <Text className="text-secondary/70 text-xs mt-2">
              {gameWinner === "X"
                ? "🎉 +10% DESCUENTO APLICADO"
                : "Intenta de nuevo"}
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

        {/* Botón reiniciar */}
        <TouchableOpacity
          onPress={resetGame}
          className="mt-8 bg-tertiary rounded-full px-8 py-4 shadow-lg border-b-4 border-orange"
        >
          <Text className="text-primary font-bold uppercase text-center">
            {gameWinner || isBoardFull ? "Jugar de nuevo" : "Reiniciar"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
