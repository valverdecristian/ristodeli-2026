import * as ImagePicker from "expo-image-picker";
import { supabase } from "./SupabaseClient";

export interface UploadResult {
  success: boolean;
  message: string;
  url?: string;
}

export const ImageService = {
  /**
   * Abre la camara del dispositivo de manera obligatoria y captura la foto.
   * No permite elegir archivos desde la galería.
   */
  takePhoto: async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      throw new Error("Se requieren permisos de la cámara para capturar la fotografía.");
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      return result.assets[0];
    }

    return null;
  },

  /**
   * Abre la galería del dispositivo y permite seleccionar una imagen.
   */
  chooseFromGallery: async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      throw new Error("Se requieren permisos de galería para seleccionar la fotografía.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      return result.assets[0];
    }

    return null;
  },

  /**
   * Sube la foto capturada al Storage de Supabase y devuelve la URL pública.
   */
  uploadToSupabase: async (
    uri: string,
    bucketName: string,
    folderPath: string,
    fileName: string,
  ): Promise<UploadResult> => {
    try {

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();


      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(`${folderPath}/${fileName}.jpeg`, arrayBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) throw error;


      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`${folderPath}/${fileName}.jpeg`);

      return {
        success: true,
        message: "Imagen capturada y subida correctamente",
        url: publicUrlData.publicUrl,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al subir la foto al servidor";
      return {
        success: false,
        message: errorMessage,
      };
    }
  },
};