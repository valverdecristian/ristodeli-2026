import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

interface ChatResumen {
  mesa_id: string;
  ultimo_mensaje: string;
  fecha: string;
  cliente_nombre: string;
}

@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.page.html',
  styleUrls: ['./consultas.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ConsultasPage implements OnInit {

  private supabase: SupabaseClient;
  private router = inject(Router);

  chats: ChatResumen[] = [];

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  ngOnInit() {
    this.cargarConsultas();
    this.listenConsultasRealtime();
  }

  // CARGA INICIAL
  async cargarConsultas() {
    const { data, error } = await this.supabase
      .from('consultas')
      .select('id, mesa_id, mensaje, created_at, anonimos:id_anonimo(nombre), usuarios:id_registrado(nombres, apellidos)')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error cargando consultas:', error);
      return;
    }

    this.agruparChats(data || []);
  }

  agruparChats(mensajes: any[]) {
    const map = new Map<string, ChatResumen>();

    mensajes.forEach((msj) => {
      if (!msj.mesa_id) return;
      if (!map.has(msj.mesa_id)) {
        let nombre = 'Desconocido';
        const anon: any = msj.anonimos;
        const usu: any = msj.usuarios;
        if (anon?.nombre) nombre = anon.nombre;
        else if (usu) nombre = `${usu.nombres} ${usu.apellidos}`;
        
        map.set(msj.mesa_id, {
          mesa_id: msj.mesa_id,
          ultimo_mensaje: msj.mensaje,
          fecha: msj.created_at,
          cliente_nombre: nombre
        });
      }
    });

    this.chats = Array.from(map.values());
  }

  // REALTIME
  listenConsultasRealtime() {
    this.supabase
      .channel('consultas-room')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultas'
        },
        async (payload) => {
          const { data } = await this.supabase
            .from('consultas')
            .select('id, mesa_id, mensaje, created_at, anonimos:id_anonimo(nombre), usuarios:id_registrado(nombres, apellidos)')
            .eq('id', payload.new['id'])
            .single();

          if (data) {
             const existingIdx = this.chats.findIndex(c => c.mesa_id === data.mesa_id);
             let nombre = 'Desconocido';
             const anonimos: any = data.anonimos;
             const usuarios: any = data.usuarios;
             if (anonimos?.nombre) nombre = anonimos.nombre;
             else if (usuarios) nombre = `${usuarios.nombres} ${usuarios.apellidos}`;

             const newChat: ChatResumen = {
                mesa_id: data.mesa_id,
                ultimo_mensaje: data.mensaje,
                fecha: data.created_at,
                cliente_nombre: nombre
             };

             if (existingIdx !== -1) {
                this.chats.splice(existingIdx, 1);
             }
             this.chats.unshift(newChat);
          }
        }
      )
      .subscribe();
  }

  abrirChat(mesaId: string) {
    this.router.navigate(['/chat', mesaId]);
  }
}