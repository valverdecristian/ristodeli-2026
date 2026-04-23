import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Mensaje } from '../models/mensaje';

@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private auth = inject(AuthService);

  public channel = this.client.channel('table-db-changes');

  get client() {
    return this.auth.supabaseClient;
  }

  async traerTodosLosMensajes(mesaId: string): Promise<Mensaje[]> {
    const { data, error } = await this.client
      .from('consultas')
      .select(`
        id,
        mesa_id,
        id_anonimo,
        id_registrado,
        mensaje,
        created_at,
        anonimos:id_anonimo(nombre),
        usuarios:id_registrado(nombres, apellidos)
      `)
      .eq('mesa_id', mesaId)
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.log('Error al traer los mensajes:', error);
      return [];
    }
    return data as any;
  }

  async crearMensaje(mesaId: string, mensaje: string) {
    const currentUser = this.auth.currentUser();
    const isRegistrado = !!currentUser;
    const isAnonimo = !isRegistrado && localStorage.getItem('anonimo_id');
    
    let insertData: any = {
      mesa_id: mesaId,
      mensaje: mensaje
    };

    if (isRegistrado && currentUser) {
      insertData.id_registrado = currentUser.id;
    } else if (isAnonimo) {
      insertData.id_anonimo = localStorage.getItem('anonimo_id');
    }

    const { error } = await this.client.from('consultas').insert(insertData);
    if (error) {
      console.error('Error al enviar mensaje a Supabase:', error);
    }
    return { error };
  }
}