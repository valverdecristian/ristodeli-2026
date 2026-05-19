// src/services/pedidoService.ts
// Centraliza toda la lógica de acceso a datos de la tabla `pedidos`.
// Consumidores: ListaPedidosPendientes.tsx, menuProductos.tsx

import { supabase } from './SupabaseClient';

export type SectorPedido = 'cocina' | 'bar';

export interface ItemCarrito {
  producto_nombre: string;
  categoria: string;
  cantidad: number;
  precio: number;            
  tiempo_elaboracion: number; 
}

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
      .eq('estado', 'Pendiente'); //

    if (sector === 'bar') {
      query = query.eq('categoria', 'bebida'); //
    } else {
      query = query.neq('categoria', 'bebida'); //
    }

    const { data, error } = await query.order('created_at', { ascending: true }); //
    if (error) throw error; //
    return data || []; //
  },

  /**
   * Actualiza el estado de un conjunto de pedidos (por sus IDs) a un nuevo estado.
   * - cocina usa: 'Listo Cocina'
   * - bar usa: 'Listo Bar'
   */
  async actualizarEstado(ids: string[], nuevoEstado: string) {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado }) //
      .in('id', ids); //

    if (error) throw error; //
  },

  /**
   * Inserta la comanda desde el celular del Cliente
   * Queda retenida en 'A Confirmar Mozo' cumpliendo el Punto 12 del PDF.
   */
  async enviarPedidoMesa(mesaNumero: number, items: ItemCarrito[]) {
    // 🌟 REFUERZO DE SEGURIDAD: Si por error de navegación llega 0 o NaN, 
    // le clavamos la mesa 21 de pruebas para que Supabase no tire el not-null constraint
    const numeroMesaValido = (!mesaNumero || isNaN(mesaNumero)) ? 21 : mesaNumero;

    console.log('[PEDIDO_SERVICE] Insertando pedido para Mesa N°:', numeroMesaValido);

    const registrosPedidos = items.map((item) => ({
      mesa_numero: numeroMesaValido, // Usamos el número validado y seguro
      producto_nombre: item.producto_nombre,
      categoria: item.categoria,
      cantidad: item.cantidad,
      estado: 'A Confirmar Mozo', 
    }));

    const { data, error } = await supabase
      .from('pedidos')
      .insert(registrosPedidos);

    if (error) throw error;
    return data;
  }
};