import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private authService = inject(AuthService);

  constructor() {}

  /**
   * Verifica la existencia de un producto en la tabla productos para evitar duplicados.
   * Utiliza una comparación insensible a mayúsculas y minúsculas (ilike).
   */

  async verificarSiExiste(nombre: string, tipo: 'plato' | 'bebida' | 'postre'): Promise<boolean> {
    const supabase = this.authService.supabaseClient;
    const nombreNormalizado = nombre.trim();

    const { data, error } = await supabase
      .from('productos')
      .select('id')
      .ilike('nombre', nombreNormalizado)
      .eq('tipo', tipo)
      .limit(1);

    if (error) {
      console.error('Error al verificar producto:', error);
      throw error;
    }

    return data && data.length > 0;
  }

  /**
    Inserta un nuevo producto. 
   */
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

  /**
    Obtiene la lista de productos filtrada por tipo (plato, bebida o postre).
   */
  async obtenerPorTipo(tipo: string): Promise<any[]> {
    const supabase = this.authService.supabaseClient;

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tipo', tipo)
      .order('nombre', { ascending: true });

    if (error) {
      console.error(`Error al obtener ${tipo}s:`, error);
      throw error;
    }

    return data || [];
  }
}