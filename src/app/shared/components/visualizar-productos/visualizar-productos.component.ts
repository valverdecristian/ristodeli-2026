import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonCard, IonCardHeader,  
  IonCardContent,IonIcon
} from '@ionic/angular/standalone';
import { ProductoService } from 'src/app/core/services/producto.service';
import { addIcons } from 'ionicons';
import { timeOutline } from 'ionicons/icons';
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
    CommonModule, IonIcon
  ]
})
export class VisualizarProductosComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productoService = inject(ProductoService);
  private authService = inject(AuthService);
  private supabase: SupabaseClient = this.authService.supabaseClient;

  productos: any[] = [];
  tipo: string = '';
  titulo: string = '';
  cargando: boolean = false;

  constructor() {
    addIcons({ timeOutline });
  }

  ngOnInit() {
    // Capturamos el tipo de la URL: /visualizar-productos/plato
    this.tipo = this.route.snapshot.paramMap.get('tipo') || 'plato';
    
    const titulos: any = {
      plato: 'Menú de Platos',
      postre: 'Menú de Postres',
      bebida: 'Menú de Bebidas'
    };
    this.titulo = titulos[this.tipo] || 'Productos';
    
    this.cargarProductos();
  }

  async cargarProductos() {
    this.cargando = true;
    try {
      let data;
      if (this.tipo === 'todos') {

        const { data: result, error } = await this.supabase
          .from('productos')
          .select('*')
          .eq('estado', 'disponible'); 
        data = result;
      } else {
        data = await this.productoService.obtenerPorTipo(this.tipo);
      }
      this.productos = data || [];
    } catch (error) {
      console.error(error);
    } finally {
      this.cargando = false;
    }
  }

}