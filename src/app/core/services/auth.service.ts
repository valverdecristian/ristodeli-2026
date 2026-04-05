import { inject, Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { DetalleRegistro, UsuarioPerfil } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private router = inject(Router);
  
  // Usamos signals para manejar el estado del usuario actual de manera reactiva en Angular >= 16
  public currentUser = signal<User | null>(null);
  public currentSession = signal<Session | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.inicializarAuth();
  }

  private async inicializarAuth() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.actualizarEstado(session);

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.actualizarEstado(session);
    });
  }

  private actualizarEstado(session: Session | null) {
    this.currentSession.set(session);
    this.currentUser.set(session?.user ?? null);
  }

  /**
   * Obtiene la instancia pura de Supabase en caso de necesitar consultas directas.
   */
  get supabaseClient() {
    return this.supabase;
  }

  /**
   * Iniciar sesión con email y contraseña
   */
  async ingresar(email: string, clave: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: clave,
    });
    
    if (error) throw error;
    return data;
  }

  /**
   * Registra un nuevo usuario en la autenticación de Supabase y luego inserta sus datos extendidos en la tabla `usuarios`.
   */
  async registrar(password: string, detalles: DetalleRegistro) {
    // 1. Crear el usuario en auth.users
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: detalles.email,
      password: password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se devolvió un usuario tras el registro.');

    // 2. Insertar los detalles del perfil en la tabla public.usuarios
    const nuevoPerfil = {
      id: authData.user.id,
      email: detalles.email,
      nombres: detalles.nombres,
      apellidos: detalles.apellidos,
      dni: detalles.dni,
      cuil: detalles.cuil,
      perfil: detalles.perfil,
      foto_url: detalles.foto_url || null
    };

    const { data: profileData, error: profileError } = await this.supabase
      .from('usuarios')
      .insert([nuevoPerfil]);

    if (profileError) throw profileError;

    return { authData, profileData };
  }

  /**
   * Cierra la sesión activa
   */
  async cerrarSesion() {
    await this.supabase.auth.signOut();
    this.router.navigate(['/login']);
  }

  /**
   * Obtener detalles del perfil del usuario actual (tabla public.usuarios)
   */
  async obtenerPerfilUsuarioActual() {
    const user = this.currentUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    return error ? null : data;
  }
}
