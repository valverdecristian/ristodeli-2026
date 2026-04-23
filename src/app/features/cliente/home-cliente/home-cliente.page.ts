import { Router } from '@angular/router';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { addIcons } from 'ionicons';
import { logOutOutline, restaurantOutline, barChartOutline, qrCodeOutline } from 'ionicons/icons';

import { QrScannerService } from '../../../core/services/qr-scanner.service';
import { ToastService } from '../../../core/services/toast.service';
import { BotonConsultaMozoComponent } from '../../../shared/components/boton-consulta-mozo/boton-consulta-mozo.component';

@Component({
  selector: 'app-home-cliente',
  templateUrl: './home-cliente.page.html',
  styleUrls: ['./home-cliente.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, CommonModule, FormsModule, BotonConsultaMozoComponent]
})

export class HomeClientePage {
  private authService = inject(AuthService);
  private spinnerService = inject(SpinnerService);
  private notificacionService = inject(NotificacionService);
  private qrScannerService = inject(QrScannerService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  nombreCliente: string = 'Cargando...';

  constructor() {
    addIcons({ logOutOutline, restaurantOutline, barChartOutline, qrCodeOutline });
  }

  async ionViewWillEnter() {
    const perfil = await this.authService.obtenerPerfilUsuarioActual();
    if (perfil) {
      this.nombreCliente = perfil.nombres;
    } else {
      const anonimoId = localStorage.getItem('anonimo_id');
      if (anonimoId) {
        const { data } = await this.authService.supabaseClient
          .from('anonimos')
          .select('nombre')
          .eq('id', anonimoId)
          .single();
        if (data && data.nombre) {
          this.nombreCliente = data.nombre;
        } else {
          this.nombreCliente = 'Invitado';
        }
      } else {
        this.nombreCliente = 'Cliente';
      }
    }
    
    // Inicializar Push Notifications
    await this.notificacionService.inicializarPushNotifications();
  }

  async cerrarSesion() {
    await this.spinnerService.mostrar('Cerrando sesión...');
    await this.authService.cerrarSesion();
    await this.spinnerService.ocultar();
  }

  async escanearQr() {

    const qrText = await this.qrScannerService.scanQr();
    
    if (qrText) {
      if (qrText === 'RISTODELI_ENTRADA') {
        this.toastService.mostrarExito('¡Bienvenido! Redirigiendo a lista de espera...');
        this.router.navigate(['/espera-anonimo']); 
      } else {
        this.toastService.mostrarError('El código QR no corresponde al ingreso del local.');
      }
    } else {
      this.toastService.mostrarError('Escaneo de QR cancelado o fallido.');
    }
  }

  ionViewWillLeave() {
    // Si el usuario sale de la app repentinamente o vuelve atrás, destruimos instancia activa.
    this.qrScannerService.detenerEscaneo();
  }

}
