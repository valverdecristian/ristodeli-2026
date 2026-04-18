import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonGrid, IonRow, IonCol, IonCard, 
  IonCardHeader, IonCardTitle,IonCardSubtitle,
  IonIcon
} from '@ionic/angular/standalone';
import { MesaService } from '../../../core/services/mesa.service';
import { Mesa } from '../../../core/models/mesa.model';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-estado-mesas',
  templateUrl: './estado-mesas.page.html',
  styleUrls: ['./estado-mesas.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonBackButton, IonGrid, IonRow, IonCol, IonCard, 
    IonCardHeader, IonCardTitle, CommonModule,
    IonCardSubtitle,IonIcon
  ]
})
export class EstadoMesasPage implements OnInit {
  private mesaService = inject(MesaService);
  private cdr = inject(ChangeDetectorRef);
  mesas: Mesa[] = [];

  constructor() {
    addIcons({ peopleOutline });
  }

  async ngOnInit() {
    await this.cargarMesas();
  }

  async cargarMesas() {
    try {
      this.mesas = await this.mesaService.obtenerMesas();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al cargar mesas:', error);
    }
  }

  async toggleEstado(mesa: Mesa) {
    if (!mesa.id) return;
    const nuevoEstado = mesa.estado === 'Ocupada' ? 'Libre' : 'Ocupada';
    
    try {
      // 1. Mandamos a la DB
      await this.mesaService.actualizarEstado(mesa.id, nuevoEstado);
      
      // 2. Actualizamos el objeto local
      mesa.estado = nuevoEstado; 
      
      // 3. ¡Obligamos a la pantalla a refrescarse!
      this.cdr.detectChanges(); 
      
      console.log('Nuevo estado:', mesa.estado);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}