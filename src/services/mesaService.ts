import { supabase } from './SupabaseClient';

export const MesaService = {

  /**
   * Obtiene todas las mesas del salón con todos sus campos.
   * Usada por EstadoMesas (metre) para el monitoreo de ocupación.
   */
  async obtenerTodas() {
    const { data, error } = await supabase
      .from('mesas')
      .select('*');

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtiene únicamente las mesas con estado 'Libre', ordenadas por número.
   * Usada por AsignarMesa para mostrar opciones disponibles al metre.
   */
  async obtenerLibres() {
    const { data, error } = await supabase
      .from('mesas')
      .select('id, numero, comensales, tipo')
      .eq('estado', 'Libre')
      .order('numero', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Actualiza el estado de una mesa específica (ej: 'Libre' → 'Ocupada').
   * Usada por AsignarMesa al confirmar la asignación de un cliente.
   */
  async actualizarEstado(mesaId: string, nuevoEstado: string) {
    const { error } = await supabase
      .from('mesas')
      .update({ estado: nuevoEstado })
      .eq('id', mesaId);

    if (error) throw error;
  },

  /**
   * Busca una mesa por el contenido del QR escaneado (campo `qr_data`).
   * Devuelve id y número de la mesa, o null si el QR no corresponde a ninguna.
   */
  async obtenerPorQR(qrData: string) {
    const { data, error } = await supabase
      .from('mesas')
      .select('id, numero')
      .eq('qr_data', qrData)
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Obtiene el número visible de una mesa a partir de su UUID.
   * Usada por EscanearMesa para mostrar el número de mesa asignada al cliente.
   */
  async obtenerNumeroPorId(mesaId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from('mesas')
      .select('numero')
      .eq('id', mesaId)
      .single();

    if (error || !data) return null;
    return data.numero;
  },

  /**
   * Obtiene la información del cliente asignado a una mesa desde lista_espera.
   * Usada por EstadoMesas (metre) para mostrar quién ocupa la mesa.
   */
  async obtenerClienteDeMesa(mesaId: string) {
    const { data, error } = await supabase
      .from('lista_espera')
      .select(`
        cliente_id,
        sesion_id,
        usuarios!inner(nombres, apellidos, perfil)
      `)
      .eq('mesa_asignada', mesaId)
      .eq('estado', 'asignado')
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    const user = data.usuarios as any;
    return {
      sesion_id: data.sesion_id,
      cliente_id: data.cliente_id,
      esAnonimo: user.perfil === 'cliente_anonimo',
      nombre: user.perfil === 'cliente_anonimo'
        ? user.nombres
        : `${user.nombres} ${user.apellidos || ''}`.trim(),
      perfil: user.perfil,
    };
  },
};
