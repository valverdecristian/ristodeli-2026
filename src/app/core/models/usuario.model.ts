export type PerfilUsuario = 
  | 'dueño' 
  | 'supervisor' 
  | 'metre' 
  | 'mozo' 
  | 'cocinero' 
  | 'cantinero' 
  | 'cliente_reg' 
  | 'cliente_anon';

/**
 * Interfaz para MOSTRAR y TRABAJAR con los datos del usuario en la App.
 */
export interface UsuarioPerfil {
  id?: string;
  email: string;
  nombres: string;
  apellidos: string;
  dni: string;
  cuil: string;
  perfil: PerfilUsuario;
  foto_url?: string | null;
  created_at?: string;
}

/**
 * Interfaz usada para el FORMULARIO de registro.
 * Hereda todo de UsuarioPerfil y agrega el password necesario para el Auth de Supabase.
 */
export interface DetalleRegistro extends UsuarioPerfil {
  password: string;
}