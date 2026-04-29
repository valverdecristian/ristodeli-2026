import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonCard, IonCardHeader, 
  IonIcon, IonCardContent, IonModal, IonButton 
} from '@ionic/angular/standalone';
import { MesaService } from '../../../core/services/mesa.service';
import { Mesa } from '../../../core/models/mesa.model';
import { addIcons } from 'ionicons';
import { peopleOutline, qrCodeOutline, chevronForwardOutline,closeOutline, informationCircleOutline } from 'ionicons/icons';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-listado-mesas',
  templateUrl: './listado-mesas.page.html',
  styleUrls: ['./listado-mesas.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonBackButton, IonCard, IonCardHeader,  
    IonIcon, IonCardContent, IonModal, IonButton,
    QRCodeComponent, CommonModule
  ]
})
export class ListadoMesasPage implements OnInit {
  private mesaService = inject(MesaService);
  
  public mesas: Mesa[] = [];
  public isModalOpen: boolean = false;
  public mesaSeleccionada: Mesa | null = null;

  constructor() {
    // Registramos todos los íconos necesarios para la nueva UI
    addIcons({ peopleOutline, qrCodeOutline, chevronForwardOutline,closeOutline, informationCircleOutline});
  }

  async ngOnInit() {
    try {
      this.mesas = await this.mesaService.obtenerMesas();
    } catch (error) {
      console.error('Error al cargar mesas:', error);
    }
  }

  /**
   * Abre el modal y asigna la mesa para generar el QR específico
   */
  abrirModalQR(mesa: Mesa) {
    this.mesaSeleccionada = mesa;
    this.isModalOpen = true;
  }

  /**
   * Cierra el modal y limpia la selección
   */
  cerrarModal() {
    this.isModalOpen = false;
    this.mesaSeleccionada = null;
  }
}