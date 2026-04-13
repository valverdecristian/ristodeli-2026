import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonItem, IonAvatar, IonLabel, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonSkeletonText } from '@ionic/angular/standalone';
import { ClienteAprobacionService } from '../../../core/services/cliente-aprobacion.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeCircleOutline, warningOutline } from 'ionicons/icons';

@Component({
  selector: 'app-aprobacion-clientes',
  templateUrl: './aprobacion-clientes.page.html',
  styleUrls: ['./aprobacion-clientes.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, CommonModule, FormsModule, IonItem, IonAvatar, IonLabel, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonSkeletonText]
})
export class AprobacionClientesPage {
  
  private clienteAprobacionService = inject(ClienteAprobacionService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);

  pendientes: any[] = [];
  isLoading = true;

  constructor() {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, warningOutline });
  }

  ionViewWillEnter() {
    this.cargarPendientes();
  }

  async cargarPendientes() {
    this.isLoading = true;
    try {
      this.pendientes = await this.clienteAprobacionService.obtenerClientesPendientes();
    } catch (error) {
      this.toastService.mostrarError('Error al cargar la lista de clientes.');
    } finally {
      this.isLoading = false;
    }
  }

  async aprobar(cliente: any) {
    await this.spinnerService.mostrar('Aprobando...');
    try {
      await this.clienteAprobacionService.aprobarCliente(cliente.id);
      
      // Removed approved user from UI instantly
      this.pendientes = this.pendientes.filter(c => c.id !== cliente.id);
      
      const audio = new Audio('assets/sounds/exito.mp3');
      audio.play().catch(() => {});
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      this.toastService.mostrarExito(`${cliente.nombres} ha sido aprobado.`);
    } catch (error) {
      this.toastService.mostrarError('Error al aprobar cliente.');
    } finally {
      await this.spinnerService.ocultar();
    }
  }

  async rechazar(cliente: any) {
    await this.spinnerService.mostrar('Rechazando...');
    try {
      await this.clienteAprobacionService.rechazarCliente(cliente.id);
      
      // Remove rejected user from UI
      this.pendientes = this.pendientes.filter(c => c.id !== cliente.id);
      
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      this.toastService.mostrarAdvertencia(`${cliente.nombres} fue rechazado.`);
    } catch (error) {
      this.toastService.mostrarError('Error al rechazar cliente.');
    } finally {
      await this.spinnerService.ocultar();
    }
  }
}
