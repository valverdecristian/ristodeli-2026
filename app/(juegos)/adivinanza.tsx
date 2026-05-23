import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Keyboard, Text, TextInput, TouchableOpacity, View, ActivityIndicator, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SoundService } from "@/src/services/soundService";
import { useToast } from "@/src/context/ToastContext";
import * as Haptics from "expo-haptics";

export default function AdivinanzaScreen() {
  const router = useRouter();
  const { sesion_id, mesaId } = useLocalSearchParams<{ sesion_id?: string; mesaId?: string }>();
  const { showToast } = useToast();

  const [secretNumber, setSecretNumber] = useState(0);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("Adivina un número entre 1 y 100");
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados de descuento
  const [juegoHabilitado, setJuegoHabilitado] = useState(true);
  const [descuentoAplicado, setDescuentoAplicado] = useState(0);
  const [esPrimerIntento, setEsPrimerIntento] = useState(true);

  useEffect(() => {
    cargarEstadoSesion();
    startNewGame();
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
        if (state.juegoSeleccionado && state.juegoSeleccionado !== "adivinanza") {
          setJuegoHabilitado(false); // No califica para descuento
        }
        if (state.juegosJugados && state.juegosJugados.includes("adivinanza")) {
          setEsPrimerIntento(false); // Ya jugó a este juego en esta sesión
        }
        if (state.descuentoGanado) {
          setDescuentoAplicado(state.descuentoGanado);
        }
      }
    } catch (err) {
      console.error("[ADIVINANZA] Error al cargar sesión:", err);
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
        state.juegoSeleccionado = "adivinanza";
      }
      if (!state.juegosJugados.includes("adivinanza")) {
        state.juegosJugados.push("adivinanza");
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
      state.descuentoGanado = 15;
      state.juegoGanador = "adivinanza";
      await AsyncStorage.setItem(key, JSON.stringify(state));
      setDescuentoAplicado(15);
    } catch (err) {
      console.error(err);
    }
  };

  const startNewGame = () => {
    const random = Math.floor(Math.random() * 100) + 1;
    setSecretNumber(random);
    setGuess("");
    setFeedback("¡Nuevo juego! Adivina un número entre 1 y 100");
    setAttempts(0);
    setWon(false);
    setGameStarted(true);
  };

  const handleGuess = async () => {
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

    // Registra inicio del juego en el primer intento
    if (newAttempts === 1) {
      await registrarIntentoJuego();
    }

    if (number === secretNumber) {
      setWon(true);
      if (juegoHabilitado && esPrimerIntento && newAttempts === 1) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await SoundService.reproducir("exito");
        await aplicarDescuento();
        setFeedback("🎉 ¡Ganaste al primer intento! +15% DESCUENTO");
        showToast("success", "¡Descuento Obtenido!", "Se aplicó un 15% de descuento a tu mesa.");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await SoundService.reproducir("exito");
        setFeedback(`¡Ganaste en ${newAttempts} intentos! (Sin descuento)`);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (number < secretNumber) {
        setFeedback(`Es mayor. Intentos: ${newAttempts}`);
      } else {
        setFeedback(`Es menor. Intentos: ${newAttempts}`);
      }
    }

    setGuess("");
  };

  const handleReinicio = () => {
    setEsPrimerIntento(false);
    startNewGame();
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
          Adivinanza
        </Text>
      </View>

      {/* Contenido */}
      <View className="flex-1 justify-center items-center px-8">

        {/* Banner de estado de descuento */}
        <View className="mb-6 w-full">
          {!juegoHabilitado ? (
            <View className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl">
              <Text className="text-red-700 font-bold text-center text-xs uppercase">
                ⚠️ Solo juegas por diversión. No califica para descuento.
              </Text>
            </View>
          ) : descuentoAplicado > 0 ? (
            <View className="bg-green-600/20 border border-green-600/50 p-3 rounded-xl">
              <Text className="text-green-700 font-extrabold text-center text-xs uppercase">
                🎉 ¡Descuento de 15% obtenido en esta sesión!
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
                🎯 ¡Primer intento activo! Adivina en 1 intento para el 15%.
              </Text>
            </View>
          )}
        </View>

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
            className={`text-center font-bold text-base ${won ? "text-green-600" : "text-secondary"
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
            onPress={handleReinicio}
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
            Solo obtienes descuento si ganas al primer intento, sin errores.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
