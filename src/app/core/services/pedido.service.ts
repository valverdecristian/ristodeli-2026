import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js'; 
import { environment } from 'src/environments/environment';
import { ToastService } from './toast.service'; 
import { Haptics, ImpactStyle } from '@capacitor/haptics'; 

export interface Pedido {
  id: string;
  mesa_numero: number;
  producto_nombre: string;
  categoria: 'plato' | 'bebida' | 'postre'; 
  cantidad: number;
  estado: 'Pendiente' | 'En Preparacion' | 'Listo'; 
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private supabase: SupabaseClient;
  private toastService = inject(ToastService);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async obtenerPedidosPorSectores(categorias: string[]) {
    const { data, error } = await this.supabase
      .from('pedidos')
      .select('*')
      .in('categoria', categorias) 
      .neq('estado', 'Listo') 
      .order('created_at', { ascending: true }); 

    if (error) {
      console.error('Error trayendo pedidos:', error);
      return [];
    }
    return data as Pedido[];
  }

  async actualizarEstado(id: string, nuevoEstado: string) {
    try {
      const { error } = await this.supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {

      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('No se pudo actualizar el estado.');
      throw error;
    }
  }
}