import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonBackButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { statsChartOutline, pieChartOutline, apertureOutline } from 'ionicons/icons';

@Component({
  selector: 'app-menu-encuestas',
  templateUrl: './menu-encuestas.page.html',
  styleUrls: ['./menu-encuestas.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonBackButton]
})
export class MenuEncuestasPage {
  private router = inject(Router);

  constructor() {
    addIcons({ statsChartOutline, pieChartOutline, apertureOutline });
  }

  navegarAGrafico(tipo: string) {
    this.router.navigate(['/graficos-encuestas'], { 
      queryParams: { tipo: tipo } 
    });
  }
}