import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (flipped.length === 2) {
      const [first, second] = flipped;
      if (cards[first].emoji === cards[second].emoji) {
        setMatched([...matched, first, second]);
        setFlipped([]);
        setAttempts(attempts + 1);
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, 800);
        setAttempts(attempts + 1);
      }
    }
  }, [flipped]);

  useEffect(() => {
    if (matched.length === CARDS.length && matched.length > 0) {
      setWon(true);
    }
  }, [matched]);

  const initializeGame = () => {
    const newCards = CARDS.map((emoji, id) => ({
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

  const handleCardPress = (id: number) => {
    if (
      flipped.includes(id) ||
      matched.includes(id) ||
      flipped.length === 2 ||
      won
    ) {
      return;
    }
    setFlipped([...flipped, id]);
  };

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

                const isFlipped =
                  flipped.includes(idx) || matched.includes(idx);

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
            <Text className="text-secondary font-bold text-lg uppercase">
              {attempts === EMOJIS.length
                ? "🎉 ¡Perfecto! +12% DESCUENTO"
                : `Ganaste en ${attempts} intentos`}
            </Text>
            <Text className="text-secondary/70 text-xs mt-2">
              {attempts === EMOJIS.length
                ? "Victoria sin errores"
                : "Intenta hacerlo en menos intentos"}
            </Text>
          </View>
        )}

        {/* Botón */}
        <TouchableOpacity
          onPress={initializeGame}
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
