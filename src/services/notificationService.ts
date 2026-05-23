//   - AuthContext.tsx   → usuarios registrados (todos los roles)
//   - registroAnonimo.tsx → clientes anónimos

import * as Notifications from 'expo-notifications';
import { supabase } from './SupabaseClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Project ID de EAS 
const EAS_PROJECT_ID = 'e747ca2a-d49f-40cd-8cfa-e0bb41e14b37';

export const NotificationService = {

  /**
   * Solicita permisos de notificación al sistema operativo.
   * En iOS muestra el cartel nativo "Permitir que Ristodeli envíe notificaciones".
   * En Android (API 33+) también requiere permiso explícito.
   * Devuelve true si se concedió el permiso, false en caso contrario.
   */
  async solicitarPermisos(): Promise<boolean> {
    const { status: statusExistente } = await Notifications.getPermissionsAsync();

    if (statusExistente === 'granted') return true;

    const { status: statusNuevo } = await Notifications.requestPermissionsAsync();
    return statusNuevo === 'granted';
  },

  /**
   * Obtiene el Expo Push Token del dispositivo.
   * Si el dispositivo es un emulador/simulador o los permisos fueron denegados,
   * retorna null en lugar de lanzar un error que rompa el flujo de login.
   */
  async obtenerToken(): Promise<string | null> {
    try {
      const { data: tokenData } = await Notifications.getExpoPushTokenAsync({
        projectId: EAS_PROJECT_ID,
      });
      return tokenData ?? null;
    } catch (error) {
      // Falla silenciosa: ocurre en emuladores o si el permiso fue denegado.
      // No interrumpe el flujo de autenticación.
      console.warn('[NotificationService] No se pudo obtener el push token:', error);
      return null;
    }
  },

  /**
   * Persiste el push token en la columna `push_token` de la tabla indicada.
   * Solo actualiza si el token cambió respecto al guardado anteriormente
   * para evitar escrituras innecesarias.
   *
   * @param id - UUID del usuario (tabla `usuarios`) o del anónimo (tabla `anonimos`)
   * @param token - Expo Push Token a guardar
   * @param tabla - Tabla de destino: 'usuarios' | 'anonimos'
   */
  async guardarToken(
    id: string,
    token: string,
    tabla: 'usuarios' | 'anonimos'
  ): Promise<void> {
    const { error } = await supabase
      .from(tabla)
      .update({ push_token: token })
      .eq('id', id);

    if (error) {
      console.error('[NotificationService] Error al guardar el push token:', error.message);
    }
  },

  /**
   * Flujo completo: solicita permisos → obtiene token → guarda en Supabase.
   * Diseñada para llamarse una vez por sesión sin interrumpir el flujo de UI.
   *
   * @param id - UUID del usuario o anónimo
   * @param tabla - Tabla donde persiste el token
   */
  async registrar(
    id: string,
    tabla: 'usuarios' | 'anonimos'
  ): Promise<void> {
    try {
      const permisoConcedido = await NotificationService.solicitarPermisos();
      if (!permisoConcedido) {
        console.warn('[NotificationService] El usuario denegó los permisos de notificación.');
        return;
      }

      const token = await NotificationService.obtenerToken();
      if (!token) return;

      await NotificationService.guardarToken(id, token, tabla);
      console.log(`[NotificationService] Token registrado para ${tabla}:${id}`);
    } catch (error) {
      // Falla silenciosa — un error en las notificaciones nunca debe romper el login
      console.error('[NotificationService] Error en el flujo de registro:', error);
    }
  },

  /**
   * Obtiene los push tokens válidos de todos los usuarios con perfil 'admin' o 'supervisor'.
   * Los tokens null o vacíos son filtrados para no generar errores en el envío.
   */
  async obtenerTokensStaff(): Promise<string[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('push_token')
      .in('perfil', ['admin', 'supervisor'])
      .not('push_token', 'is', null);

    if (error) {
      console.error('[NotificationService] Error obteniendo tokens de staff:', error.message);
      return [];
    }

    return (data ?? [])
      .map((u: { push_token: string | null }) => u.push_token)
      .filter((t): t is string => !!t && t.startsWith('ExponentPushToken'));
  },

  /**
   * Envía notificaciones push a uno o más tokens via la Expo Push API.
   * Agrupa los mensajes en un solo request (batch) para eficiencia.
   *
   * @param tokens  - Array de Expo Push Tokens destino
   * @param titulo  - Título visible en la notificación
   * @param cuerpo  - Cuerpo del mensaje
   * @param datos   - Payload extra (útil para deep linking dentro de la app)
   */
  async enviar(
    tokens: string[],
    titulo: string,
    cuerpo: string,
    datos?: Record<string, unknown>
  ): Promise<void> {
    if (tokens.length === 0) return;

    const mensajes = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: titulo,
      body: cuerpo,
      data: datos ?? {},
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mensajes),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error('[NotificationService] Error en Expo Push API:', errBody);
      }
    } catch (error) {
      console.error('[NotificationService] Error de red al enviar notificaciones:', error);
    }
  },

  /**
   * Helper específico: notifica a admins y supervisores que un nuevo cliente
   * se registró y está pendiente de aprobación.
   * Se llama desde registro.tsx justo después del alta exitosa.
   *
   * @param nombreCliente - Nombre visible en el cuerpo de la notificación
   */
  async notificarNuevoClientePendiente(nombreCliente: string): Promise<void> {
    try {
      const tokens = await NotificationService.obtenerTokensStaff();
      await NotificationService.enviar(
        tokens,
        'Nuevo cliente pendiente',
        `${nombreCliente} se registró y requiere tu aprobación.`,
        { pantalla: 'aprobaciones' }
      );
    } catch (error) {
      // Falla silenciosa — no interrumpe el flujo de registro del cliente
      console.error('[NotificationService] Error notificando nuevo cliente:', error);
    }
  },

  /**
   * Elimina el push token de la DB al cerrar sesión.
   * Evita que lleguen notificaciones a un dispositivo donde el usuario ya salió.
   * Se llama ANTES de supabase.auth.signOut() para que el userId aún esté disponible.
   *
   * @param id    - UUID del usuario o anónimo
   * @param tabla - Tabla donde está el token: 'usuarios' | 'anonimos'
   */
  async limpiarToken(id: string): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ push_token: null })
      .eq('id', id);

    if (error) {
      console.error('[NotificationService] Error al limpiar el push token:', error.message);
    }
  },

  /**
   * Obtiene los push tokens válidos de todos los usuarios con perfil 'metre'.
   */
  async obtenerTokensMetres(): Promise<string[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('push_token')
      .eq('perfil', 'metre')
      .not('push_token', 'is', null);

    if (error) {
      console.error('[NotificationService] Error obteniendo tokens de metres:', error.message);
      return [];
    }

    return (data ?? [])
      .map((u: { push_token: string | null }) => u.push_token)
      .filter((t): t is string => !!t && t.startsWith('ExponentPushToken'));
  },

  /**
   * FLUJO 1: El cliente se anota en la lista -> Avisa al Metre
   */
  async notificarNuevoClienteEnEspera(nombreCliente: string): Promise<void> {
    try {
      const tokens = await NotificationService.obtenerTokensMetres();
      await NotificationService.enviar(
        tokens,
        'Nuevo cliente en lista de espera',
        `${nombreCliente} ingresó a la lista de espera y aguarda una mesa.`,
        { pantalla: 'listaEspera' }
      );
    } catch (error) {
      console.error('[NotificationService] Error notificando al metre:', error);
    }
  },

  /**
   * Helper para buscar el token de un cliente específico.
   */
  async obtenerTokenCliente(clienteId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('push_token')
      .eq('id', clienteId)
      .single();

    if (error || !data) return null;
    return data.push_token;
  },

  /**
   * FLUJO 2: El Metre asigna la mesa -> Avisa al Cliente
   */
  async notificarMesaAsignada(clienteId: string, numeroMesa: string | number): Promise<void> {
    try {
      const token = await NotificationService.obtenerTokenCliente(clienteId);
      if (token && token.startsWith('ExponentPushToken')) {
        // 🌟 Envolvemos el token en un array [token] porque enviar() espera un string[]
        await NotificationService.enviar(
          [token],
          '¡Tu mesa está lista!',
          `El metre te ha asignado la Mesa ${numeroMesa}. Ya podés acercarte y escanear el QR en la mesa.`,
          { pantalla: 'homeCliente' }
        );
      }
    } catch (error) {
      console.error('[NotificationService] Error notificando asignación de mesa al cliente:', error);
    }
  },

  /**
   * FLUJO CHAT 1: El Mozo escribe -> Avisa al Cliente específico
   */
  async notificarMensajeACliente(clienteId: string, mensaje: string): Promise<void> {
    try {
      // Reutilizamos tu helper existente para buscar el token del cliente
      const token = await NotificationService.obtenerTokenCliente(clienteId);

      if (token && token.startsWith('ExponentPushToken')) {
        await NotificationService.enviar(
          [token],
          'Mensaje del Mozo',
          mensaje,
          { pantalla: 'chatCliente' } // ⚠️ Ajustá este string al nombre real de la ruta del chat del cliente
        );
      }
    } catch (error) {
      console.error('[NotificationService] Error notificando mensaje al cliente:', error);
    }
  },

  /**
   * FLUJO CHAT 2: El Cliente escribe -> Avisa a los Mozos
   */
  async notificarMensajeAMozos(numeroMesa: string | number, mensaje: string): Promise<void> {
    try {
      // Buscamos los tokens de todos los usuarios con perfil 'mozo'
      const { data, error } = await supabase
        .from('usuarios')
        .select('push_token')
        .eq('perfil', 'mozo')
        .not('push_token', 'is', null);

      if (error) {
        console.error('[NotificationService] Error obteniendo tokens de mozos:', error.message);
        return;
      }

      const tokens = (data ?? [])
        .map((u: { push_token: string | null }) => u.push_token)
        .filter((t): t is string => !!t && t.startsWith('ExponentPushToken'));

      if (tokens.length > 0) {
        await NotificationService.enviar(
          tokens,
          `🔔 Mensaje de la Mesa ${numeroMesa}`,
          mensaje,
          { pantalla: 'consultasClientes' } // La pantalla donde los mozos ven la lista de chats
        );
      }
    } catch (error) {
      console.error('[NotificationService] Error notificando mensaje a mozos:', error);
    }
  },
};
