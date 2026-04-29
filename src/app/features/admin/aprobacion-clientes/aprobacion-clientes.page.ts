import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonBackButton, 
  IonButton, 
  IonIcon, 
  IonSpinner // Importación necesaria para solucionar el ERROR
} from '@ionic/angular/standalone';
import { ClienteAprobacionService } from '../../../core/services/cliente-aprobacion.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { addIcons } from 'ionicons';
import { fingerPrintOutline, briefcaseOutline, checkmarkCircleOutline, closeCircleOutline,
  shieldCheckmarkOutline,mailUnreadOutline,imageOutline } from 'ionicons/icons';

@Component({
  selector: 'app-aprobacion-clientes',
  templateUrl: './aprobacion-clientes.page.html',
  styleUrls: ['./aprobacion-clientes.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons, 
    IonBackButton, 
    IonButton, 
    IonIcon, 
    IonSpinner // Agregado a la lista de componentes disponibles
  ]
})
export class AprobacionClientesPage {
  
  private clienteAprobacionService = inject(ClienteAprobacionService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);

  pendientes: any[] = [];
  isLoading = true;
  private channel: any;

  constructor() {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, fingerPrintOutline, briefcaseOutline,
      shieldCheckmarkOutline,mailUnreadOutline,imageOutline

    });
  }

  ionViewWillEnter() {
    this.cargarPendientes();
    this.channel = this.clienteAprobacionService.suscribirseANuevosPendientes(() => {
      this.cargarPendientes();
    });
  }

  ionViewWillLeave() {
    if (this.channel) {
      this.channel.unsubscribe();
    }
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