import { supabase } from './supabase';
import { Platform } from 'react-native';

export const StorageService = {
  /**
   * Sube una imagen a un bucket de Supabase
   * @param uri URI local de la foto
   * @param bucket Nombre del bucket (ej: 'usuarios' o 'productos')
   * @returns URL pública de la imagen
   */
  subirImagen: async (uri: string, bucket: string): Promise<string | null> => {
    try {
      // 1. Preparar el nombre del archivo (único)
      const extension = uri.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
      const filePath = `usuarios/${fileName}`;

      // 2. Convertir URI a Blob (Forma recomendada en React Native)
      const response = await fetch(uri);
      const blob = await response.blob();

      // 3. Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // 4. Obtener la URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error en StorageService:', error);
      return null;
    }
  },

  /**
   * Sube múltiples imágenes (para el caso de las 3 fotos)
   */
  subirMultiplesFotos: async (uris: string[], bucket: string): Promise<string[]> => {
    // Ejecuta las subidas en paralelo para ganar velocidad
    const promesas = uris.map(uri => StorageService.subirImagen(uri, bucket));
    const resultados = await Promise.all(promesas);
    
    // Filtramos solo los links que se subieron con éxito
    return resultados.filter((url): url is string => url !== null);
  }
};