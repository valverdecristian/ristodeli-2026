import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { BotonesAccesoRapidoComponent } from '../../../shared/components/botones-acceso-rapido/botones-acceso-rapido.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonButton, IonInput, IonItem, BotonesAccesoRapidoComponent]
})
export class LoginPage implements OnInit {

  email: string = '';
  password: string = '';
  
  isEmailValid: boolean = true;
  isPasswordValid: boolean = true;

  constructor(
    private router: Router, 
    private authService: AuthService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color: 'danger',
      position: 'top',
      icon: 'alert-circle-outline'
    });
    toast.present();
  }

  checkEmailVal() {
    if (this.email.length === 0) {
      this.isEmailValid = true;
      return;
    }
    this.isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  checkPasswordVal() {
    if (this.password.length === 0) {
      this.isPasswordValid = true;
      return;
    }
    this.isPasswordValid = this.password.length >= 6;
  }

  onEmailBlur() {
    this.checkEmailVal();
    if (!this.isEmailValid && this.email.length > 0) {
      this.presentToast('Por favor ingrese un formato de email válido.');
    }
  }

  onPasswordBlur() {
    this.checkPasswordVal();
    if (!this.isPasswordValid && this.password.length > 0) {
      this.presentToast('La contraseña debe contener al menos 6 caracteres.');
    }
  }

  onCredentialsSelected(credentials: { email: string, password: string }) {
    this.email = credentials.email;
    this.password = credentials.password;
    this.checkEmailVal();
    this.checkPasswordVal();
  }

  async login() {
    this.checkEmailVal();
    this.checkPasswordVal();
    
    if (!this.isEmailValid || !this.isPasswordValid || !this.email || !this.password) {
      this.presentToast('Por favor, revise que los datos ingresados sean correctos.');
      return;
    }

    try {
      await this.authService.ingresar(this.email, this.password);
      await this.authService.redirigirSegunPerfil();
    } catch (e: any) {
      console.error('Credenciales inválidas o error de red:', e);
      this.presentToast('Credenciales inválidas. Intente nuevamente.');
    }
  }
}
