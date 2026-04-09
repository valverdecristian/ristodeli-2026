import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private authService = inject(AuthService);

  constructor() {}

  async verificarSiExiste(nombre: string, tipo: 'plato' | 'bebida'): Promise<boolean> {
    const supabase = this.authService.supabaseClient;
    
    const nombreNormalizado = nombre.trim().toLowerCase();

    const { data, error } = await supabase
      .from('productos')
      .select('id')
      .ilike('nombre', nombreNormalizado) // ilike hace una busqueda sin distinguir mayusculas
      .eq('tipo', tipo)
      .limit(1);

    if (error) {
      console.error('Error al verificar producto:', error);
      throw error;
    }

    return data && data.length > 0;
  }

  async crearProducto(producto: Producto): Promise<any> {
    const supabase = this.authService.supabaseClient;

    const { data, error } = await supabase
      .from('productos')
      .insert([producto]);

    if (error) {
      console.error('Error al insertar producto:', error);
      throw error;
    }

    return data;
  }
}