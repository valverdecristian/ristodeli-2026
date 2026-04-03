import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonButton, IonInput,IonItem]
})

export class LoginPage implements OnInit {
  
  email: String = '';
  password: String = ''

  constructor(private router: Router) {}

  ngOnInit() {
  } //verificar si hay una sesion iniciada

  login() {
    console.log('Email:', this.email);
    console.log('Password:', this.password);
    this.router.navigate(['/home']);
  }
}
