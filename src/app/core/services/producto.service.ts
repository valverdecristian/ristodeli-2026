import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Producto } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // Inyectamos AuthService para acceder al cliente de Supabase y su sesión
  private authService = inject(AuthService);

  constructor() {}

  /**
   * Verifica la existencia de un producto en la tabla productos para evitar duplicados.
   * Utiliza una comparación insensible a mayúsculas y minúsculas (ilike).
   */
  async verificarSiExiste(nombre: string, tipo: 'plato' | 'bebida'): Promise<boolean> {
    const supabase = this.authService.supabaseClient;
    
    // Normalizamos el nombre para la búsqueda, eliminando espacios extras
    const nombreNormalizado = nombre.trim();

    const { data, error } = await supabase
      .from('productos')
      .select('id')
      .ilike('nombre', nombreNormalizado) // ilike busca coincidencias sin distinguir capitalización
      .eq('tipo', tipo)
      .limit(1);

    if (error) {
      console.error('Error al verificar producto:', error);
      throw error;
    }

    return data && data.length > 0;
  }

  /**
    Inserta un nuevo registro de producto en la base de datos.
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
}