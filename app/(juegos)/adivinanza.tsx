import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Keyboard,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdivinanzaScreen() {
  const router = useRouter();
  const [secretNumber, setSecretNumber] = useState(0);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("Adivina un número entre 1 y 100");
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const random = Math.floor(Math.random() * 100) + 1;
    setSecretNumber(random);
    setGuess("");
    setFeedback("¡Nuevo juego! Adivina un número entre 1 y 100");
    setAttempts(0);
    setWon(false);
    setGameStarted(true);
  };

  const handleGuess = () => {
    if (!guess.trim()) {
      setFeedback("Por favor ingresa un número");
      return;
    }

    Keyboard.dismiss();
    const number = parseInt(guess, 10);

    if (isNaN(number) || number < 1 || number > 100) {
      setFeedback("Ingresa un número válido entre 1 y 100");
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (number === secretNumber) {
      setWon(true);
      if (newAttempts === 1) {
        setFeedback("🎉 ¡Ganaste al primer intento! +15% DESCUENTO");
      } else {
        setFeedback(`¡Ganaste en ${newAttempts} intentos! (Sin descuento)`);
      }
    } else if (number < secretNumber) {
      setFeedback(`Es mayor. Intentos: ${newAttempts}`);
    } else {
      setFeedback(`Es menor. Intentos: ${newAttempts}`);
    }

    setGuess("");
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      {/* Header */}
      <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center shadow-2xl">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={30} color="#31603D" />
        </TouchableOpacity>
        <Text className="text-primary font-bold text-2xl uppercase tracking-tighter">
          Adivinanza
        </Text>
      </View>

      {/* Contenido */}
      <View className="flex-1 justify-center items-center px-8">
        {/* Icono grande */}
        <View className="bg-secondary rounded-full p-8 mb-8 shadow-lg">
          <Ionicons name="help-circle" size={80} color="#31603D" />
        </View>

        {/* Número de intentos */}
        <Text className="text-secondary font-bold text-lg uppercase mb-4">
          {attempts === 0 ? "Empecemos" : `Intentos: ${attempts}`}
        </Text>

        {/* Feedback */}
        <View className="bg-primary/10 border-2 border-tertiary rounded-2xl p-6 w-full mb-8 items-center">
          <Text
            className={`text-center font-bold text-base ${
              won ? "text-green-600" : "text-secondary"
            }`}
          >
            {feedback}
          </Text>
        </View>

        {!won ? (
          <>
            {/* Input */}
            <TextInput
              value={guess}
              onChangeText={setGuess}
              placeholder="Ingresa tu número"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              editable={gameStarted && !won}
              onSubmitEditing={handleGuess}
              className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg font-bold text-primary shadow-md mb-6"
            />

            {/* Botón Adivinar */}
            <TouchableOpacity
              onPress={handleGuess}
              disabled={!gameStarted || won}
              className="w-full bg-tertiary rounded-full py-4 shadow-lg border-b-4 border-orange active:opacity-90"
            >
              <Text className="text-primary font-bold uppercase text-center text-lg">
                Adivinar
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Botón jugar de nuevo */
          <TouchableOpacity
            onPress={startNewGame}
            className="w-full bg-tertiary rounded-full py-4 shadow-lg border-b-4 border-orange active:opacity-90"
          >
            <Text className="text-primary font-bold uppercase text-center text-lg">
              Jugar de Nuevo
            </Text>
          </TouchableOpacity>
        )}

        {/* Info */}
        <View className="mt-8 bg-primary/5 rounded-2xl p-4 w-full border border-tertiary/30">
          <Text className="text-secondary font-bold text-xs uppercase mb-2">
            📌 Recuerda
          </Text>
          <Text className="text-secondary/70 text-xs leading-relaxed">
            Solo obtienen descuento si ganas al primer intento, sin errores.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
