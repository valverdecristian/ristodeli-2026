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
import { Haptics, ImpactStyle } from '@capacitor/haptics';
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
    
    if (!qrText) {
      this.toastService.mostrarError('Escaneo de QR cancelado o fallido.'); 
      return;
    }

    // CASO A: QR DE ENTRADA [cite: 107]
    if (qrText === 'RISTODELI_ENTRADA') {
      this.toastService.mostrarExito('¡Bienvenido! Redirigiendo a lista de espera...');
      this.router.navigate(['/espera-anonimo']); 
      return;
    }

    // CASO B: QR DE MESA (Ejemplo: MESA_1, MESA_2...) [cite: 110]
    if (qrText.startsWith('MESA_')) {
      await this.manejarEscaneoMesa(qrText);
    } else {
      await this.vibrarError();
      this.toastService.mostrarError('El código QR no corresponde a ninguna función del local.');
    }
  }

  private async manejarEscaneoMesa(codigoMesa: string) {
    const anonimoId = localStorage.getItem('anonimo_id');
    
    // 1. Verificar si está en lista de espera y si tiene mesa asignada [cite: 227, 231]
    const { data: solicitud, error } = await this.authService.supabaseClient
      .from('lista_espera')
      .select('*')
      .eq('cliente_id', anonimoId) // Asegúrate de guardar el ID al solicitar
      .single();

    // VALIDACIÓN 1: No está en la lista o no fue aceptado todavía [cite: 233]
    if (!solicitud || solicitud.estado !== 'asignado') {
      await this.vibrarError(); 
      this.toastService.mostrarError('No podés solicitar mesa sin estar previamente en la lista de espera.');
      return;
    }

    // VALIDACIÓN 2: Escaneó la mesa incorrecta [cite: 246]
    if (solicitud.mesa_asignada !== codigoMesa) {
      await this.vibrarError(); // Punto 52: Vibración en error 
      this.toastService.mostrarError(`Mesa incorrecta. Tu mesa asignada es la ${solicitud.mesa_asignada.replace('_', ' ')}`);
      return;
    }

    // LÓGICA DE REDIRECCIÓN (Punto Gamma) 
    // Usamos una flag en la base de datos o local para saber si es el segundo escaneo
    if (!solicitud.qr_mesa_escaneado) {
      // PRIMER ESCANEO: Menú, Encuestas, Consulta Mozo [cite: 250, 252]
      await this.marcarQrEscaneado(solicitud.id);
      this.router.navigate(['/dashboard-mesa-uno']); 
    } else {
      // SEGUNDO ESCANEO: Estado pedido y Juegos [cite: 267, 284]
      this.router.navigate(['/dashboard-mesa-dos']);
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

  ionViewWillLeave() {
    // Si el usuario sale de la app repentinamente o vuelve atrás, destruimos instancia activa.
    this.qrScannerService.detenerEscaneo();
  }

  irAMenuEncuestas() {
    this.router.navigate(['/menu-encuestas']);
  }

}
