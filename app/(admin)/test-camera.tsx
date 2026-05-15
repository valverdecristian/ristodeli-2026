import { useToast } from "@/src/context/ToastContext";
import { ImageService } from "@/src/services/imageService";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function TestCameraScreen() {
  const { showToast } = useToast();
  const [fotoSubida, setFotoSubida] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const probarSubidaDeFoto = async () => {
    setLoading(true);
    showToast("info", "Abriendo galería...", "Seleccioná una foto de prueba.");

    try {
      // 1. Elegir foto
      const imagenes = await ImageService.pickImage(false);

      if (imagenes && imagenes[0].uri) {
        showToast("info", "Subiendo...", "Aguardá un momento.");

        // 2. Subir a Supabase
        const resultado = await ImageService.uploadToSupabase(
          imagenes[0].uri,
          "ristodeli", // Nombre de tu bucket
          "empleados", // Carpeta interna
          `prueba_${Date.now()}`, // Nombre del archivo
        );

        if (resultado.success && resultado.url) {
          setFotoSubida(resultado.url);
          showToast("success", "¡Éxito!", resultado.message);
        } else {
          showToast("error", "Falló", resultado.message);
        }
      }
    } catch (error) {
      showToast("error", "Error", "Ocurrió un error al procesar la imagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-primary p-5">
      <View className="items-center mt-5">
        <Text className="text-secondary text-2xl font-bold mb-8">
          Test: Subida de Imágenes
        </Text>

        <TouchableOpacity
          onPress={probarSubidaDeFoto}
          disabled={loading}
          className="bg-tertiary px-8 py-4 rounded-full mb-8"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-primary font-bold text-lg">
              📸 Seleccionar foto
            </Text>
          )}
        </TouchableOpacity>

        {fotoSubida && (
          <View className="w-full items-center">
            <Text className="text-secondary text-lg font-bold mb-3">
              Foto subida:
            </Text>
            <Image
              source={{ uri: fotoSubida }}
              className="w-48 h-48 rounded-2xl bg-secondary"
            />
            <Text className="text-secondary/70 text-xs mt-3 text-center break-words">
              {fotoSubida}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
