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

  constructor(private router: Router) { }

  ngOnInit() {
    // Redirige al login después de 3000ms
    this.timeoutId = setTimeout(() => {
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }, 3000);
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
