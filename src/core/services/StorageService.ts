import { supabase } from './supabase';
import { Platform } from 'react-native';

const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const StorageService = {
  /**
   * Sube una imagen a un bucket de Supabase
   * @param uri URI local de la foto
   * @param bucket Nombre del bucket (ej: 'usuarios' o 'productos')
   * @returns URL pública de la imagen
   */
  subirImagen: async (fileData: string, bucket: string, isBase64: boolean = false): Promise<string | null> => {
    try {
      // 1. Preparar el nombre del archivo (único)
      const extension = isBase64 ? 'jpg' : fileData.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
      const filePath = `usuarios/${fileName}`;

      let uploadBody: any;
      
      if (isBase64) {
        // 2.A Convertir base64 a Uint8Array (Solución nativa 100% confiable)
        uploadBody = decodeBase64(fileData);
      } else {
        // 2.B Preparar el archivo con FormData para URIs locales
        const cleanUri = fileData.startsWith('file://') ? fileData : `file://${fileData}`;
        const formData = new FormData();
        formData.append('file', {
          uri: cleanUri,
          name: fileName,
          type: 'image/jpeg',
        } as any);
        uploadBody = formData;
      }

      // 3. Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, uploadBody, isBase64 ? { contentType: 'image/jpeg' } : undefined);

      if (error) {
        // 👈 Imprimimos el error real de Supabase para debuggear
        console.error('Error de Supabase Storage:', error.message);
        return null;
      }

      // 4. Obtener la URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error: any) {
      // Ahora el error te dirá más en la consola de VS Code
      console.error('Error detallado de Storage:', error.message);
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