// src/context/AuthContext.tsx
// Equivalente reactivo al AuthService de Angular con signals.
// Usa useState + useEffect para manejar currentUser y currentSession de forma global.

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/SupabaseClient';
import { AuthService } from '../services/authService';
import { UsuarioPerfil } from '../models/usuario.model';

// 1. Definimos la forma del contexto
interface AuthContextData {
  currentUser: UsuarioPerfil | null;
  currentSession: Session | null;
  /** true mientras se verifica la sesión inicial al arrancar la app */
  isLoading: boolean;
  ingresar: (email: string, clave: string) => Promise<{ user: any; session: Session | null }>;
  cerrarSesion: () => Promise<void>;
  resolverRutaPorPerfil: (perfil: string) => string;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

// 2. Proveedor del contexto — envuelve toda la app en _layout.tsx
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UsuarioPerfil | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Actualiza el estado reactivo cuando cambia la sesión.
   * Espejo de actualizarEstado() del servicio Angular original.
   */
  const actualizarEstado = async (session: Session | null) => {
    setCurrentSession(session);

    if (session?.user) {
      const perfil = await AuthService.obtenerPerfil(session.user.id);
      setCurrentUser(perfil);
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    // A. Verificamos la sesión existente al arrancar (equivalente a inicializarAuth())
    const inicializar = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await actualizarEstado(session);
      } catch (e) {
        console.error('Error al inicializar la sesión:', e);
      } finally {
        setIsLoading(false);
      }
    };

    inicializar();

    // B. Suscripción reactiva a los cambios de sesión (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await actualizarEstado(session);
      }
    );

    // C. Limpieza al desmontar
    return () => subscription.unsubscribe();
  }, []);

  const ingresar = async (email: string, clave: string) => {
    return AuthService.ingresar(email, clave);
  };

  const cerrarSesion = async () => {
    await AuthService.cerrarSesion();
    // El listener onAuthStateChange también limpiará el estado,
    // pero lo hacemos inmediato para mejor UX
    setCurrentUser(null);
    setCurrentSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentSession,
        isLoading,
        ingresar,
        cerrarSesion,
        resolverRutaPorPerfil: AuthService.resolverRutaPorPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 3. Hook para consumir el contexto en cualquier componente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
