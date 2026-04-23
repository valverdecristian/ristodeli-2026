import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { SpinnerService } from 'src/app/core/services/spinner.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonButton, IonIcon, IonSpinner, IonBackButton 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { handRightOutline, barChartOutline, logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-espera-anonimo',
  templateUrl: './espera-anonimo.page.html',
  styleUrls: ['./espera-anonimo.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonButton, IonIcon, IonSpinner, IonBackButton
  ]
})
export class EsperaAnonimoPage {
  private router = inject(Router);
  private authService = inject(AuthService);
  private spinner = inject(SpinnerService);
  private toast = inject(ToastService);

<<<<<<< Updated upstream
=======
  public idSolicitud: string | null = null;
>>>>>>> Stashed changes
  public solicitudEnviada: boolean = false;

  constructor() {
    addIcons({ handRightOutline, barChartOutline, logOutOutline });
  }

  async solicitarMesa() {
    
    await this.spinner.mostrar('Registrando en lista de espera...');

<<<<<<< Updated upstream
    const nombre = localStorage.getItem('anonimo_nombre') || 'Cliente Anónimo';
    const foto = localStorage.getItem('anonimo_foto') || '';

    const { error } = await this.authService.supabaseClient
=======
    let nombre = 'Cliente Anónimo';
    let foto = '';
    const anonimoId = localStorage.getItem('anonimo_id');
    
    if (anonimoId) {
      const { data: dataAnon } = await this.authService.supabaseClient
        .from('anonimos')
        .select('nombre, foto')
        .eq('id', anonimoId)
        .single();
        
      if (dataAnon) {
        nombre = dataAnon.nombre || nombre;
        foto = dataAnon.foto || foto;
      }
    }

    // Insertamos la solicitud y obtenemos el ID generado para el seguimiento
    const { data, error } = await this.authService.supabaseClient
>>>>>>> Stashed changes
      .from('lista_espera')
      .insert([{ 
        nombre: nombre, 
        foto: foto, 
        estado: 'pendiente', 
<<<<<<< Updated upstream
        tipo: 'anonimo' 
      }]);
=======
        tipo: 'anonimo',
        cliente_id: anonimoId
      }])
      .select();
>>>>>>> Stashed changes

    await this.spinner.ocultar();

    if (error) {
<<<<<<< Updated upstream
      
      this.toast.mostrarError('Error: ' + error.message);
    } else {
=======
      await this.vibrar(); 
      this.toast.mostrarError('Error: ' + error.message);
    } else {
      if (data && data.length > 0) {
        this.idSolicitud = data[0].id;
      }
>>>>>>> Stashed changes
      this.solicitudEnviada = true;
      this.toast.mostrarExito('¡Solicitud enviada! El metre te asignará una mesa.');
      
      // Invocamos la Push Notification al Metre (Nueva funcionalidad)
      this.authService.supabaseClient.functions.invoke('notify-metre', {
        body: { nombreCliente: nombre }
      }).catch(err => console.error('Error al invocar push al metre:', err));
    }
  }

  irAGrafico(tipo: string) {
    
    this.router.navigate(['/graficos-encuestas', { tipoGrafico: tipo }]);
  }
}