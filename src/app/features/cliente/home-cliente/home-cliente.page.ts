import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonButton, IonIcon 
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/core/services/auth.service';
import { ScannerService } from 'src/app/core/services/scanner.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { SpinnerService } from 'src/app/core/services/spinner.service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { NotificacionService } from 'src/app/core/services/notificacion.service';
import { BotonConsultaMozoComponent } from '../../../shared/components/boton-consulta-mozo/boton-consulta-mozo.component';
import { addIcons } from 'ionicons';
import { logOutOutline, restaurantOutline, barChartOutline, qrCodeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home-cliente',
  templateUrl: './home-cliente.page.html',
  styleUrls: ['./home-cliente.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, CommonModule, FormsModule, BotonConsultaMozoComponent]
})
export class HomeClientePage implements OnInit {
  private authService = inject(AuthService);
  private scanner = inject(ScannerService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private spinner = inject(SpinnerService);

  public nombreCliente: string = '';

  constructor() {
    addIcons({ logOutOutline, restaurantOutline, barChartOutline, qrCodeOutline });
  }

  async ngOnInit() {
    // Usamos el método que SI existe en tu auth.service.ts
    const perfil = await this.authService.obtenerPerfilUsuarioActual();
    this.nombreCliente = perfil?.nombres || 'Cliente';
  }

  async escanearQr() {
    // Como tu ScannerService no tiene .scan(), usamos el plugin directamente
    // o podés agregar el método .scan() a tu servicio después.
    const { barcodes } = await BarcodeScanner.scan();
    
    if (barcodes.length > 0) {
      const data = barcodes[0].displayValue;
      await this.manejarEscaneo(data);
    }
  }

  private async manejarEscaneo(data: string) {
    await this.spinner.mostrar('Validando código...');
    
    if (data === 'RISTODELI_ENTRADA') {
      this.router.navigate(['/espera-anonimo']);
    } else if (data.startsWith('MESA_')) {
      await this.validarAccesoMesa(data);
    } else {
      this.toast.mostrarError('Código QR no reconocido');
    }
    
    await this.spinner.ocultar();
  }

  private async validarAccesoMesa(mesaCodigo: string) {
    const perfil = await this.authService.obtenerPerfilUsuarioActual();
    const clienteId = perfil?.id;

    if (!clienteId) {
      this.toast.mostrarError('No se pudo identificar al usuario.');
      return;
    }

    const { data: solicitud } = await this.authService.supabaseClient
      .from('lista_espera')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('mesa_asignada', mesaCodigo)
      .single();

    if (solicitud) {
      if (!solicitud.qr_mesa_escaneado) {
        await this.authService.supabaseClient
          .from('lista_espera')
          .update({ qr_mesa_escaneado: true })
          .eq('id', solicitud.id);
        this.router.navigate(['/dashboard-gestion']);
      } else {
        this.router.navigate(['/dashboard-recreativo']);
      }
    } else {
      this.toast.mostrarError('Esta no es la mesa que tenés asignada.');
    }
  }

  irAMenuEncuestas() {
    this.router.navigate(['/menu-encuestas']);
  }

  async cerrarSesion() {
    // Usamos el método que SI existe en tu auth.service.ts
    await this.authService.cerrarSesion();
  }
}