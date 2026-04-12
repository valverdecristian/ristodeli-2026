import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteAprobacionService {
  private authService = inject(AuthService);

  constructor() { }

  /**
   * Obtiene la lista de todos los usuarios (clientes) que tienen el perfil 'pendiente'.
   */
  async obtenerClientesPendientes() {
    const { data, error } = await this.authService.supabaseClient
      .from('usuarios')
      .select('*')
      .eq('perfil', 'pendiente');

    if (error) {
      console.error('Error al obtener clientes pendientes:', error);
      throw error;
    }

    return data;
  }

  /**
   * Aprueba a un cliente pendiente, cambiando su perfil a 'cliente_reg'.
   * @param idUsuario El UUID del usuario a aprobar
   */
  async aprobarCliente(idUsuario: string) {
    const { data, error } = await this.authService.supabaseClient
      .from('usuarios')
      .update({ perfil: 'cliente_reg' })
      .eq('id', idUsuario);

    if (error) {
      console.error('Error al aprobar cliente:', error);
      throw error;
    }

    return data;
  }

  /**
   * Rechaza a un cliente pendiente, cambiando su perfil a 'rechazado'.
   * @param idUsuario El UUID del usuario a rechazar
   */
  async rechazarCliente(idUsuario: string) {
    const { data, error } = await this.authService.supabaseClient
      .from('usuarios')
      .update({ perfil: 'rechazado' })
      .eq('id', idUsuario);

    if (error) {
      console.error('Error al rechazar cliente:', error);
      throw error;
    }

    return data;
  }
}
