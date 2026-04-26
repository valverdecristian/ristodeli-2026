import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  IonItem, IonInput, IonTextarea, IonButton, IonRow, IonCol, 
  IonList, IonIcon, IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonBackButton, IonContent, IonFooter 
} from '@ionic/angular/standalone';
import { FotoService } from '../../../core/services/foto.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';

import { cameraOutline, trashOutline, cameraReverseOutline, addCircleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-formulario-producto',
  templateUrl: './formulario-producto.page.html',
  styleUrls: ['./formulario-producto.page.scss'],
  standalone: true,
  imports: [
    IonItem, IonInput, IonTextarea, IonButton, IonRow, IonCol, 
    IonList, IonIcon, IonHeader, IonToolbar, IonTitle, IonButtons, 
    IonBackButton, IonContent, IonFooter, CommonModule, ReactiveFormsModule
  ]
})
export class FormularioProductoComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private fotoService = inject(FotoService);
  private productoService = inject(ProductoService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  private route = inject(ActivatedRoute);

  // Mantenemos el Input por si se usa como componente hijo
  @Input() set tipoProducto(val: 'plato' | 'bebida' | 'postre') {
    if (val) {
      this.tipo = val;
      this.configurarVista();
    }
  }
  
  tipo: 'plato' | 'bebida' | 'postre' = 'plato';
  config = { titulo: '', color: '', label: '' };
  productoForm!: FormGroup;
  fotosPreview: string[] = [];
  submitted = false;

  constructor() {
    addIcons({ cameraOutline, trashOutline, cameraReverseOutline, addCircleOutline });
  }

  ngOnInit() {
    // 1. CAPTURAR EL TIPO DESDE LA RUTA (Prioritario para navegación directa)
    const tipoUrl = this.route.snapshot.paramMap.get('tipo') as 'plato' | 'bebida' | 'postre';
    if (tipoUrl) {
      this.tipo = tipoUrl;
    }

    // 2. INICIALIZAR FORMULARIO
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required]],
      tiempo_elaboracion: [null, [Validators.required, Validators.min(1)]],
      precio: [null, [Validators.required, Validators.min(1)]]
    });

    // 3. ACTUALIZAR LA VISTA (Título y Colores)
    this.configurarVista();
  }

  configurarVista() {
    // Configuración dinámica según el tipo
    const configs = {
      plato: { titulo: 'Alta de Plato', color: 'warning', label: 'del Plato' },
      bebida: { titulo: 'Alta de Bebida', color: 'danger', label: 'de la Bebida' },
      postre: { titulo: 'Alta de Postre', color: 'secondary', label: 'del Postre' }
    };
    
    this.config = configs[this.tipo] || configs['plato'];
  }

  async tomarFoto() {
    if (this.fotosPreview.length >= 3) return;
    
    const foto = await this.fotoService.sacarFoto();
    if (foto?.dataUrl) {
      this.fotosPreview.push(foto.dataUrl);
    }
  }

  eliminarFoto(index: number) {
    this.fotosPreview.splice(index, 1);
  }

  async guardar() {
    this.submitted = true;

    // Validación de campos y requisito de 3 fotos (Punto 11)
    if (this.productoForm.invalid || this.fotosPreview.length !== 3) {
      this.toastService.mostrarError('Debe completar todos los campos y las 3 fotos obligatorias.');
      return;
    }

    try {
      await this.spinnerService.mostrar(`Guardando ${this.tipo.toUpperCase()}...`);
      
      const { nombre } = this.productoForm.value;
      const existe = await this.productoService.verificarSiExiste(nombre, this.tipo);
      
      if (existe) {
        await this.spinnerService.ocultar();
        this.toastService.mostrarError(`Este producto ya existe en la carta.`);
        return;
      }

      const productoData = {
        ...this.productoForm.value,
        fotos: this.fotosPreview,
        tipo: this.tipo
      };

      await this.productoService.crearProducto(productoData);
      await this.spinnerService.ocultar();
      
      this.toastService.mostrarExito(`${this.tipo.toUpperCase()} guardado con éxito.`);
      
      // Navegación de retorno según el tipo
      const returnPath = (this.tipo === 'bebida') ? '/home-cantinero' : '/home-cocinero';
      this.router.navigate([returnPath]);

    } catch (e) {
      await this.spinnerService.ocultar();
      this.toastService.mostrarError('Error al guardar el producto.');
    }
  }
}