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

@Component({
  selector: 'app-home-cliente',
  templateUrl: './home-cliente.page.html',
  styleUrls: ['./home-cliente.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, CommonModule, FormsModule]
})

export class HomeClientePage {
  private authService = inject(AuthService);
  private spinnerService = inject(SpinnerService);
  private notificacionService = inject(NotificacionService);
  private qrScannerService = inject(QrScannerService);
  private toastService = inject(ToastService);

  nombreCliente: string = 'Cargando...';

  constructor() {
    addIcons({ logOutOutline, restaurantOutline, barChartOutline, qrCodeOutline });
  }

  async ionViewWillEnter() {
    const perfil = await this.authService.obtenerPerfilUsuarioActual();
    if (perfil) {
      this.nombreCliente = perfil.nombres;
    } else {
      this.nombreCliente = 'Cliente';
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
      this.toastService.mostrarExito('QR detectado: ' + qrText);
    } else {
      this.toastService.mostrarError('Escaneo de QR cancelado o fallido');
    }
  }

  ionViewWillLeave() {
    // Si el usuario sale de la app repentinamente o vuelve atrás, destruimos instancia activa.
    this.qrScannerService.detenerEscaneo();
  }

}
