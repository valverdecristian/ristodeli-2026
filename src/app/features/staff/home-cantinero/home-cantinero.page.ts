import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon 
} from '@ionic/angular/standalone';
import { ManagementActionsComponent } from '../../../shared/components/management-actions/management-actions.component';
import { AuthService } from '../../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { logOutOutline} from 'ionicons/icons';

@Component({
  selector: 'app-home-cantinero',
  templateUrl: './home-cantinero.page.html',
  styleUrls: ['./home-cantinero.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonButton, IonIcon, CommonModule, ManagementActionsComponent,
  ]
})
export class HomeCantineroPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    addIcons({ logOutOutline });
  }

  handleAction(action: string) {
    switch (action) {
      case 'add_bebida': 
        this.router.navigate(['/alta-producto/bebida']);
        break;

      case 'view_orders_bar':
        this.router.navigate(['/pedidos-pendientes/bar']);
        break;

      case 'view_menu_bebidas':
        this.router.navigate(['/visualizar-productos/bebida']);
        break;
        
      default:
        console.warn('Acción no programada:', action);
    }
  }

  logout() {
    this.authService.cerrarSesion();
  }
}