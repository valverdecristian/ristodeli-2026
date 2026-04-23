import { Router } from '@angular/router';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
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
  private router = inject(Router);

  nombreCliente: string = 'Cargando...';

  constructor() {
    addIcons({ logOutOutline, restaurantOutline, barChartOutline, qrCodeOutline });
  }

  async ionViewWillEnter() {
    // Usamos el nuevo método unificado que arreglamos en el AuthService
    const perfil = await this.authService.obtenerPerfilUsuarioActual();
    if (perfil) {
      this.nombreCliente = perfil.nombres || 'Cliente';
    } else {
      this.nombreCliente = 'Invitado';
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
    
<<<<<<< Updated upstream
    if (qrText) {
      if (qrText === 'RISTODELI_ENTRADA') {
        this.toastService.mostrarExito('¡Bienvenido! Redirigiendo a lista de espera...');
        this.router.navigate(['/espera-anonimo']); 
      } else {
        this.toastService.mostrarError('El código QR no corresponde al ingreso del local.');
      }
=======
    if (!qrText) {
      this.toastService.mostrarError('Escaneo de QR cancelado o fallido.'); 
      return;
    }

    // CASO A: QR DE ENTRADA
    if (qrText === 'RISTODELI_ENTRADA') {
      this.toastService.mostrarExito('¡Bienvenido! Redirigiendo a lista de espera...');
      this.router.navigate(['/espera-anonimo']); 
      return;
    }

    // CASO B: QR DE MESA (Ejemplo: MESA_1, MESA_2...)
    if (qrText.startsWith('MESA_')) {
      await this.manejarEscaneoMesa(qrText);
>>>>>>> Stashed changes
    } else {
      this.toastService.mostrarError('Escaneo de QR cancelado o fallido.');
    }
  }

<<<<<<< Updated upstream
=======
  private async manejarEscaneoMesa(codigoMesa: string) {
    await this.spinnerService.mostrar('Validando mesa...');
    const anonimoId = localStorage.getItem('anonimo_id');
    
    // 1. Verificar estado en lista de espera
    const { data: solicitud, error } = await this.authService.supabaseClient
      .from('lista_espera')
      .select('*')
      .eq('cliente_id', anonimoId)
      .maybeSingle();

    await this.spinnerService.ocultar();

    // VALIDACIÓN 1: No está en la lista o no fue aceptado todavía
    if (!solicitud || solicitud.estado !== 'asignado') {
      await this.vibrarError(); 
      this.toastService.mostrarError('Debes estar asignado a una mesa por el Metre primero.');
      return;
    }

    // VALIDACIÓN 2: Mesa incorrecta
    if (solicitud.mesa_asignada !== codigoMesa) {
      await this.vibrarError(); 
      this.toastService.mostrarError(`Mesa incorrecta. Tu mesa asignada es la ${solicitud.mesa_asignada.replace('_', ' ')}`);
      return;
    }

    // LOGICA DE REDIRECCION
    if (!solicitud.qr_mesa_escaneado) {
      // PRIMER ESCANEO
      await this.marcarQrEscaneado(solicitud.id); 
      this.toastService.mostrarExito('Accediendo al Menú y Servicios');
      this.router.navigate(['/dashboard-gestion']); 
    } else {
      // SEGUNDO ESCANEO
      this.toastService.mostrarExito('Accediendo a Juegos y Estado de Pedido');
      this.router.navigate(['/dashboard-recreativo']); 
    }
  }

  private async vibrarError() {
    await Haptics.impact({ style: ImpactStyle.Heavy }); 
  }

  private async marcarQrEscaneado(idSolicitud: string) {
    await this.authService.supabaseClient
      .from('lista_espera')
      .update({ qr_mesa_escaneado: true })
      .eq('id', idSolicitud);
  }

>>>>>>> Stashed changes
  ionViewWillLeave() {
    this.qrScannerService.detenerEscaneo();
  }

<<<<<<< Updated upstream
}
=======
  irAMenuEncuestas() {
    this.router.navigate(['/menu-encuestas']);
  }
}
>>>>>>> Stashed changes
