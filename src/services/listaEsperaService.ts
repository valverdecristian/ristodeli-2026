// src/services/listaEsperaService.ts
// Centraliza toda la lógica de acceso a datos de la tabla `lista_espera`.
// Consumidores: home.tsx, homeAnonimo.tsx, asignarMesa.tsx, escanearMesa.tsx

import { supabase } from './SupabaseClient';

export const ListaEsperaService = {

  /**
   * Agrega un cliente registrado a la lista de espera con estado 'pendiente'.
   * Usada por home.tsx al escanear el QR de entrada.
   */
  async agregarClienteRegistrado(params: {
    nombre: string;
    foto: string;
    clienteId: string;
  }) {
    const { error } = await supabase
      .from('lista_espera')
      .insert([{
        nombre: params.nombre,
        foto: params.foto,
        estado: 'pendiente',
        tipo: 'registrado',
        cliente_id: params.clienteId,
        mesa_asignada: null,
        qr_mesa_escaneado: false,
      }]);

    if (error) throw error;
  },

  /**
   * Agrega un cliente anónimo a la lista de espera con estado 'pendiente'.
   * Usada por homeAnonimo.tsx al escanear el QR de entrada.
   */
  async agregarClienteAnonimo(params: {
    nombre: string;
    foto: string;
    clienteId: string;
  }) {
    const { error } = await supabase
      .from('lista_espera')
      .insert([{
        nombre: params.nombre,
        foto: params.foto,
        estado: 'pendiente',
        tipo: 'anonimo',
        cliente_id: params.clienteId,
        mesa_asignada: null,
        qr_mesa_escaneado: false,
      }]);

    if (error) throw error;
  },

  /**
   * Obtiene los registros con estado 'pendiente' de la lista de espera.
   * Para clientes registrados, también busca sus datos de la tabla `usuarios`.
   * Usada por asignarMesa.tsx (metre).
   */
  async obtenerPendientes() {
    const { data: esperaData, error: errEspera } = await supabase
      .from('lista_espera')
      .select('id, cliente_id, nombre, tipo, estado')
      .eq('estado', 'pendiente');

    if (errEspera) throw errEspera;
    if (!esperaData || esperaData.length === 0) return [];

    // Para clientes registrados, enriquecemos con apellidos reales
    const idsRegistrados = esperaData
      .filter(e => e.tipo === 'registrado')
      .map(e => e.cliente_id);

    let usuariosData: any[] = [];
    if (idsRegistrados.length > 0) {
      const { data: users } = await supabase
        .from('usuarios')
        .select('id, nombres, apellidos')
        .in('id', idsRegistrados);
      usuariosData = users || [];
    }

    return esperaData.map(item => {
      if (item.tipo === 'registrado') {
        const u = usuariosData.find(user => user.id === item.cliente_id);
        return {
          ...item,
          nombreCompleto: u ? `${u.nombres} ${u.apellidos}` : item.nombre,
        };
      }
      return {
        ...item,
        nombreCompleto: `${item.nombre} (Anónimo)`,
      };
    });
  },

  /**
   * Obtiene la asignación de mesa activa de un cliente (estado 'asignado').
   * Usada por escanearMesa.tsx para saber qué mesa debe escanear el cliente.
   * Devuelve { mesaAsignadaId } o null si no tiene ninguna.
   */
  async obtenerAsignacionActiva(clienteId: string) {
    const { data, error } = await supabase
      .from('lista_espera')
      .select('mesa_asignada, estado')
      .eq('cliente_id', clienteId)
      .eq('estado', 'asignado')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data.mesa_asignada as string | null;
  },

  /**
   * Actualiza el registro del cliente en lista_espera a estado 'asignado'
   * y vincula el UUID de la mesa que le fue otorgada.
   * Usada por asignarMesa.tsx al confirmar la asignación.
   */
  async asignarMesa(listaEsperaId: string, mesaId: string) {
    const { error } = await supabase
      .from('lista_espera')
      .update({
        estado: 'asignado',
        mesa_asignada: mesaId,
      })
      .eq('id', listaEsperaId);

    if (error) throw error;
  },

  /**
   * Marca el QR de mesa como escaneado una vez que el cliente confirmó su ingreso.
   * Usada por escanearMesa.tsx tras validar el QR correctamente.
   */
  async confirmarEscaneoMesa(clienteId: string) {
    const { error } = await supabase
      .from('lista_espera')
      .update({ qr_mesa_escaneado: true })
      .eq('cliente_id', clienteId)
      .eq('estado', 'asignado');

    if (error) throw error;
  },
};
