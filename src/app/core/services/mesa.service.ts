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
}