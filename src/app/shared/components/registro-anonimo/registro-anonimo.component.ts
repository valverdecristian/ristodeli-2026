import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonItem, IonInput, IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { cameraOutline, alertCircleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

import { AuthService } from 'src/app/core/services/auth.service';
import { FotoService } from 'src/app/core/services/foto.service';
import { NotificacionService } from 'src/app/core/services/notificacion.service';
import { SpinnerService } from 'src/app/core/services/spinner.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UsuarioAnonimo } from 'src/app/core/models/usuario-anonimo.model';

@Component({
  selector: 'app-registro-anonimo',
  templateUrl: './registro-anonimo.component.html',
  styleUrls: ['./registro-anonimo.component.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonItem, IonInput, IonButton, IonIcon, IonText, CommonModule, ReactiveFormsModule]
})
export class RegistroAnonimoComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private fotoService = inject(FotoService);
  private notificacionService = inject(NotificacionService);
  private spinnerService = inject(SpinnerService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  registroForm: FormGroup;
  fotoUrlTemporal: string | null = null;
  isSubmitting = false;

  constructor() {
    addIcons({ cameraOutline, alertCircleOutline });
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  async ionViewWillEnter() {
    await this.notificacionService.inicializarPushNotifications();
  }

  async tomarFotografia() {
    const foto = await this.fotoService.sacarFoto();
    if (foto && foto.dataUrl) {
      this.fotoUrlTemporal = foto.dataUrl;
      this.cdr.detectChanges();
    }
  }

  async registrarAnonimo() {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      this.toastService.mostrarError('Por favor ingrese un nombre válido.');
      return;
    }

    if (!this.fotoUrlTemporal) {
      this.toastService.mostrarError('Es obligatorio tomarse una fotografía para entrar como anónimo.');
      return;
    }

    this.isSubmitting = true;
    await this.spinnerService.mostrar('Ingresando como anónimo...');

    try {
      const nombre = this.registroForm.get('nombre')?.value;
      let fotoUrlDefinitiva = null;

      // 1. Subir foto al Storage
      if (this.fotoUrlTemporal) {
        const timestamp = new Date().getTime();
        const base64Data = this.fotoUrlTemporal.split(',')[1];
        const res = await this.authService.supabaseClient.storage
          .from('avatares')
          .upload(`anonimo_${timestamp}.jpeg`, this.fotoService.b64toBlob(base64Data), { upsert: true, contentType: 'image/jpeg' });
          
        if (res.data) {
          const { data: { publicUrl } } = this.authService.supabaseClient.storage.from('avatares').getPublicUrl(res.data.path);
          fotoUrlDefinitiva = publicUrl;
        }
      }

      // 2. Obtener Push Token del dispositivo
      const token = await this.notificacionService.obtenerPushToken();

      // 3. Crear el objeto
      const nuevoAnonimo: UsuarioAnonimo = {
        nombre: nombre,
        foto: fotoUrlDefinitiva,
        push_token: token || null
      };

      // 4. Insertar en tabla anónimos directamente
      const { data, error } = await this.authService.supabaseClient
        .from('anonimos')
        .insert([nuevoAnonimo])
        .select('*')
        .single();

      if (error) throw error;

      await this.spinnerService.ocultar();
      this.toastService.mostrarExito('¡Bienvenido a Ristodeli!');
      
      // Puedes guardar en localStorage el id del anónimo si lo necesitas para la sesión
      if (data) {
        localStorage.setItem('anonimo_id', data.id);
      }

      this.router.navigate(['/home-cliente']); // o la ruta para el anónimo

    } catch (error: any) {
      await this.spinnerService.ocultar();
      this.toastService.mostrarError('Error al ingresar: ' + error.message);
    } finally {
      this.isSubmitting = false;
    }
  }

  get f() {
    return this.registroForm.controls;
  }
}
