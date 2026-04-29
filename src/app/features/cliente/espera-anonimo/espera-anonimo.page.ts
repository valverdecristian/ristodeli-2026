import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { SpinnerService } from 'src/app/core/services/spinner.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonButton, IonIcon, IonBackButton 
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
    IonButtons, IonButton, IonIcon,  IonBackButton
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
    // 1. Iniciamos el spinner institucional
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

    // 2. Realizamos la inserción en Supabase
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

    if (error) {
      await this.spinner.ocultar();
      this.toast.mostrarError('Error: ' + error.message);
      return;
    }

    // 3. TIEMPO PRUDENTE: Esperamos 2.5 segundos para que se vea la transición
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 4. Cerramos spinner y navegamos al home
    await this.spinner.ocultar();
    
    this.toast.mostrarExito('¡Solicitud enviada! El metre te asignará una mesa.');
    
    // Notificación en segundo plano
    this.authService.supabaseClient.functions.invoke('notify-metre', {
      body: { nombreCliente: nombre }
    }).catch(err => console.error('Error al invocar push al metre:', err));

    // Redirección final
    this.router.navigate(['/home-cliente']);
  }

  irAGrafico(tipo: string) {
    this.router.navigate(['/graficos-encuestas', { tipoGrafico: tipo }]);
  }

  irAMenuEncuestas() {
    this.router.navigate(['/menu-encuestas']);
  }
}