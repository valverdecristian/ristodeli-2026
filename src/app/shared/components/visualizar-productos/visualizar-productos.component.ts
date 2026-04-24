import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonCard, IonCardHeader,  
  IonCardContent,IonIcon, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { ProductoService } from 'src/app/core/services/producto.service';
import { CarritoService } from 'src/app/core/services/carrito.service';
import { addIcons } from 'ionicons';
import { timeOutline, chevronForwardOutline, cartOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Component({
  selector: 'app-visualizar-productos',
  templateUrl: './visualizar-productos.component.html',
  styleUrls: ['./visualizar-productos.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonBackButton, IonCard, IonCardHeader, IonCardContent,
    CommonModule, IonIcon, IonFab, IonFabButton, RouterModule
  ]
})
export class VisualizarProductosComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public carritoService = inject(CarritoService);
  private productoService = inject(ProductoService);
  private authService = inject(AuthService);
  private supabase: SupabaseClient = this.authService.supabaseClient;

  categorias = [
    { tipo: 'plato', titulo: 'Platos', productos: [] as any[] },
    { tipo: 'bebida', titulo: 'Bebidas', productos: [] as any[] },
    { tipo: 'postre', titulo: 'Postres', productos: [] as any[] }
  ];
  titulo: string = 'Carta Completa';
  cargando: boolean = false;

  constructor() {
    addIcons({timeOutline,chevronForwardOutline,cartOutline});
  }

  ngOnInit() {
    this.cargarProductos();
  }

  async cargarProductos() {
    this.cargando = true;
    try {
      const { data: result, error } = await this.supabase
        .from('productos')
        .select('*')
        .eq('estado', 'disponible'); 
      
      const allProducts = result || [];
      
      this.categorias[0].productos = allProducts.filter(p => p.tipo === 'plato');
      this.categorias[1].productos = allProducts.filter(p => p.tipo === 'bebida');
      this.categorias[2].productos = allProducts.filter(p => p.tipo === 'postre');

    } catch (error) {
      console.error(error);
    } finally {
      this.cargando = false;
    }
  }

  irADetalle(id: string) {
    this.router.navigate(['/detalle-producto', id]);
  }
}