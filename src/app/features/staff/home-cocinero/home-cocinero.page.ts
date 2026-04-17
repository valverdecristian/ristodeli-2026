import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon 
} from '@ionic/angular/standalone';
import { ManagementActionsComponent } from '../../../shared/components/management-actions/management-actions.component';
import { AuthService } from '../../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home-cocinero',
  templateUrl: './home-cocinero.page.html',
  styleUrls: ['./home-cocinero.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonButton, IonIcon, CommonModule, FormsModule, ManagementActionsComponent
  ]
})
export class HomeCocineroPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    addIcons({ logOutOutline });
  }

  ngOnInit() {}

  handleAction(action: string) {
    console.log('Acción seleccionada:', action);
    
    switch (action) {
      case 'add_plato': 
        this.router.navigate(['/alta-producto/plato']);
        break;

      case 'add_postre': 
        this.router.navigate(['/alta-producto/postre']);
        break;

      case 'view_orders':

        this.router.navigate(['/pedidos-pendientes/cocina']);
        break;

      case 'view_menu_platos':
        this.router.navigate(['/visualizar-productos/plato']);
        break;

      case 'view_menu_postres':
        this.router.navigate(['/visualizar-productos/postre']);
        break;
        
      default:
        console.warn('Acción no programada:', action);
    }
  }

  logout() {
    this.authService.cerrarSesion();
  }
}