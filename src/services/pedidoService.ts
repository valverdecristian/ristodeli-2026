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
      .in('estado', ['Pendiente', 'En Preparación']);

    if (sector === 'bar') {
      query = query.eq('categoria', 'bebida');
    } else {
      query = query.neq('categoria', 'bebida');
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error; //
    return data || []; //
  },

  /**
   * Actualiza el estado de un conjunto de pedidos.
   * Si es rechazado, se le puede pasar un motivo que se guardará concatenado.
   */
  async actualizarEstado(ids: string[], nuevoEstado: string, motivo?: string) {
    let estadoFinal = nuevoEstado;
    if (motivo && motivo.trim() !== '') {
      estadoFinal = `${nuevoEstado}: ${motivo.trim()}`;
    }

    const { error } = await supabase
      .from('pedidos')
      .update({ estado: estadoFinal })
      .in('id', ids);

    if (error) throw error;
  },

  /**
   * Inserta la comanda desde el celular del Cliente
   * Queda retenida en 'A Confirmar Mozo' cumpliendo el Punto 12 del PDF.
   */
  async confirmarRecepcionCliente(mesaNumero: number) {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'Recibido' })
      .eq('mesa_numero', mesaNumero)
      .in('estado', ['Entregado']);

    if (error) throw error;
  },

  async enviarPedidoMesa(mesaNumero: number, items: ItemCarrito[]) {
    const numeroMesaValido = (!mesaNumero || isNaN(mesaNumero)) ? 21 : mesaNumero;

    console.log('[PEDIDO_SERVICE] Insertando pedido para Mesa N°:', numeroMesaValido);

    const registrosPedidos = items.map((item) => ({
      mesa_numero: numeroMesaValido,
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