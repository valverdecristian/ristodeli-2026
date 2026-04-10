import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Mesa } from '../models/mesa.model';

@Injectable({
  providedIn: 'root'
})
export class MesaService {
  private authService = inject(AuthService);

  constructor() {}

  /**
   * Verifica si ya existe una mesa con ese número en la base de datos.
   */
  async verificarSiExiste(numero: number): Promise<boolean> {
    const supabase = this.authService.supabaseClient;
    
    const { data, error } = await supabase
      .from('mesas')
      .select('id')
      .eq('numero', numero)
      .limit(1);

    if (error) {
      console.error('Error al verificar mesa:', error);
      throw error;
    }

    return data && data.length > 0;
  }

  /**
   * Guarda la nueva mesa (incluyendo el texto del QR) en Supabase.
   */
  async crearMesa(mesa: Mesa): Promise<any> {
    const supabase = this.authService.supabaseClient;

    const { data, error } = await supabase
      .from('mesas')
      .insert([mesa]);

    if (error) {
      console.error('Error al crear mesa:', error);
      throw error;
    }

    return data;
  }

  /**
   * Obtiene todas las mesas de la base de datos, ordenadas por número.
   */
  async obtenerMesas(): Promise<Mesa[]> {
    const supabase = this.authService.supabaseClient;
    
    const { data, error } = await supabase
      .from('mesas')
      .select('*')
      .order('numero', { ascending: true }); // Para que aparezcan ordenadas en la grilla

    if (error) {
      console.error('Error al obtener mesas:', error);
      throw error;
    }

    return data as Mesa[];
  }

  /**
   * Actualiza el estado de una mesa en Supabase (Libre / Ocupada).
   */
  async actualizarEstado(id: string, nuevoEstado: string): Promise<void> {
    const supabase = this.authService.supabaseClient;

    const { error } = await supabase
      .from('mesas')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar el estado de la mesa:', error);
      throw error;
    }
  }

}