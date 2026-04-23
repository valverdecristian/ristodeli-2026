import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';
import { ManagementActionsComponent } from '../../../shared/components/management-actions/management-actions.component';
import { Router } from '@angular/router';
import { RealtimeService } from 'src/app/core/services/realtime.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-home-mozo',
  templateUrl: './home-mozo.page.html',
  styleUrls: ['./home-mozo.page.scss'],
  standalone: true,
  imports: [IonicModule,CommonModule, FormsModule, ManagementActionsComponent]
})
export class HomeMozoPage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private realtimeService = inject(RealtimeService);
  private toastService = inject(ToastService);
  
  private chatSub: any;

  constructor() { 
    addIcons({ logOutOutline });
  }

  ngOnInit() {
    this.escucharNuevosChats();
  }

  escucharNuevosChats() {
    this.chatSub = this.realtimeService.client
      .channel('notif-mozo')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultas' }, (payload) => {
        const currentUser = this.authService.currentUser();
        
        // Solo notificar si el mensaje NO fue enviado por el propio mozo
        if (payload.new['id_registrado'] !== currentUser?.id) {
          const mesa = payload.new['mesa_id'];
          const mensaje = payload.new['mensaje'];
          
          this.toastService.mostrarAdvertencia(`Mesa ${mesa}: ${mensaje}`, 4000);
          
          try {
            // Reproducir un sonido sutil (puedes cambiarlo a otro archivo si tenés uno de notificación)
            const audio = new Audio('assets/sounds/inicio.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Auto-play bloqueado para el sonido'));
          } catch(e) {}
        }
      })
      .subscribe();
  }

  ngOnDestroy() {
    if (this.chatSub) {
      this.chatSub.unsubscribe();
    }
  }

  logout() {
    this.authService.cerrarSesion();
  }

  onAction(action: string) {
    if (action === 'view_consultas') {
      this.router.navigate(['/consultas']);
    }
  }
}
