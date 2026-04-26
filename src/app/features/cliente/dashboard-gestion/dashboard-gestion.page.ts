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
import { AuthService } from 'src/app/core/services/auth.service';
import { RealtimeService } from 'src/app/core/services/realtime.service';
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
  private authService = inject(AuthService);
  private realtime = inject(RealtimeService);

  constructor() {
    addIcons({ restaurantOutline, barChartOutline, chatbubblesOutline });
  }

  irAMenu() {
    this.router.navigate(['/visualizar-productos/todos']);
  }

  irAEncuestas() {
    this.router.navigate(['/menu-encuestas']);
  }

  async consultarMozo() {
    const anonimoId = localStorage.getItem('anonimo_id');
    const user = this.authService.currentUser();
    const clienteId = anonimoId || user?.id;

    if (!clienteId) {
      this.toastService.mostrarError('Error de autenticación.');
      return;
    }

    // Buscamos la mesa asignada del cliente
    const { data: solicitud, error } = await this.authService.supabaseClient
      .from('lista_espera')
      .select('mesa_asignada')
      .eq('cliente_id', clienteId)
      .eq('estado', 'asignado')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !solicitud || !solicitud.mesa_asignada) {
      this.toastService.mostrarError('No tienes una mesa asignada.');
      return;
    }

    // Extraemos el número de la mesa si viene como 'MESA_1'
    const mesaId = solicitud.mesa_asignada.startsWith('MESA_') 
      ? solicitud.mesa_asignada.replace('MESA_', '') 
      : solicitud.mesa_asignada;

    // Enviamos el mensaje al mozo
    const result = await this.realtime.crearMensaje(mesaId, 'Por favor, necesitamos asistencia en la mesa.');
    
    if (!result.error) {
      this.toastService.mostrarExito('Notificación enviada: El mozo se acercará a su mesa en breve.');
    } else {
      this.toastService.mostrarError('Error al notificar al mozo.');
    }
  }
}
