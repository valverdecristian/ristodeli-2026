import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { SpinnerService } from 'src/app/core/services/spinner.service';
import { MesaService } from 'src/app/core/services/mesa.service';
import { addIcons } from 'ionicons';
import { restaurantOutline, checkmarkCircleOutline, timeOutline } from 'ionicons/icons';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonList, IonItem, IonLabel, IonAvatar, 
  IonIcon, IonBadge, IonSelect, IonSelectOption 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonBackButton, IonList, IonItem, IonLabel, 
    IonAvatar, IonIcon, IonBadge, IonSelect, IonSelectOption
  ]
})
export class ListaEsperaPage implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private spinner = inject(SpinnerService);
  private mesaService = inject(MesaService);

  public clientesEsperando: any[] = [];
  public mesasLibres: any[] = [];

  constructor() {
    addIcons({ restaurantOutline, checkmarkCircleOutline, timeOutline });
  }

  async ngOnInit() {
    await this.cargarListaEspera();
    await this.cargarMesasLibres();
  }

  async cargarListaEspera() {
    try {
      const { data, error } = await this.authService.supabaseClient
        .from('lista_espera')
        .select('*')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: true });

      if (error) throw error;
      this.clientesEsperando = data || [];
    } catch (error) {
      this.toastService.mostrarError('Error al cargar lista de espera');
    }
  }

  async cargarMesasLibres() {
    try {
      const mesas = await this.mesaService.obtenerMesas();
      this.mesasLibres = mesas.filter(m => m.estado === 'Libre');
    } catch (error) {
      console.error('Error cargando mesas', error);
    }
  }

  async onMesaSelected(event: any, cliente: any) {
    const mesaElegida = event.detail.value;
    if (mesaElegida) {
      await this.confirmarAsignacion(cliente, mesaElegida);
      
      // Refrescamos las listas para actualizar la vista
      await this.cargarListaEspera();
      await this.cargarMesasLibres();
      
      // Limpiamos el valor del selector
      event.target.value = null;
    }
  }

  private async confirmarAsignacion(cliente: any, mesa: any) {
    await this.spinner.mostrar('Asignando mesa...');
    try {
      // 1. Actualizar estado de la mesa a 'Ocupada'
      await this.mesaService.actualizarEstado(mesa.id, 'Ocupada');

      // 2. Actualizar lista_espera con el formato de texto para el QR
      const { error: errLista } = await this.authService.supabaseClient
        .from('lista_espera')
        .update({ 
          estado: 'asignado', 
          mesa_asignada: `MESA_${mesa.numero}` 
        })
        .eq('id', cliente.id);

      if (errLista) {
        // Reversión en caso de error
        await this.mesaService.actualizarEstado(mesa.id, 'Libre');
        throw errLista;
      }

      // 3. Notificar al cliente vía Edge Function (Push Notification)
      this.authService.supabaseClient.functions.invoke('notify-cliente-mesa', {
        body: { 
          cliente_id: cliente.cliente_id, 
          tipo: cliente.tipo, 
          numero_mesa: mesa.numero
        }
      }).catch(err => console.error('Error enviando push al cliente:', err));

      await this.spinner.ocultar();
      this.toastService.mostrarExito(`Mesa ${mesa.numero} asignada a ${cliente.nombre}`);
      
      this.clientesEsperando = this.clientesEsperando.filter(c => c.id !== cliente.id);

    } catch (error) {
      await this.spinner.ocultar();
      this.toastService.mostrarError('Error al procesar la asignación.');
      console.error("Error detallado:", error);
      await this.cargarMesasLibres();
    }
  }
}