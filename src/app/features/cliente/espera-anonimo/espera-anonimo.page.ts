import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { SpinnerService } from 'src/app/core/services/spinner.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonSpinner, IonBackButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { handRightOutline, barChartOutline, logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-espera-anonimo',
  templateUrl: './espera-anonimo.page.html',
  styleUrls: ['./espera-anonimo.page.scss'],
  standalone: true, 
  
  imports: [CommonModule,IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonSpinner, IonBackButton]
})
export class EsperaAnonimoPage {
  private router = inject(Router);
  private authService = inject(AuthService);
  private spinner = inject(SpinnerService);
  private toast = inject(ToastService);

  public solicitudEnviada: boolean = false;

  constructor() {
    addIcons({ handRightOutline, barChartOutline, logOutOutline });
  }

  async solicitarMesa() {
    
    await this.spinner.mostrar('Registrando en lista de espera...');

    const nombre = localStorage.getItem('anonimo_nombre') || 'Cliente Anónimo';
    const foto = localStorage.getItem('anonimo_foto') || '';

    const { error } = await this.authService.supabaseClient
      .from('lista_espera')
      .insert([{ 
        nombre: nombre, 
        foto: foto, 
        estado: 'pendiente', 
        tipo: 'anonimo' 
      }]);

    await this.spinner.ocultar();

    if (error) {
      
      this.toast.mostrarError('Error: ' + error.message);
    } else {
      this.solicitudEnviada = true;
      this.toast.mostrarExito('¡Solicitud enviada! El metre te asignará una mesa.');
    }
  }

  irAGrafico(tipo: string) {
    
    this.router.navigate(['/graficos-encuestas', { tipoGrafico: tipo }]);
  }
}