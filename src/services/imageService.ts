// src/services/imageService.ts
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./SupabaseClient";

export interface UploadResult {
  success: boolean;
  message: string;
  url?: string;
}

export const ImageService = {
  /**
   * 1. Abre la galería y devuelve las URIs de las fotos seleccionadas
   */
  pickImage: async (allowsMultipleSelection = false) => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Necesitamos permiso para acceder a la galería.");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: !allowsMultipleSelection, // Solo permite recortar si es 1 sola foto
      allowsMultipleSelection: allowsMultipleSelection,
      quality: 0.7, // Comprime la imagen para que suba más rápido
    });

    if (!result.canceled) {
      return result.assets; // Retorna el array con los datos de la/s imagen/es
    }

    return null;
  },

  /**
   * 2. Sube la foto al Storage de Supabase y devuelve un objeto con el resultado
   */
  uploadToSupabase: async (
    uri: string,
    bucketName: string,
    folderPath: string,
    fileName: string,
  ): Promise<UploadResult> => {
    try {
      // Magia moderna: transformamos la URI local en un ArrayBuffer nativo
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      // Subimos el archivo a Supabase
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(`${folderPath}/${fileName}.jpeg`, arrayBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) throw error;

      // Obtenemos la URL para poder mostrarla en la app
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`${folderPath}/${fileName}.jpeg`);

      return {
        success: true,
        message: "Imagen subida correctamente",
        url: publicUrlData.publicUrl,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al subir la imagen";
      return {
        success: false,
        message: errorMessage,
      };
    }
  },
};
