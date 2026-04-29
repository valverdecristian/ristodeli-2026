import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonItem, IonInput, IonButton, IonIcon, IonText, IonSpinner 
} from '@ionic/angular/standalone';
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
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonBackButton, IonItem, IonInput, IonButton, IonIcon, 
    IonText, IonSpinner, CommonModule, ReactiveFormsModule
  ]
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
    try {
      await this.notificacionService.inicializarPushNotifications();
    } catch (e) {
      console.warn('Push notifications no disponibles en web');
    }
  }

  async tomarFotografia() {
    const foto = await this.fotoService.sacarFoto();
    if (foto && foto.webPath) {
      this.fotoUrlTemporal = foto.webPath;
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
      this.toastService.mostrarError('Es obligatorio tomarse una fotografía.');
      return;
    }

    this.isSubmitting = true;
    // Iniciamos el spinner institucional
    await this.spinnerService.mostrar('Ingresando como anónimo...');

    try {
      const nombre = this.registroForm.get('nombre')?.value;
      let fotoUrlDefinitiva = null;

      // 1. Subir foto al Storage de Supabase
      if (this.fotoUrlTemporal) {
        const timestamp = new Date().getTime();
        const response = await fetch(this.fotoUrlTemporal);
        const blob = await response.blob();

        const res = await this.authService.supabaseClient.storage
          .from('avatares')
          .upload(`anonimo_${timestamp}.jpeg`, blob, {
            upsert: true,
            contentType: 'image/jpeg'
          });

        if (res.data) {
          const { data: { publicUrl } } = this.authService.supabaseClient.storage
            .from('avatares')
            .getPublicUrl(res.data.path);
          fotoUrlDefinitiva = publicUrl;
        }
      }

      // 2. Obtener Push Token
      const token = await this.notificacionService.obtenerPushToken();

      // 3. Crear el objeto para la base de datos
      const nuevoAnonimo: UsuarioAnonimo = {
        nombre: nombre,
        foto: fotoUrlDefinitiva,
        push_token: token || null
      };

      // 4. Insertar en tabla anónimos
      const { data, error } = await this.authService.supabaseClient
        .from('anonimos')
        .insert([nuevoAnonimo])
        .select('*')
        .single();

      if (error) throw error;

      // 5. Persistencia de identidad para evitar rebote del AuthGuard
      if (data) {
        localStorage.setItem('anonimo_id', data.id);
        localStorage.setItem('user_perfil', 'anonimo'); 
      }

      // 6. TIEMPO PRUDENTE: Esperamos 2 segundos para que se vea el spinner
      await new Promise(resolve => setTimeout(resolve, 2000));

      await this.spinnerService.ocultar();
      this.toastService.mostrarExito('¡Bienvenido a Ristodeli!');
      
      // 7. NAVEGACIÓN: Redirigimos al Home evitando el Login
      this.router.navigate(['/home-cliente'], { replaceUrl: true });

    } catch (error: any) {
      await this.spinnerService.ocultar();
      this.toastService.mostrarError('Error al ingresar: ' + error.message);
      console.error("Detalle técnico (posible RLS):", error);
    } finally {
      this.isSubmitting = false;
    }
  }

  get f() {
    return this.registroForm.controls;
  }
}