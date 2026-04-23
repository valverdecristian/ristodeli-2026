export interface Mensaje {
  id?: string;
  mesa_id?: string;
  id_anonimo?: string | null;
  id_registrado?: string | null;
  mensaje: string;
  created_at: string;
  anonimos?: {
    nombre: string;
  };
  usuarios?: {
    nombres: string;
    apellidos: string;
  };
}
