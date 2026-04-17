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
  public currentUser = signal<UsuarioPerfil | null>(null);
  public currentSession = signal<Session | null>(null);
  
  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.inicializarAuth();
  }

  private async inicializarAuth() {
    const { data: { session } } = await this.supabase.auth.getSession();
    await this.actualizarEstado(session); // Ahora es async
  
    this.supabase.auth.onAuthStateChange(async (_event, session) => {
      await this.actualizarEstado(session);
    });
  }

  private async actualizarEstado(session: Session | null) {
    this.currentSession.set(session);
    
    if (session?.user) {
      // Buscamos los datos extendidos en tu tabla de la DB
      const { data } = await this.supabase
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      this.currentUser.set(data as UsuarioPerfil);
    } else {
      this.currentUser.set(null);
    }
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
    try {
      
      const audio = new Audio('assets/sounds/exito.mp3'); // PUEDE SER CAMBIADO POR UNO ESPECIFICO
      audio.volume = 0.5;
      
      audio.play().catch(err => console.log('Error al reproducir audio de salida:', err));

      await this.supabase.auth.signOut();

      // Limpiar los signals 
      this.currentSession.set(null);
      this.currentUser.set(null);

      this.router.navigate(['/login'], { replaceUrl: true });

    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      // Igualmente manda al login si algo falla
      this.router.navigate(['/login']);
    }
  }

  /**
   * Obtener detalles del perfil del usuario actual (tabla public.usuarios)
   */
  async obtenerPerfilUsuarioActual() {
    // 1. Intentamos obtenerlo del signal
    let userId = this.currentUser()?.id;
  
    // 2. Si el signal aún no se actualizó, lo buscamos en la sesión activa
    if (!userId) {
      const { data: { session } } = await this.supabase.auth.getSession();
      userId = session?.user?.id;
    }
  
    if (!userId) return null;
  
    // 3. Buscamos en la tabla usuarios
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();
  
    if (error) {
      console.error('Error al obtener perfil:', error.message);
      return null;
    }
  
    return data;
  }

  /**
   * Obtiene el correo de un usuario basado en su perfil (usado para autocompletar login rápido)
   */
  async obtenerEmailPorPerfil(perfil: string) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('email')
      .eq('perfil', perfil)
      .limit(1)
      .single();

    if (error) {
      console.warn(`Error al buscar email para perfil '${perfil}':`, error.message);
      return null;
    }

    return data?.email;
  }
  /**
   * Redirige al usuario a la pantalla correspondiente según su perfil
   */
  async redirigirSegunPerfil() {
    const perfilUsuario = await this.obtenerPerfilUsuarioActual();

    if (!perfilUsuario) {
      throw new Error('No se encontró el perfil del usuario.');
    }

    switch (perfilUsuario.perfil) {
      case 'admin':
        case 'dueno':
        this.router.navigate(['/admin']);
        break;

      case 'supervisor':
        this.router.navigate(['/supervisor']); 
        break;

      case 'cliente_reg':
        this.router.navigate(['/home-cliente']);
        break;

      case 'mozo':
        this.router.navigate(['/home-mozo']);
        break;
      case 'metre':
        this.router.navigate(['/home-metre']);
        break;
      case 'bartender':
      case 'cantinero':
        this.router.navigate(['/home-cantinero']);
        break;

      case 'cocinero':
        this.router.navigate(['/home-cocinero']);
        break;

      default:
        this.router.navigate(['/login']);
        throw new Error('Perfil no válido.');
    }
  }
}


