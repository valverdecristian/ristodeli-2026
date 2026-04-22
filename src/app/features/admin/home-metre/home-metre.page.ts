import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  logOutOutline, 
  gridOutline, 
  imagesOutline, 
  restaurantOutline, 
  personAddOutline, 
  listOutline 
} from 'ionicons/icons';
import { ManagementActionsComponent } from 'src/app/shared/components/management-actions/management-actions.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-home-metre',
  templateUrl: './home-metre.page.html',
  styleUrls: ['./home-metre.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonButton, IonIcon, CommonModule, ManagementActionsComponent
  ]
})
export class HomeMetrePage { 
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  constructor() {
    addIcons({ 
      logOutOutline, 
      gridOutline, 
      imagesOutline, 
      restaurantOutline, 
      personAddOutline, 
      listOutline 
    });
  }

  handleAction(action: string) {
    switch (action) {
      case 'view_tables':
        this.router.navigate(['/listado-mesas']); 
        break;
      case 'manage_status':
        this.router.navigate(['/estado-mesas']); 
        break;
      case 'view_waiting_list':
        this.router.navigate(['/lista-espera']);
        break;
      case 'register_client':
        this.router.navigate(['/registro-cliente']);
        break;
      default:
        console.warn('Acción no reconocida:', action);
    }
  }

  logout() {
    this.authService.cerrarSesion(); 
  }
}