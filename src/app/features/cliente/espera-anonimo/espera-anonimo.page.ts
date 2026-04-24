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

  public idSolicitud: string | null = null;
  public solicitudEnviada: boolean = false;

  constructor() {
    addIcons({ handRightOutline, barChartOutline, logOutOutline });
  }

  async solicitarMesa() {
    await this.spinner.mostrar('Registrando en lista de espera...');

    let nombre = 'Cliente';
    let foto = '';
    let clienteId: string | null = null;
    let tipo = 'anonimo';

    const perfil = await this.authService.obtenerPerfilUsuarioActual();
    
    if (perfil) {
      nombre = perfil.nombres;
      if ((perfil as any).apellidos) {
        nombre += ' ' + (perfil as any).apellidos;
      }
      foto = perfil.foto_url || '';
      clienteId = perfil.id || null;
      tipo = perfil.perfil === 'anonimo' ? 'anonimo' : 'registrado';
    }

    if (!clienteId) {
      await this.spinner.ocultar();
      this.toast.mostrarError('No se pudo identificar al usuario.');
      return;
    }

    // Insertamos la solicitud vinculando el cliente_id para el flujo Gamma
    const { data, error } = await this.authService.supabaseClient
      .from('lista_espera')
      .insert([{ 
        nombre: nombre, 
        foto: foto, 
        estado: 'pendiente', 
        tipo: tipo,
        cliente_id: clienteId
      }])
      .select();

    await this.spinner.ocultar();

    if (error) {
      this.toast.mostrarError('Error: ' + error.message);
    } else {
      if (data && data.length > 0) {
        this.idSolicitud = data[0].id;
      }
      this.solicitudEnviada = true;
      this.toast.mostrarExito('¡Solicitud enviada! El metre te asignará una mesa.');
      
      // Invocamos la Push Notification al Metre
      this.authService.supabaseClient.functions.invoke('notify-metre', {
        body: { nombreCliente: nombre }
      }).catch(err => console.error('Error al invocar push al metre:', err));
    }
  }

  irAGrafico(tipo: string) {
    this.router.navigate(['/graficos-encuestas', { tipoGrafico: tipo }]);
  }

  irAMenuEncuestas() {
    this.router.navigate(['/menu-encuestas']);
  }
}