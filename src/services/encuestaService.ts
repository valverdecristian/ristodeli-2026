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
};
