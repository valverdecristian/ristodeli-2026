import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Mensaje } from '../../../core/models/mensaje';
import { RealtimeService } from '../../../core/services/realtime.service';
import { AuthService } from '../../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { send } from 'ionicons/icons';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, DatePipe]
})
export class ChatPage implements AfterViewInit, OnInit, OnDestroy {
  realtime = inject(RealtimeService);
  auth = inject(AuthService);
  route = inject(ActivatedRoute);

  mensajes = signal<Mensaje[]>([]);
  mensajeTexto = signal('');
  mesaId: string = '';
  currentUserId: string | null = null;
  anonimoId: string | null = null;
  backUrl: string = '/';

  @ViewChild('chatScroll') chatScroll!: ElementRef<HTMLDivElement>;

  constructor() {
    addIcons({ send });
  }

  ngOnInit() {
    this.mesaId = this.route.snapshot.paramMap.get('mesaId') || '1';
    
    this.currentUserId = this.auth.currentUser()?.id || null;
    this.anonimoId = localStorage.getItem('anonimo_id') || null;

    const perfil = this.auth.currentUser()?.perfil;
    if (perfil === 'mozo') {
      this.backUrl = '/consultas';
    } else {
      this.backUrl = '/home-cliente';
    }

    this.realtime.traerTodosLosMensajes(this.mesaId).then((msjs) => {
      this.mensajes.set(msjs);
      this.scrollAlFinal();
    });

    this.realtime.channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultas', filter: `mesa_id=eq.${this.mesaId}` }, async (payload) => {
        const { id } = payload.new;
        const { data, error } = await this.realtime.client
          .from('consultas')
          .select(`id, mesa_id, id_anonimo, id_registrado, mensaje, created_at, anonimos:id_anonimo(nombre), usuarios:id_registrado(nombres, apellidos)`)
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error al reconsultar mensaje:', error);
          return;
        }

        if (data) {
          this.mensajes.update((arr) => [...arr, data as unknown as Mensaje]);
          this.scrollAlFinal();
        }
      })
      .subscribe();
  }

  ngAfterViewInit() {
    this.scrollAlFinal();
  }

  ngOnDestroy() {
    this.realtime.channel.unsubscribe();
  }

  async enviarMensaje() {
    const mensaje = this.mensajeTexto().trim();

    if (!mensaje) return;

    await this.realtime.crearMensaje(this.mesaId, mensaje);
    this.mensajeTexto.set('');
    this.scrollAlFinal();
  }

  scrollAlFinal() {
    setTimeout(() => {
      if (this.chatScroll && this.chatScroll.nativeElement) {
        this.chatScroll.nativeElement.scrollTop = this.chatScroll.nativeElement.scrollHeight;
      }
    }, 100);
  }

  esMensajePropio(msj: Mensaje): boolean {
    if (this.currentUserId && msj.id_registrado === this.currentUserId) return true;
    if (this.anonimoId && msj.id_anonimo === this.anonimoId) return true;
    return false;
  }

  getNombreRemitente(msj: Mensaje): string {
    if (msj.anonimos?.nombre) return msj.anonimos.nombre;
    if (msj.usuarios) return `${msj.usuarios.nombres} ${msj.usuarios.apellidos}`;
    return 'Usuario';
  }
}
