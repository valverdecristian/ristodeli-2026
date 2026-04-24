import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonCard,
  IonBackButton, IonIcon, IonButton, IonItem, IonLabel, IonList
} from '@ionic/angular/standalone';
import { CarritoService, ItemCarrito } from 'src/app/core/services/carrito.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { addIcons } from 'ionicons';
import { trashOutline, checkmarkCircleOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-resumen-carrito',
  templateUrl: './resumen-carrito.page.html',
  styleUrls: ['./resumen-carrito.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonBackButton, IonIcon, IonButton, IonItem, IonLabel, IonList, CommonModule, IonCard
  ]
})
export class ResumenCarritoPage implements OnInit {
  private carritoService = inject(CarritoService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  items: ItemCarrito[] = [];
  total: number = 0;
  tiempoTotal: number = 0;
  procesando: boolean = false;

  constructor() {
    addIcons({ trashOutline, checkmarkCircleOutline, timeOutline });
  }

  ngOnInit() {
    this.carritoService.items$.subscribe(items => {
      this.items = items;
      this.total = this.carritoService.obtenerTotal();
      this.tiempoTotal = this.calcularTiempoTotal(items);
    });
  }

  calcularTiempoTotal(items: ItemCarrito[]): number {
    if (items.length === 0) return 0;
    // El tiempo estimado de un pedido suele ser el del producto que más tarda en prepararse.
    return Math.max(...items.map(i => i.producto.tiempo_elaboracion || 0));
  }

  eliminarItem(productoId: string) {
    const items = this.carritoService.getItems().filter(i => i.producto.id !== productoId);
    // Vaciar y re-agregar para actualizar
    this.carritoService.vaciarCarrito();
    items.forEach(i => this.carritoService.agregarItem(i.producto, i.cantidad));
  }

  async confirmarPedido() {
    if (this.items.length === 0) return;
    this.procesando = true;

    try {
      const supabase = this.authService.supabaseClient;
      
      // 1. Obtener ID del cliente logueado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No estás logueado.");

      // 2. Buscar mesa del cliente
      const { data: mesaData, error: mesaError } = await supabase
        .from('mesas')
        .select('numero')
        .eq('cliente_id', user.id)
        .single();
      
      if (mesaError || !mesaData) {
        throw new Error("No tienes una mesa asignada. Por favor escanea el QR nuevamente.");
      }

      const mesaNumero = mesaData.numero;

      // 3. Preparar los pedidos
      const pedidosParaInsertar = this.items.map(item => ({
        mesa_numero: mesaNumero,
        producto_nombre: item.producto.nombre,
        categoria: item.producto.tipo,
        cantidad: item.cantidad,
        estado: 'Pendiente'
      }));

      // 4. Insertar en la tabla pedidos
      const { error: insertError } = await supabase
        .from('pedidos')
        .insert(pedidosParaInsertar);

      if (insertError) throw insertError;

      // 5. Éxito
      this.carritoService.vaciarCarrito();
      this.toastService.mostrarExito('¡Pedido confirmado! Redirigiendo...', 2000);
      
      setTimeout(() => {
        this.router.navigate(['/home-cliente']);
      }, 2000);

    } catch (error: any) {
      console.error("Error al confirmar el pedido:", error);
      this.toastService.mostrarError(error.message || "Ocurrió un error al confirmar tu pedido.");
      this.procesando = false;
    }
  }
}
