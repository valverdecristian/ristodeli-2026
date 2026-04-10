import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule]
})
export class SplashPage implements OnInit, OnDestroy {
  private timeoutId: any;
  private audio?: HTMLAudioElement;

  constructor(private router: Router) { }

  ngOnInit() {
    // Reproduce el sonido de inicio
    this.reproducirAudio();

    // Redirige al login después de 3000ms
    this.timeoutId = setTimeout(() => {
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }, 3000);
  }

  private reproducirAudio() {
    this.audio = new Audio('assets/sounds/inicio.mp3');
    this.audio.volume = 0.5; // volumen a la mitad 
    this.audio.play().catch(error => {
      console.warn('El auto-play fue bloqueado por el navegador o no se encontró el archivo:', error);
    });
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    // Si el audio sigue sonando al cambiar de pantalla, se pausa
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
    }
  }
}
