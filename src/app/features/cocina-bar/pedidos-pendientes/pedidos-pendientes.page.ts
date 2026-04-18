import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonIcon, IonBadge, IonSpinner,IonRow, IonCol
} from '@ionic/angular/standalone';
import { PedidoService, Pedido } from '../../../core/services/pedido.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { addIcons } from 'ionicons';
import { restaurantOutline, gridOutline, timeOutline } from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pedidos-pendientes',
  templateUrl: './pedidos-pendientes.page.html',
  styleUrls: ['./pedidos-pendientes.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, 
    IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonBadge, IonSpinner,
    IonRow,IonCol
  ]
})
export class PedidosPendientesPage implements OnInit {
  private pedidoService = inject(PedidoService);
  private route = inject(ActivatedRoute);  
  pedidosAgrupados: any[] = [];
  cargando = true;
  sector: string = '';

  constructor() {
    addIcons({ restaurantOutline, gridOutline, timeOutline });
  }

  ngOnInit() {
    this.sector = this.route.snapshot.paramMap.get('sector') || 'cocina';
    this.cargarPedidos();
  }

  async cargarPedidos() {
    this.cargando = true;
    try {
      const sectoresBusqueda = this.sector === 'bar' 
        ? ['bebida'] 
        : ['plato', 'postre'];

      const data = await this.pedidoService.obtenerPedidosPorSectores(sectoresBusqueda);
      this.agruparPedidosPorMesa(data);
    } finally {
      this.cargando = false;
    }
  }

  agruparPedidosPorMesa(pedidos: Pedido[]) {
    const grupos = pedidos.reduce((acc: any, pedido) => {
      const mesa = pedido.mesa_numero;
      if (!acc[mesa]) acc[mesa] = [];
      acc[mesa].push(pedido);
      return acc;
    }, {});

    this.pedidosAgrupados = Object.keys(grupos).map(mesa => ({
      mesa_numero: mesa,
      items: grupos[mesa]
    }));
  }

  async cambiarEstado(pedido: Pedido, nuevoEstado: string) {
    try {
      const estadoFinal = nuevoEstado === 'En Preparación' ? 'En Preparacion' : nuevoEstado;
      
      await this.pedidoService.actualizarEstado(pedido.id, estadoFinal);
      
      await this.cargarPedidos(); 
    } catch (error) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  }

  getEstadoColor(estado: string) {
    switch (estado) {
      case 'En Preparacion': return 'warning';
      case 'Listo': return 'success';
      default: return 'medium';
    }
  }
}
