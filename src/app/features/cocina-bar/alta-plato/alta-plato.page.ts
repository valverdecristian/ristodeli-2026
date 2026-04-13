import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
  IonItem, IonInput, IonTextarea, IonButton, IonGrid, IonRow, IonCol, IonCard, 
  IonList, IonFooter 
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
    IonList, IonFooter,
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

  /**
   * Asegura que el precio no tenga más de 2 decimales mientras el usuario escribe.
   */
  validarDecimales(event: any) {
    const valor = event.target.value;
    if (valor && valor.includes('.')) {
      const partes = valor.split('.');
      if (partes[1].length > 2) {
        this.plato.precio = parseFloat(parseFloat(valor).toFixed(2));
      }
    }
  }

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

  eliminarFoto(index: number) {
    this.fotosPreview.splice(index, 1);
    this.plato.fotos.splice(index, 1);
  }

  private async notificarError(mensaje: string) {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    this.toastService.mostrarError(mensaje);
  }

  async guardarPlato() {
    // Validaciones básicas
    if (!this.plato.nombre || this.plato.nombre.trim().length < 3) {
      return this.notificarError('El nombre debe tener al menos 3 letras.');
    }

    if (!this.plato.descripcion || this.plato.descripcion.trim().length < 3) {
      return this.notificarError('La descripción debe tener al menos 3 letras.');
    }

    if (this.plato.tiempo_elaboracion <= 0) {
      return this.notificarError('El tiempo debe ser mayor a 0.');
    }

    if (this.plato.precio <= 0) {
      return this.notificarError('El precio debe ser mayor a 0.');
    }

    if (this.fotosPreview.length !== 3) {
      return this.notificarError('Debe tomar exactamente 3 fotos.');
    }

    try {
      await this.spinnerService.mostrar('Guardando plato...');

      // Verificación de duplicados
      const existe = await this.productoService.verificarSiExiste(this.plato.nombre, 'plato');
      if (existe) {
        await this.spinnerService.ocultar();
        return this.notificarError(`El plato "${this.plato.nombre}" ya existe.`);
      }

      // Limpieza final de decimales antes de enviar a la DB
      this.plato.precio = Math.round(this.plato.precio * 100) / 100;

      await this.productoService.crearProducto(this.plato);
      
      await this.spinnerService.ocultar();
      this.toastService.mostrarExito('¡Plato agregado correctamente!');
      this.router.navigate(['/home']); 

    } catch (error) {
      await this.spinnerService.ocultar();
      await Haptics.vibrate();
      console.error(error);
      this.toastService.mostrarError('Error al guardar el plato.');
    }
  }
}