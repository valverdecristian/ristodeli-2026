import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PedidoService, Pedido } from 'src/app/core/services/pedido.service';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-home-cocinero',
  templateUrl: './home-cocinero.page.html',
  styleUrls: ['./home-cocinero.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomeCocineroPage implements OnInit {
  pedidos: Pedido[] = []; 

  constructor(
    private pedidoService: PedidoService,
    private authService: AuthService
  ) { 
    addIcons({ logOutOutline });
  }

  ngOnInit() {
    this.cargarPedidos();
  }

  // Busca los pedidos reales en Supabase
  async cargarPedidos() {
    this.pedidos = await this.pedidoService.obtenerPedidosActivos('plato');
  }

  // Toma los pedidos 
  async tomarPedido(pedido: Pedido) {
    try {
      await this.pedidoService.cambiarEstado(pedido.id, 'En Preparación');
      pedido.estado = 'En Preparación'; // Actualizamos la vista rápido
    } catch (error) {
      console.error('Error al actualizar', error);
    }
  }

  // Pone los pedidos en listo
  async terminarPedido(pedido: Pedido) {
    try {
      await this.pedidoService.cambiarEstado(pedido.id, 'Listo');
      this.cargarPedidos(); 
    } catch (error) {
      console.error('Error al actualizar', error);
    }
  }

  // Para el cambio de colores de los pedidos dependiendo en que instancia estan
  getColorEstado(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'danger';
      case 'En Preparación': return 'warning';
      case 'Listo': return 'success';
      default: return 'medium';
    }
  }

  logout() {
    this.authService.cerrarSesion();
  }
}
