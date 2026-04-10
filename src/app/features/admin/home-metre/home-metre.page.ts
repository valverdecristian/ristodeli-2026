import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule} from '@ionic/angular';
import { MesaService } from 'src/app/core/services/mesa.service';
import { Mesa } from 'src/app/core/models/mesa.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home-metre',
  templateUrl: './home-metre.page.html',
  styleUrls: ['./home-metre.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomeMetrePage implements OnInit {
  mesas: Mesa[] = [];

  constructor(
    private mesaService: MesaService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { 
    addIcons({ logOutOutline });
  }

  ngOnInit() {
    this.cargarMesas();
  }

  // actualice cada vez que se entra a la pantalla
  ionViewWillEnter() {
    this.cargarMesas();
  }

  async cargarMesas() {
    try {
      this.mesas = await this.mesaService.obtenerMesas(); 
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al cargar mesas:', error);
    }
  }

  // El Metre puede liberar una mesa cuando los clientes se van
  async liberarMesa(mesa: Mesa) {
    if (!mesa.id) return;

    try {
      await this.mesaService.actualizarEstado(mesa.id, 'Libre');
      mesa.estado = 'Libre'; 
    } catch (error) {
      console.error('Error al liberar mesa:', error);
    }
  }

  // El Metre asigna una mesa cuando llega gente
  async ocuparMesa(mesa: Mesa) {
    if (!mesa.id) return;

    try {
      await this.mesaService.actualizarEstado(mesa.id, 'Ocupada');
      mesa.estado = 'Ocupada';
    } catch (error) {
      console.error('Error al ocupar mesa:', error);
    }
  }

  logout() {
    this.authService.cerrarSesion();
  }
}