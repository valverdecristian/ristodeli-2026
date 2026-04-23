import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonButton, IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { restaurantOutline, barChartOutline, chatbubblesOutline } from 'ionicons/icons';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-dashboard-gestion',
  templateUrl: './dashboard-gestion.page.html',
  styleUrls: ['./dashboard-gestion.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, IonIcon, CommonModule]
})
export class DashboardGestionPage {
  private router = inject(Router);
  private toastService = inject(ToastService);

  constructor() {
    addIcons({ restaurantOutline, barChartOutline, chatbubblesOutline });
  }

  irAMenu() {
    this.router.navigate(['/visualizar-productos/comida']);
  }

  irAEncuestas() {
    this.router.navigate(['/menu-encuestas']);
  }

  consultarMozo() {
    this.toastService.mostrarExito('Notificación enviada: El mozo se acercará a su mesa en breve.');
  }
}
