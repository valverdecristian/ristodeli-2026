// src/services/authService.ts
// Migración de auth.service.ts (Angular/Ionic) → servicio puro de funciones para Expo React Native.
// Usa el cliente de Supabase ya configurado. El estado reactivo vive en AuthContext.tsx.

import { createClient } from '@supabase/supabase-js';
import { supabase } from './SupabaseClient';
import { DetalleRegistro, UsuarioPerfil } from '../models/usuario.model';

// Credenciales para crear el cliente temporal de registro de empleados
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const AuthService = {

  /**
   * Inicia sesión con email y contraseña.
   * Lanza un error si las credenciales son incorrectas.
   */
  async ingresar(email: string, clave: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: clave,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Registra un nuevo usuario en auth.users y luego inserta su perfil en public.usuarios.
   * Lanza un error en cualquier punto del proceso.
   */
  async registrar(password: string, detalles: DetalleRegistro) {
    // 1. Crear el usuario en auth.users de Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: detalles.email.trim(),
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se devolvió un usuario tras el registro.');

    // 2. Insertar los detalles del perfil en public.usuarios
    const nuevoPerfil = {
      id: authData.user.id,
      email: detalles.email.trim().toLowerCase(),
      nombres: detalles.nombres.trim(),
      apellidos: detalles.apellidos.trim(),
      dni: detalles.dni.trim(),
      cuil: detalles.cuil.trim(),
      perfil: detalles.perfil,
      foto_url: detalles.foto_url || null,
      push_token: null,
    };

    const { data: profileData, error: profileError } = await supabase
      .from('usuarios')
      .insert([nuevoPerfil]);

    if (profileError) throw profileError;

    return { authData, profileData };
  },

  /**
   * Registra un empleado nuevo desde el panel del Admin/Supervisor.
   * 
   * DIFERENCIA CLAVE con registrar():
   * Usa un cliente Supabase TEMPORAL sin persistencia de sesión para el signUp.
   * Esto evita que la sesión del admin sea reemplazada por la del empleado recién creado.
   * El insert en `usuarios` sigue usando el cliente principal (sesión del admin) que tiene permisos.
   */
  async registrarEmpleado(password: string, detalles: DetalleRegistro) {
    // 1. Cliente temporal sin storage — no toca la sesión del admin
    const supabaseTemp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // 2. Crear el usuario en auth.users con el cliente temporal
    const { data: authData, error: authError } = await supabaseTemp.auth.signUp({
      email: detalles.email.trim(),
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se devolvió un usuario tras el registro del empleado.');

    // 3. Insertar el perfil en public.usuarios con el cliente PRINCIPAL (sesión admin activa)
    const nuevoPerfil = {
      id: authData.user.id,
      email: detalles.email.trim().toLowerCase(),
      nombres: detalles.nombres.trim(),
      apellidos: detalles.apellidos.trim(),
      dni: detalles.dni.trim(),
      cuil: detalles.cuil.trim(),
      perfil: detalles.perfil, // Rol definido por el admin al momento de crear
      foto_url: detalles.foto_url || null,
      push_token: null,
    };

    const { error: profileError } = await supabase
      .from('usuarios')
      .insert([nuevoPerfil]);

    if (profileError) throw profileError;

    return { authData };
  },

  /**
   * Registra un usuario anónimo usando signInAnonymously() de Supabase.
   * Crea el auth user, luego inserta el perfil en public.usuarios.
   * Solo requiere nombre y foto_url (ya subida a Storage).
   */
  async registrarAnonimo(nombre: string, fotoUrl: string) {
    console.log('[AUTH_SVC] signInAnonymously...');
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.log('[AUTH_SVC] Error en signInAnonymously:', error);
      throw error;
    }
    console.log('[AUTH_SVC] signInAnonymously OK, user id:', data.user?.id);

    if (!data.user) throw new Error('No se devolvió un usuario anónimo.');

    console.log('[AUTH_SVC] Verificando si el usuario ya existe en usuarios...');
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle();
    console.log('[AUTH_SVC] Usuario existente:', existente);

    if (existente) {
      console.log('[AUTH_SVC] El usuario ya existe, solo retornamos.');
      return data;
    }

    const nuevoPerfil = {
      id: data.user.id,
      nombres: nombre.trim(),
      foto_url: fotoUrl,
      perfil: 'cliente_anonimo',
      email: null,
      apellidos: null,
      dni: null,
      cuil: null,
      push_token: null,
    };

    console.log('[AUTH_SVC] Insertando en usuarios:', JSON.stringify(nuevoPerfil));
    const { error: profileError } = await supabase
      .from('usuarios')
      .insert([nuevoPerfil]);

    if (profileError) {
      console.log('[AUTH_SVC] Error al insertar en usuarios:', profileError);
      console.log('[AUTH_SVC] Error code:', profileError.code);
      console.log('[AUTH_SVC] Error message:', profileError.message);
      console.log('[AUTH_SVC] Error details:', profileError.details);
      console.log('[AUTH_SVC] Error hint:', profileError.hint);
      throw profileError;
    }

    console.log('[AUTH_SVC] Inserción OK en usuarios');
    return data;
  },

  /**
   * Cierra la sesión activa en Supabase.
   */
  async cerrarSesion() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Obtiene el perfil completo de la tabla `usuarios` a partir de un userId conocido.
   */
  async obtenerPerfil(userId: string): Promise<UsuarioPerfil | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener perfil:', error.message);
      return null;
    }

    return data as UsuarioPerfil;
  },

  /**
   * Obtiene el perfil del usuario con la sesión activa en ese momento.
   * Útil para obtener datos sin necesidad del contexto.
   */
  async obtenerPerfilActual(): Promise<UsuarioPerfil | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;
    return AuthService.obtenerPerfil(session.user.id);
  },

  /**
   * Obtiene el email de un usuario según su perfil (usado para el acceso rápido de testing).
   */
  async obtenerEmailPorPerfil(perfil: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('email')
      .eq('perfil', perfil)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(`Error al buscar email para perfil '${perfil}':`, error.message);
      return null;
    }

    return data?.email || null;
  },

  /**
   * Resuelve la ruta de navegación de Expo Router según el perfil del usuario.
   * Equivalente al switch de redirigirSegunPerfil() del servicio Angular original.
   * Lanza un error si el perfil no tiene una ruta asignada.
   */
  resolverRutaPorPerfil(perfil: string): string {
    const role = perfil.trim().toLowerCase();

    switch (role) {
      case 'dueño':
      case 'admin':
        return '/(homes)/duenio';
      case 'supervisor':
        return '/(homes)/supervisor';
      case 'metre':
        return '/(homes)/metre';
      case 'mozo':
        return '/(homes)/mozo';
      case 'cantinero':
      case 'bartender':
        return '/(homes)/cantinero';
      case 'cocinero':
        return '/(homes)/cocinero';
      case 'cliente_anonimo':
        return '/(tabs)/homeAnonimo';
      case 'cliente':
      case 'cliente_reg':
        return '/(tabs)/home';
      default:
        throw new Error(`Perfil no reconocido para la navegación: '${role}'`);
    }
  },
};
