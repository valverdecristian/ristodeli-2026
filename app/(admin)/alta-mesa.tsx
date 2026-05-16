import { ImageService } from "@/src/services/imageService";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flex: 1,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#F5C065",
  },
  tabText: {
    fontWeight: "bold",
    fontSize: 11,
    textTransform: "uppercase",
  },
  tabTextActive: {
    color: "#31603D",
  },
  tabTextInactive: {
    color: "rgba(49, 96, 61, 0.4)",
  },
});

export default function AltaMesa() {
  const router = useRouter();

  const [numeroMesa, setNumeroMesa] = useState("");
  const [cantidadComensales, setCantidadComensales] = useState("");
  const [tipoMesa, setTipoMesa] = useState("estándar");
  const [fotoMesa, setFotoMesa] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCapturarFoto = useCallback(async () => {
    setIsLoading(true);
    try {
      const photo = await ImageService.takePhoto();

      if (photo) {
        setFotoMesa(photo.uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Ocurrió un error al capturar la foto");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGenerarMesa = useCallback(() => {
    if (!numeroMesa) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Campo incompleto", "Por favor ingresa el número de mesa");
      return;
    }

    if (!cantidadComensales) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Campo incompleto",
        "Por favor ingresa la cantidad de comensales",
      );
      return;
    }

    if (!fotoMesa) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Foto requerida", "Por favor captura una foto de la mesa");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Guardar datos en Supabase
    router.replace("/(admin)/listado-mesas");
  }, [numeroMesa, cantidadComensales, fotoMesa, router]);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center shadow-2xl">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={30} color="#31603D" />
          </TouchableOpacity>
          <Text className="text-primary font-bold text-2xl uppercase tracking-tighter">
            Alta De Mesa
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-10 pt-8"
        >
          <View className="mb-8">
            <TextInput
              value={numeroMesa}
              onChangeText={setNumeroMesa}
              placeholder="NÚMERO DE MESA"
              placeholderTextColor="#6E433D"
              keyboardType="numeric"
              className="bg-secondary rounded-full px-8 py-5 text-primary text-center text-xl font-bold shadow-lg"
            />
          </View>

          <View className="mb-8">
            <TextInput
              value={cantidadComensales}
              onChangeText={setCantidadComensales}
              placeholder="CANTIDAD DE COMENSALES"
              placeholderTextColor="#6E433D"
              keyboardType="numeric"
              className="bg-secondary rounded-full px-8 py-5 text-primary text-center text-xl font-bold shadow-lg"
            />
          </View>

          <View className="mb-10">
            <View className="bg-secondary rounded-3xl p-2 flex-row justify-around items-center shadow-md">
              {["Estándar", "VIP", "Discapacidad"].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  onPress={() => {
                    setTipoMesa(tipo);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.tabButton,
                    tipoMesa === tipo && styles.tabButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      tipoMesa === tipo
                        ? styles.tabTextActive
                        : styles.tabTextInactive,
                    ]}
                  >
                    {tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sección de foto */}
          <View className="mb-10">
            <Text className="text-primary font-bold text-sm uppercase mb-4">
              Foto de la Mesa
            </Text>

            {fotoMesa ? (
              <View className="relative">
                <Image
                  source={{ uri: fotoMesa }}
                  className="w-full h-48 rounded-3xl bg-secondary"
                />
                <TouchableOpacity
                  onPress={() => setFotoMesa(null)}
                  className="absolute top-3 right-3 bg-red-500 rounded-full p-2"
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleCapturarFoto}
                disabled={isLoading}
                className="bg-secondary rounded-3xl py-8 items-center justify-center border-2 border-dashed border-primary/30"
              >
                <Ionicons
                  name={isLoading ? "hourglass" : "camera"}
                  size={40}
                  color={isLoading ? "#6E433D/50" : "#6E433D"}
                />
                <Text className="text-primary font-bold text-sm uppercase mt-3">
                  {isLoading ? "Capturando..." : "Capturar Foto"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleGenerarMesa}
            style={{ elevation: 15 }}
            className="bg-tertiary rounded-full py-6 shadow-2xl border-b-[6px] border-orange active:mt-1 active:border-b-0"
          >
            <View className="flex-row justify-center items-center">
              <Ionicons name="qr-code" size={28} color="#31603D" />
              <Text className="text-primary font-black text-xl uppercase ml-3">
                Generar Mesa Y QR
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
