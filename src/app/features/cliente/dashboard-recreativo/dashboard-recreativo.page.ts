import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
        IonBackButton, IonButton, IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gameControllerOutline, timeOutline, starOutline, cashOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { ToastService } from 'src/app/core/services/toast.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { SpinnerService } from 'src/app/core/services/spinner.service';

@Component({
  selector: 'app-dashboard-recreativo',
  templateUrl: './dashboard-recreativo.page.html',
  styleUrls: ['./dashboard-recreativo.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, IonIcon, CommonModule]
})
export class DashboardRecreativoPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private spinner = inject(SpinnerService);

  public pedidoEntregado: boolean = false;
  private subscription: any;

  constructor() {
    addIcons({ 
      gameControllerOutline, timeOutline, starOutline, 
      cashOutline, checkmarkCircleOutline 
    });
  }

  ngOnInit() {
    this.escucharEstadoPedido();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.authService.supabaseClient.removeChannel(this.subscription);
    }
  }

  /**
   * Suscripción en tiempo real con sintaxis de acceso por índice
   */
  escucharEstadoPedido() {
    const anonimoId = localStorage.getItem('anonimo_id');
    const user = this.authService.currentUser();
    const clienteId = anonimoId || user?.id;

    if (!clienteId) return;

    this.subscription = this.authService.supabaseClient
      .channel('estado-pedido-recreativo')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'pedidos',
        filter: `cliente_id=eq.${clienteId}` 
      }, (payload: any) => {
        const nuevoEstado = payload.new['estado'];
        const confirmado = payload.new['confirmado_cliente'];

        if (nuevoEstado === 'entregado' || confirmado === true) {
          this.pedidoEntregado = true;
          this.toastService.mostrarExito('¡Buen provecho! Su pedido ha sido entregado.');
        }
      })
      .subscribe();
  }

  verEstadoPedido() {
    this.toastService.mostrarExito('Consultando con la cocina... Su pedido está en camino.');
  }

  irAJuegos() {
    this.router.navigate(['/juegos']);
  }

  irAEncuesta() {
    this.router.navigate(['/encuesta-satisfaccion']); 
  }

  async solicitarCuenta() {
    await this.spinner.mostrar('Notificando al mozo...');
    
    setTimeout(async () => {
      await this.spinner.ocultar();
      this.toastService.mostrarExito('El mozo ya ha sido notificado para traer la cuenta.');
      this.router.navigate(['/pago-cuenta']); 
    }, 2000);
  }
}