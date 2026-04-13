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
  selector: 'app-alta-bebida',
  templateUrl: './alta-bebida.page.html',
  styleUrls: ['./alta-bebida.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonInput, IonTextarea, IonButton, IonGrid, IonRow, IonCol, IonCard,
    IonList, IonFooter, 
    CommonModule, FormsModule
  ]
})
export class AltaBebidaPage {
  private fotoService = inject(FotoService);
  private productoService = inject(ProductoService);
  private toastService = inject(ToastService);
  private spinnerService = inject(SpinnerService);
  private router = inject(Router);

  bebida: Producto = {
    nombre: '',
    descripcion: '',
    tiempo_elaboracion: 0,
    precio: 0,
    fotos: [],
    tipo: 'bebida'
  };

  fotosPreview: string[] = [];

  constructor() {}

  /**
   * Limita la entrada a 2 decimales mientras el usuario escribe.
   */
  validarDecimales(event: any) {
    const valor = event.target.value;
    if (valor && valor.includes('.')) {
      const partes = valor.split('.');
      if (partes[1].length > 2) {
        this.bebida.precio = parseFloat(parseFloat(valor).toFixed(2));
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
      this.bebida.fotos.push(foto.dataUrl);
    }
  }

  eliminarFoto(index: number) {
    this.fotosPreview.splice(index, 1);
    this.bebida.fotos.splice(index, 1);
  }

  private async notificarError(mensaje: string) {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    this.toastService.mostrarError(mensaje);
  }

  async guardarBebida() {
    // Validaciones de negocio con .trim() para evitar espacios vacíos
    if (!this.bebida.nombre?.trim() || this.bebida.nombre.length < 3) {
      return this.notificarError('El nombre debe tener al menos 3 letras.');
    }

    if (!this.bebida.descripcion?.trim() || this.bebida.descripcion.length < 3) {
      return this.notificarError('La descripción debe tener al menos 3 letras.');
    }

    // A diferencia de la comida, una bebida podría ser de preparación inmediata (0 min)
    if (this.bebida.tiempo_elaboracion < 0) {
      return this.notificarError('El tiempo no puede ser negativo.');
    }

    if (this.bebida.precio <= 0) {
      return this.notificarError('El precio debe ser mayor a 0.');
    }

    if (this.fotosPreview.length !== 3) {
      return this.notificarError('Debe tomar exactamente 3 fotos.');
    }

    try {
      await this.spinnerService.mostrar('Guardando bebida...');

      const existe = await this.productoService.verificarSiExiste(this.bebida.nombre, 'bebida');
      if (existe) {
        await this.spinnerService.ocultar();
        return this.notificarError(`La bebida "${this.bebida.nombre}" ya existe.`);
      }

      // Limpieza de decimales por seguridad para la DB
      this.bebida.precio = Math.round(this.bebida.precio * 100) / 100;

      await this.productoService.crearProducto(this.bebida);
      
      await this.spinnerService.ocultar();
      this.toastService.mostrarExito('¡Bebida agregada con éxito!');
      this.router.navigate(['/home']); 

    } catch (error) {
      await this.spinnerService.ocultar();
      await Haptics.vibrate();
      this.toastService.mostrarError('Error al guardar en la base de datos.');
    }
  }
}