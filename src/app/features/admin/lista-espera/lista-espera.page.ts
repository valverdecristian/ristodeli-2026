import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { SpinnerService } from 'src/app/core/services/spinner.service';
import { MesaService } from 'src/app/core/services/mesa.service';
import { addIcons } from 'ionicons';
import { restaurantOutline, checkmarkCircleOutline, timeOutline } from 'ionicons/icons';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonList, IonItem, IonLabel, IonAvatar, 
  IonButton, IonIcon, IonBadge, AlertController
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonBackButton, IonList, IonItem, IonLabel, 
    IonAvatar, IonButton, IonIcon, IonBadge
  ]
})
export class ListaEsperaPage implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private spinner = inject(SpinnerService);
  private mesaService = inject(MesaService);
  private alertController = inject(AlertController);
  
  public clientesEsperando: any[] = [];

  constructor() {
    addIcons({ restaurantOutline, checkmarkCircleOutline, timeOutline });
  }

  ngOnInit() {
    this.cargarListaEspera();
  }

  async cargarListaEspera() {
    await this.spinner.mostrar('Cargando lista de espera...');
    const { data, error } = await this.authService.supabaseClient
      .from('lista_espera')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true });

    await this.spinner.ocultar();

    if (error) {
      console.error(error);
      this.toastService.mostrarError('Error al cargar la lista de espera');
    } else {
      this.clientesEsperando = data || [];
    }
  }

  async asignarMesa(cliente: any) {
    await this.spinner.mostrar('Buscando mesas libres...');
    try {
      const mesas = await this.mesaService.obtenerMesas();
      const mesasLibres = mesas.filter(m => m.estado === 'Libre');
      
      await this.spinner.ocultar();

      if (mesasLibres.length === 0) {
        this.toastService.mostrarAdvertencia('No hay mesas libres actualmente.');
        return;
      }

      const inputs: any[] = mesasLibres.map(mesa => ({
        type: 'radio',
        label: `Mesa ${mesa.numero} (${mesa.comensales} personas)`,
        value: mesa,
        handler: () => {}
      }));

      const alert = await this.alertController.create({
        header: 'Asignar Mesa',
        message: `Selecciona una mesa disponible para ${cliente.nombre}`,
        inputs: inputs,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Asignar',
            handler: (mesaSeleccionada: any) => {
              if (mesaSeleccionada) {
                this.confirmarAsignacion(cliente, mesaSeleccionada);
              } else {
                this.toastService.mostrarError('Debes seleccionar una mesa');
                return false;
              }
            }
          }
        ]
      });

      await alert.present();

    } catch (error) {
      await this.spinner.ocultar();
      console.error(error);
      this.toastService.mostrarError('No se pudieron obtener las mesas.');
    }
  }

  private async confirmarAsignacion(cliente: any, mesa: any) {
    await this.spinner.mostrar('Asignando mesa...');
    try {
      // 1. Actualizar mesa a 'Ocupada'
      if (mesa.id) { // mesa should have an id according to Mesa interface
        await this.mesaService.actualizarEstado(mesa.id, 'Ocupada');
      }

      // 2. Actualizar cliente en lista_espera a 'asignada'
      const { error: errLista } = await this.authService.supabaseClient
        .from('lista_espera')
        .update({ estado: 'asignada' })
        .eq('id', cliente.id);

      if (errLista) throw errLista;

      // 3. Notificar al cliente via Edge Function
      this.authService.supabaseClient.functions.invoke('notify-cliente-mesa', {
        body: { 
          cliente_id: cliente.cliente_id, 
          tipo: cliente.tipo, 
          numero_mesa: mesa.numero
        }
      }).catch(err => console.error('Error enviando push de mesa al cliente:', err));

      await this.spinner.ocultar();
      this.toastService.mostrarExito(`Mesa ${mesa.numero} asignada a ${cliente.nombre}`);
      this.cargarListaEspera();
    } catch (error) {
      await this.spinner.ocultar();
      this.toastService.mostrarError('Ocurrió un error al asignar la mesa.');
      console.error(error);
    }
  }
}
