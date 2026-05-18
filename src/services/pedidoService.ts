// src/services/pedidoService.ts
// Centraliza toda la lógica de acceso a datos de la tabla `pedidos`.
// Consumidores: ListaPedidosPendientes.tsx

import { supabase } from './SupabaseClient';

export type SectorPedido = 'cocina' | 'bar';

export const PedidoService = {

  /**
   * Obtiene los pedidos con estado 'Pendiente' filtrados por sector.
   * - bar: solo categoría 'bebida'
   * - cocina: todo excepto 'bebida' (platos, postres)
   * Devuelve los items ordenados por fecha de creación ascendente (FIFO).
   */
  async obtenerPendientesPorSector(sector: SectorPedido) {
    let query = supabase
      .from('pedidos')
      .select('*')
      .eq('estado', 'Pendiente');

    if (sector === 'bar') {
      query = query.eq('categoria', 'bebida');
    } else {
      query = query.neq('categoria', 'bebida');
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  /**
   * Actualiza el estado de un conjunto de pedidos (por sus IDs) a un nuevo estado.
   * - cocina usa: 'Listo Cocina'
   * - bar usa: 'Listo Bar'
   */
  async actualizarEstado(ids: string[], nuevoEstado: string) {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .in('id', ids);

    if (error) throw error;
  },
};
