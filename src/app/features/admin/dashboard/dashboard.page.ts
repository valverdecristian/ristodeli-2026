import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ManagementActionsComponent } from '../../../shared/components/management-actions/management-actions.component';
import { AuthService } from '../../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, CommonModule, FormsModule, ManagementActionsComponent]
})
export class DashboardPage implements OnInit {

  constructor(private authService: AuthService, private router: Router) {
    addIcons({ logOutOutline });
  }

  ngOnInit() {
  }

  handleAction(action: string) {
    console.log('Action selected:', action);
    
    switch (action) {
      case 'add_employee':
        this.router.navigate(['/admin/crear-empleado']);
        break;
        
      case 'view_tables': 
        this.router.navigate(['/listado-mesas']);
        break;

      case 'add_table':
        this.router.navigate(['/gestion-mesas']);
        break;

      case 'approve_clients': 
        this.router.navigate(['/aprobacion-clientes']);
        break;
        
      default:
        console.warn('Acción no programada:', action);
    }
  }

  logout() {
    this.authService.cerrarSesion();
  }
}
