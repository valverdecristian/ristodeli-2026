// src/services/encuestaService.ts
// Centraliza toda la lógica de acceso a datos de la tabla `encuestas`.
// Consumidores: graficoDetalle.tsx

import { supabase } from './SupabaseClient';

export const EncuestaService = {

  /**
   * Obtiene todas las encuestas registradas en la base de datos.
   * Usada por GraficoDetalle para calcular las métricas y renderizar los gráficos
   * de satisfacción, recomendación, limpieza y evolución de servicio.
   */
  async obtenerTodas() {
    const { data, error } = await supabase
      .from('encuestas')
      .select('*');

    if (error) throw error;
    return data || [];
  },

  /**
   * Registra una nueva encuesta de satisfacción en la base de datos.
   */
  async guardar(encuesta: {
    cliente_nombre: string;
    satisfaccion: number;
    recomienda: boolean;
    limpieza: string;
    comentarios: string | null;
    atencion: number;
    comida: number;
    ambiente: number;
  }) {
    const { data, error } = await supabase
      .from('encuestas')
      .insert([encuesta])
      .select();

    if (error) throw error;
    return data;
  },
};

