import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ManagementActionsComponent } from '../../../shared/components/management-actions/management-actions.component';
import { AuthService } from '../../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-supervisor',
  templateUrl: './supervisor.page.html',
  styleUrls: ['./supervisor.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, CommonModule, FormsModule, ManagementActionsComponent]
})

export class SupervisorPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    addIcons({ logOutOutline });
  }

  handleAction(action: string) {
    switch (action) {
      case 'add_employee': 
        this.router.navigate(['/admin/crear-empleado']);
        break;
      case 'add_table':   
        this.router.navigate(['/gestion-mesas']);
        break;
      case 'add_plato':   
        this.router.navigate(['/alta-producto/plato']);
        break;
      case 'add_bebida':   
        this.router.navigate(['/alta-producto/bebida']);
        break;
      case 'approve_clients': 
        this.router.navigate(['/aprobacion-clientes']);
        break;
      default:
        console.warn('Acción no permitida para Supervisor:', action);
    }
  }

  logout() {
    this.authService.cerrarSesion();
  }
}