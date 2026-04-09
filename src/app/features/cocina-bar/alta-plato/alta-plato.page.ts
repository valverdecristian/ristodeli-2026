import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
  IonItem, IonInput, IonTextarea, IonButton, IonGrid, IonRow, IonCol, IonCard, 
  IonList, IonFooter // 
} from '@ionic/angular/standalone';
import { FotoService } from '../../../core/services/foto.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ToastService } from '../../../core/services/toast.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Producto } from '../../../core/models/producto.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-alta-plato',
  templateUrl: './alta-plato.page.html',
  styleUrls: ['./alta-plato.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonInput, IonTextarea, IonButton, IonGrid, IonRow, IonCol, IonCard,
    IonList, IonFooter, // <-- ¡Acá también!
    CommonModule, FormsModule
  ]
})
export class AltaPlatoPage {
  private fotoService = inject(FotoService);
  private productoService = inject(ProductoService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  private router = inject(Router);

  plato: Producto = {
    nombre: '',
    descripcion: '',
    tiempo_elaboracion: 0,
    precio: 0,
    fotos: [], 
    tipo: 'plato'
  };
  fotosPreview: string[] = [];

  constructor() {}

  /** Abre la camara usando el servicio **/
  async tomarFoto() {
    if (this.fotosPreview.length >= 3) {
      this.toastService.mostrarAdvertencia('Ya tomaste las 3 fotos requeridas.');
      return;
    }

    const foto = await this.fotoService.sacarFoto();
    if (foto && foto.dataUrl) {
      this.fotosPreview.push(foto.dataUrl);
      this.plato.fotos.push(foto.dataUrl); 
    }
  }

  /**
   * Elimina una foto de la lista antes de guardar
   */
  eliminarFoto(index: number) {
    this.fotosPreview.splice(index, 1);
    this.plato.fotos.splice(index, 1);
  }

  async guardarPlato() {
    
    // Validaciones 
    if (!this.plato.nombre || this.plato.nombre.length < 3) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('El nombre debe tener al menos 3 letras.');
      return;
    }

    if (!this.plato.descripcion || this.plato.descripcion.length < 3) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('La descripción debe tener al menos 3 letras.');
      return;
    }

    if (this.plato.tiempo_elaboracion <= 0) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('El tiempo de elaboración debe ser mayor a 0.');
      return;
    }

    if (this.plato.precio <= 0) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('El precio debe ser mayor a 0.');
      return;
    }

    if (this.fotosPreview.length !== 3) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('Debe tomar exactamente 3 fotos del plato.');
      return;
    }

    try {
      await this.spinnerService.mostrar('Guardando plato...');

      // Verifica si ya existe un plato con ese nombre
      const existe = await this.productoService.verificarSiExiste(this.plato.nombre, 'plato');
      if (existe) {
        await this.spinnerService.ocultar();
        await Haptics.impact({ style: ImpactStyle.Heavy });
        this.toastService.mostrarError(`El plato "${this.plato.nombre}" ya existe en el menú.`);
        return;
      }

      // Guardar en Base de Datos
      await this.productoService.crearProducto(this.plato);
      
      await this.spinnerService.ocultar();
      this.toastService.mostrarExito('¡Plato agregado correctamente!');
      
      // Limpiar formulario y volver atrás
      this.router.navigate(['/home']); // CAMBIAR LA REDIRECCION HACIA EL DASHBOARD CORRESPONDIENTE

    } catch (error) {
      await this.spinnerService.ocultar();
      await Haptics.vibrate();
      console.error(error);
      this.toastService.mostrarError('Error al guardar el plato.');
    }
  }
}
