import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // Importante
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
  IonItem, IonInput, IonTextarea, IonButton, IonRow, IonCol, 
  IonList, IonFooter, IonIcon 
} from '@ionic/angular/standalone';
import { FotoService } from '../../../core/services/foto.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cameraOutline, trashOutline, cameraReverseOutline, addCircleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-alta-producto',
  templateUrl: './alta-producto.page.html',
  styleUrls: ['./alta-producto.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonInput, IonTextarea, IonButton, IonRow, IonCol, 
    IonList, IonFooter, IonIcon, CommonModule, ReactiveFormsModule
  ]
})
export class AltaProductoPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private fotoService = inject(FotoService);
  private productoService = inject(ProductoService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  
  tipo: 'plato' | 'bebida' = 'plato';
  config = { titulo: '', color: '', label: '' };
  productoForm!: FormGroup;
  fotosPreview: string[] = [];
  submitted = false;

  constructor() {
    addIcons({ cameraOutline, trashOutline, cameraReverseOutline, addCircleOutline });
  }

  ngOnInit() {
    const tipoUrl = this.route.snapshot.paramMap.get('tipo');
    this.tipo = tipoUrl === 'bebida' ? 'bebida' : 'plato';

    this.config = {
      titulo: this.tipo === 'plato' ? 'Nuevo Plato' : 'Nueva Bebida',
      color: this.tipo === 'plato' ? 'primary' : 'tertiary',
      label: this.tipo === 'plato' ? 'del Plato' : 'de la Bebida'
    };

    // Inicializamos el formulario con validaciones (Requerimiento 50)
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required]],
      tiempo_elaboracion: [0, [Validators.required, Validators.min(1)]],
      precio: [0, [Validators.required, Validators.min(1)]]
    });
  }

  async tomarFoto() {
    if (this.fotosPreview.length >= 3) {
      this.toastService.mostrarAdvertencia('Máximo 3 fotos permitidas.');
      return;
    }
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

    if (this.productoForm.invalid || this.fotosPreview.length !== 3) {
      await Haptics.impact({ style: ImpactStyle.Heavy }); // Requerimiento 52
      
      if (this.fotosPreview.length !== 3) {
        this.toastService.mostrarError('Se requieren las 3 fotos obligatoriamente.');
      } else {
        this.toastService.mostrarError('Por favor complete todos los campos.');
      }
      return;
    }

    try {
      await this.spinnerService.mostrar(`Guardando ${this.tipo}...`);
      
      const { nombre } = this.productoForm.value;
      const existe = await this.productoService.verificarSiExiste(nombre, this.tipo);
      
      if (existe) {
        await this.spinnerService.ocultar();
        return this.toastService.mostrarError(`Este ${this.tipo} ya existe.`);
      }

      const productoData = {
        ...this.productoForm.value,
        fotos: this.fotosPreview,
        tipo: this.tipo
      };

      await this.productoService.crearProducto(productoData);
      await this.spinnerService.ocultar();
      this.toastService.mostrarExito(`${this.tipo.toUpperCase()} guardado con éxito.`);
      this.router.navigate(['/home']);
    } catch (e) {
      await this.spinnerService.ocultar();
      await Haptics.vibrate();
      this.toastService.mostrarError('Error al guardar.');
    }
  }
}