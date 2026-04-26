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
import { Router } from '@angular/router';

@Component({
  selector: 'app-crear-empleado',
  templateUrl: './crear-empleado.page.html',
  styleUrls: ['./crear-empleado.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, CommonModule, FormsModule, RegistroFormularioComponent]
})
export class CrearEmpleadoPage {
  
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  private fotoService = inject(FotoService);
  private router = inject(Router);

  isSubmitting = false;

  async onSubmitEmpleado(datos: DetalleRegistro) {
    this.isSubmitting = true;
    await this.spinnerService.mostrar('Registrando empleado...');

    try {
      // 1. Subir la imagen al bucket 'avatares' si es necesario (ejercicio estándar)
      if (datos.foto_url) {
        const timestamp = new Date().getTime();
        const base64Data = datos.foto_url.split(',')[1];
        const res = await this.authService.supabaseClient.storage
           .from('avatares')
           .upload(`empleado_${timestamp}.jpeg`, this.fotoService.b64toBlob(base64Data), { upsert: true, contentType: 'image/jpeg' });
           
        if (res.data) {
          const { data: { publicUrl } } = this.authService.supabaseClient.storage.from('avatares').getPublicUrl(res.data.path);
          datos.foto_url = publicUrl;
        }
      }

      // 2. Usar Auth Service para guardar sin afectar sesión actual
      await this.authService.registrarEmpleado(datos.password, datos);

      await this.spinnerService.ocultar();
      this.toastService.mostrarExito('¡Empleado creado correctamente!');
      
      // 3. Volver al home de quien lo creó (admin o supervisor)
      const currentUser = this.authService.currentUser();
      if (currentUser?.perfil === 'supervisor') {
        this.router.navigate(['/supervisor']);
      } else {
        this.router.navigate(['/admin']);
      }

    } catch (error: any) {
      await this.spinnerService.ocultar();
      this.toastService.mostrarError('Error al crear empleado: ' + error.message);
    } finally {
      this.isSubmitting = false;
    }
  }
}
