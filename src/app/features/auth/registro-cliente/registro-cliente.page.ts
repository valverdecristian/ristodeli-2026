import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { RegistroFormularioComponent } from '../../../shared/components/registro-formulario/registro-formulario.component';
import { DetalleRegistro } from 'src/app/core/models/usuario.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { SpinnerService } from 'src/app/core/services/spinner.service';
import { FotoService } from 'src/app/core/services/foto.service';
import { NotificacionService } from 'src/app/core/services/notificacion.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-cliente',
  templateUrl: './registro-cliente.page.html',
  styleUrls: ['./registro-cliente.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, CommonModule, FormsModule, RegistroFormularioComponent]
})
export class RegistroClientePage {
  
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  private fotoService = inject(FotoService);
  private notificacionService = inject(NotificacionService);
  private router = inject(Router);

  isSubmitting = false;

  async ionViewWillEnter() {
    await this.notificacionService.inicializarPushNotifications();
  }

  async onSubmitCliente(datos: DetalleRegistro) {
    this.isSubmitting = true;
    await this.spinnerService.mostrar('Creando cuenta...');

    try {
      // 1. Subir la imagen al bucket 'avatares'
      if (datos.foto_url) {
        const timestamp = new Date().getTime();
        // Camera plugin DataUrl format: data:image/jpeg;base64,...
        const base64Data = datos.foto_url.split(',')[1];
        const res = await this.authService.supabaseClient.storage
          .from('avatares')
          .upload(`cliente_${timestamp}.jpeg`, this.fotoService.b64toBlob(base64Data), { upsert: true, contentType: 'image/jpeg' });
          
        if (res.data) {
          const { data: { publicUrl } } = this.authService.supabaseClient.storage.from('avatares').getPublicUrl(res.data.path);
          datos.foto_url = publicUrl;
        }
      }

      // 2. Usar Auth Service para guardar
      await this.authService.registrar(datos.password, datos);

      await this.spinnerService.ocultar();
      this.toastService.mostrarExito('¡Cuenta creada exitosamente! Pendiente de aprobación.');
      this.router.navigate(['/login']);

    } catch (error: any) {
      await this.spinnerService.ocultar();
      this.toastService.mostrarError('Error al crear cuenta: ' + error.message);
    } finally {
      this.isSubmitting = false;
    }
  }
}
