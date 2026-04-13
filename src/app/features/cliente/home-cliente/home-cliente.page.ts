import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { addIcons } from 'ionicons';
import { logOutOutline, restaurantOutline, barChartOutline, qrCodeOutline } from 'ionicons/icons';

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
  }

  async cerrarSesion() {
    await this.spinnerService.mostrar('Cerrando sesión...');
    await this.authService.cerrarSesion();
    await this.spinnerService.ocultar();
  }

}
