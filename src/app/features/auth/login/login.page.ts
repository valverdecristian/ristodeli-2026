import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonContent, IonInput, IonItem } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { BotonesAccesoRapidoComponent } from '../../../shared/components/botones-acceso-rapido/botones-acceso-rapido.component';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, ReactiveFormsModule, IonButton, IonInput, IonItem, BotonesAccesoRapidoComponent, RouterModule]
})
export class LoginPage implements OnInit {

  loginForm!: FormGroup;
  private fb = inject(FormBuilder);

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private spinnerService: SpinnerService,
  ) { }

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ionViewWillEnter() {
    this.loginForm?.reset();
  }

  get f() {
    return this.loginForm.controls;
  }

  onEmailBlur() {
    if (this.f['email'].invalid && this.f['email'].value?.length > 0) {
      this.toastService.mostrarAdvertencia('Por favor ingrese un formato de email válido.');
    }
  }

  onPasswordBlur() {
    if (this.f['password'].invalid && this.f['password'].value?.length > 0) {
      this.toastService.mostrarAdvertencia('La contraseña debe contener al menos 6 caracteres.');
    }
  }

  onCredentialsSelected(credentials: { email: string, password: string }) {
    this.loginForm.patchValue({
      email: credentials.email,
      password: credentials.password
    });
  }

  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      this.toastService.mostrarError('Por favor, revise que los datos ingresados sean correctos.');
      return;
    }
  
    const { email, password } = this.loginForm.value;
  
    try {
      await this.spinnerService.mostrar('Iniciando sesión...');
      
      
      await this.authService.ingresar(email, password);
      
      
      const perfilUsuario = await this.authService.obtenerPerfilUsuarioActual();
  
      if (!perfilUsuario) {
        throw new Error('No se pudo recuperar el perfil del usuario.');
      }

      if (perfilUsuario.perfil === 'pendiente') {
        await this.authService.supabaseClient.auth.signOut();
        await this.spinnerService.ocultar();
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
        this.toastService.mostrarAdvertencia('Tu cuenta aún está pendiente de aprobación.');
        return;
      }

      if (perfilUsuario.perfil === 'rechazado') {
        await this.authService.supabaseClient.auth.signOut();
        await this.spinnerService.ocultar();
        Haptics.vibrate().catch(() => {}); 
        this.toastService.mostrarError('Tu solicitud de acceso ha sido rechazada.');
        return;
      }
      
      
      await this.spinnerService.ocultar();
      
      const audio = new Audio('assets/sounds/exito.mp3');
      audio.play().catch(err => console.log('Error audio:', err));
  
      this.toastService.mostrarExito(`¡Bienvenido/a ${perfilUsuario.nombres}!`);
      
      
      await this.authService.redirigirSegunPerfil();
  
    } catch (e: any) {
      await this.spinnerService.ocultar();
      Haptics.vibrate().catch(() => {});
      
      console.error('Error en Login:', e);
      
      const msg = e.message?.includes('Invalid login credentials') 
        ? 'Correo o contraseña incorrectos.' 
        : 'Error de conexión. Reintente.';
        
      this.toastService.mostrarError(msg);
    }
  }
}