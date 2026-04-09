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

  async guardarBebida() {
    if (!this.bebida.nombre || this.bebida.nombre.length < 3) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('El nombre debe tener al menos 3 letras.');
      return;
    }

    if (!this.bebida.descripcion || this.bebida.descripcion.length < 3) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('La descripción debe tener al menos 3 letras.');
      return;
    }

    if (this.bebida.tiempo_elaboracion <= 0) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('El tiempo de preparación debe ser mayor a 0.');
      return;
    }

    if (this.bebida.precio <= 0) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('El precio debe ser mayor a 0.');
      return;
    }

    if (this.fotosPreview.length !== 3) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('Debe tomar exactamente 3 fotos de la bebida.');
      return;
    }

    try {
      await this.spinnerService.mostrar('Guardando bebida...');

      // Validamos que no exista otra BEBIDA con el mismo nombre
      const existe = await this.productoService.verificarSiExiste(this.bebida.nombre, 'bebida');
      if (existe) {
        await this.spinnerService.ocultar();
        await Haptics.impact({ style: ImpactStyle.Heavy });
        this.toastService.mostrarError(`La bebida "${this.bebida.nombre}" ya existe.`);
        return;
      }

      await this.productoService.crearProducto(this.bebida);
      
      await this.spinnerService.ocultar();
      this.toastService.mostrarExito('¡Bebida agregada correctamente!');
      
      this.router.navigate(['/home']); // CAMBIAR LA REDIRECCION HACIA EL DASHBOARD CORRESPONDIENTE

    } catch (error) {
      await this.spinnerService.ocultar();
      await Haptics.vibrate();
      console.error(error);
      this.toastService.mostrarError('Error al guardar la bebida.');
    }
  }
}
