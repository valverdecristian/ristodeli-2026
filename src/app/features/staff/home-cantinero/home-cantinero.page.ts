import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PedidoService, Pedido } from 'src/app/core/services/pedido.service';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-home-cantinero',
  templateUrl: './home-cantinero.page.html',
  styleUrls: ['./home-cantinero.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomeCantineroPage implements OnInit {
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

  async cargarPedidos() {
    // Solo las bebidas
    this.pedidos = await this.pedidoService.obtenerPedidosActivos('bebida');
  }

  async tomarPedido(pedido: Pedido) {
    try {
      await this.pedidoService.cambiarEstado(pedido.id, 'En Preparación');
      pedido.estado = 'En Preparación';
    } catch (error) {
      console.error('Error al actualizar', error);
    }
  }

  async terminarPedido(pedido: Pedido) {
    try {
      await this.pedidoService.cambiarEstado(pedido.id, 'Listo');
      this.cargarPedidos(); 
    } catch (error) {
      console.error('Error al actualizar', error);
    }
  }

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
