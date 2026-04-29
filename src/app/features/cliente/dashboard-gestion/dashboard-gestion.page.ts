import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonButton, IonIcon 
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  restaurantOutline, fastFoodOutline, chatbubbleEllipsesOutline, 
  cashOutline, arrowBackOutline, gameControllerOutline 
} from 'ionicons/icons';

import { SpinnerService } from 'src/app/core/services/spinner.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-dashboard-gestion',
  templateUrl: './dashboard-gestion.page.html',
  styleUrls: ['./dashboard-gestion.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonButton, IonIcon, CommonModule, FormsModule
  ]
})
export class DashboardGestionPage implements OnInit {
  private router = inject(Router);
  private spinner = inject(SpinnerService);
  private toastService = inject(ToastService);

  constructor() {
    addIcons({restaurantOutline,fastFoodOutline,chatbubbleEllipsesOutline,cashOutline, arrowBackOutline,
              gameControllerOutline});
  }

  ngOnInit() {}

  /**
   * Función para el botón de volver en el header
   * Redirige según si ya se realizó un pedido
   */
  configurarSalida() {
    const yaHizoPedido = localStorage.getItem('yaHizoPedido') === 'true';

    if (yaHizoPedido) {
      this.router.navigate(['/dashboard-recreativo']);
    } else {
      this.router.navigate(['/home-cliente']);
    }
  }

  /**
   * Acción para el botón de consultar mozo
   */
  async consultarMozo() {
    await this.spinner.mostrar('Llamando al mozo...');
    setTimeout(async () => {
      await this.spinner.ocultar();
      this.toastService.mostrarExito('El mozo ha sido notificado.');
    }, 1500);
  }

  async realizarPedido() {
    await this.spinner.mostrar('Enviando pedido a cocina...');
    try {
      // Al realizar el pedido, activamos la navegación condicional
      localStorage.setItem('yaHizoPedido', 'true');
      
      // Notificamos al mozo para confirmación [cite: 264]
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.spinner.ocultar();
      this.toastService.mostrarExito('¡Pedido enviado! Por favor espere la confirmación del mozo.');
      
      // Volvemos al home, desde donde re-escaneará para ir al recreativo [cite: 267]
      this.router.navigate(['/home-cliente']);
    } catch (error) {
      await this.spinner.ocultar();
      this.toastService.mostrarError('Error al procesar el pedido.');
    }
  }

  irAMenu() {
    this.router.navigate(['/visualizar-productos']);
  }

  solicitarCuenta() {
    this.router.navigate(['/solicitar-cuenta']);
  }
}