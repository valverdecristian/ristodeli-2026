export interface UsuarioPerfil {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  dni: string;
  cuil: string;
  /** Rol del usuario: 'admin', 'supervisor', 'metre', 'mozo', 'cantinero', 'cocinero', 'cliente' */
  perfil: string;
  foto_url: string | null;
  push_token: string | null;
  /** Estado de aprobación del cliente (null = pendiente, true = aprobado, false = rechazado) */
  estado?: boolean | null;
}

/**
 * DTO con los datos extra del formulario de registro de un cliente nuevo.
 * Se usa al llamar a AuthService.registrar() para poblar la tabla `usuarios`.
 */
export interface DetalleRegistro {
  email: string;
  nombres: string;
  apellidos: string;
  dni: string;
  cuil: string;
  /** Perfil inicial que se asignará (por defecto 'cliente' para autoregistro) */
  perfil: string;
  foto_url?: string | null;
}
