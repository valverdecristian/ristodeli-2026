import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonGrid, IonRow, IonCol, IonCard, 
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonIcon,IonCardContent, 
} from '@ionic/angular/standalone';
import { MesaService } from '../../../core/services/mesa.service';
import { Mesa } from '../../../core/models/mesa.model';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-listado-mesas',
  templateUrl: './listado-mesas.page.html',
  styleUrls: ['./listado-mesas.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonBackButton, IonGrid, IonRow, IonCol, IonCard, 
    IonCardHeader, IonCardTitle, IonCardSubtitle, IonIcon,QRCodeComponent, 
    CommonModule,IonCardContent
  ]
})

export class ListadoMesasPage implements OnInit {
  private mesaService = inject(MesaService);
  mesas: Mesa[] = [];

  constructor() {
    addIcons({ peopleOutline });
  }

  async ngOnInit() {
    try {
      this.mesas = await this.mesaService.obtenerMesas();
    } catch (error) {
      console.error('Error al cargar mesas:', error);
    }
  }
}