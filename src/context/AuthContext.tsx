import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/SupabaseClient';
import { AuthService } from '../services/authService';
import { UsuarioPerfil } from '../models/usuario.model';

interface AuthContextData {
  currentUser: UsuarioPerfil | null;
  currentSession: Session | null;
  isLoading: boolean;
  ingresar: (email: string, clave: string) => Promise<{ user: any; session: Session | null }>;
  cerrarSesion: () => Promise<void>;
  resolverRutaPorPerfil: (perfil: string) => string;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await actualizarEstado(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const ingresar = async (email: string, clave: string) => {
    return AuthService.ingresar(email, clave);
  };

  const cerrarSesion = async () => {
    await AuthService.cerrarSesion();
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

// Hook para consumir el contexto en cualquier componente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
