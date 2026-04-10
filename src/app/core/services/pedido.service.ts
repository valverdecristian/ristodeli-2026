import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js'; 
import { environment } from 'src/environments/environment';

export interface Pedido {
  id: string;
  mesa_numero: number;
  producto_nombre: string;
  categoria: string;
  cantidad: number;
  estado: 'Pendiente' | 'En Preparación' | 'Listo';
  created_at: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // Trae solo los pedidos que sean de una categoría y que no estén Listos
  async obtenerPedidosActivos(categoria: string) {
    const { data, error } = await this.supabase
      .from('pedidos')
      .select('*')
      .eq('categoria', categoria)
      .neq('estado', 'Listo') // Oculta los que ya se entregaron
      .order('created_at', { ascending: true }); 

    if (error) {
      console.error('Error trayendo pedidos:', error);
      return [];
    }
    return data as Pedido[];
  }

  // Actualiza el estado en la base de datos
  async cambiarEstado(id: string, nuevoEstado: string) {
    const { error } = await this.supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (error) throw error;
  }
}