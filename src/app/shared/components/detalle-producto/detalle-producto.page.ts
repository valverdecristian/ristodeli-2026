import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonIcon, IonButton
} from '@ionic/angular/standalone';
import { ProductoService } from 'src/app/core/services/producto.service';
import { CarritoService } from 'src/app/core/services/carrito.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { addIcons } from 'ionicons';
import { timeOutline, addOutline, removeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-detalle-producto',
  templateUrl: './detalle-producto.page.html',
  styleUrls: ['./detalle-producto.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonBackButton, IonIcon, IonButton, CommonModule
  ]
})
export class DetalleProductoPage implements OnInit {
  private route = inject(ActivatedRoute);
  private productoService = inject(ProductoService);
  private carritoService = inject(CarritoService);
  private toastService = inject(ToastService);

  producto: any;
  cargando: boolean = true;
  cantidad: number = 0;

  constructor() {
    addIcons({ timeOutline, addOutline, removeOutline });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.cargarProducto(id);
    }
  }

  async cargarProducto(id: string) {
    this.cargando = true;
    try {
      this.producto = await this.productoService.obtenerPorId(id);
    } catch (error) {
      console.error('Error al cargar detalle del producto', error);
    } finally {
      this.cargando = false;
    }
  }

  incrementar() {
    this.cantidad++;
  }

  decrementar() {
    if (this.cantidad > 0) {
      this.cantidad--;
    }
  }

  agregarAlPedido() {
    if (this.cantidad > 0 && this.producto) {
      this.carritoService.agregarItem(this.producto, this.cantidad);
      this.toastService.mostrarExito('¡Producto agregado a tu orden!');
      this.cantidad = 0; // Reset counter after adding
    }
  }
}
