import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonButton, IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gameControllerOutline, timeOutline } from 'ionicons/icons';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-dashboard-recreativo',
  templateUrl: './dashboard-recreativo.page.html',
  styleUrls: ['./dashboard-recreativo.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, IonIcon, CommonModule]
})
export class DashboardRecreativoPage {
  private router = inject(Router);
  private toastService = inject(ToastService);

  constructor() {
    addIcons({ gameControllerOutline, timeOutline });
  }

  verEstadoPedido() {
    this.toastService.mostrarExito('Consultando estado del pedido con la cocina...');
  }

  irAJuegos() {
    this.toastService.mostrarExito('Iniciando sección de juegos...');
  }
}