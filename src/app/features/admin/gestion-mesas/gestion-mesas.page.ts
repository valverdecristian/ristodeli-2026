import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonInput, 
  IonSelect, IonSelectOption, IonButton, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButtons, IonBackButton 
} from '@ionic/angular/standalone';
import { QRCodeComponent } from 'angularx-qrcode';
import { Mesa } from '../../../core/models/mesa.model';
import { ToastService } from '../../../core/services/toast.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { MesaService } from '../../../core/services/mesa.service';
import { SpinnerService } from '../../../core/services/spinner.service';

@Component({
  selector: 'app-gestion-mesas',
  templateUrl: './gestion-mesas.page.html',
  styleUrls: ['./gestion-mesas.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonInput, 
    IonSelect, IonSelectOption, IonButton, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonButtons, IonBackButton,
    CommonModule, FormsModule, QRCodeComponent
  ]
})
export class GestionMesasPage {
  private toastService = inject(ToastService);
  private mesaService = inject(MesaService);       
  private spinnerService = inject(SpinnerService);

  nuevaMesa: Mesa = {
    numero: 1,
    comensales: 2,
    tipo: 'Estándar',
    qr_data: ''
  };

  qrGenerado: boolean = false;

  constructor() {}

  async generarMesa() {
    if (this.nuevaMesa.numero <= 0 || this.nuevaMesa.comensales <= 0) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('El número de mesa y comensales debe ser mayor a 0');
      return;
    }

    try {
      await this.spinnerService.mostrar('Guardando mesa y generando QR...');

      // 1. Verificamos que no exista otra mesa con ese número
      const existe = await this.mesaService.verificarSiExiste(this.nuevaMesa.numero);
      if (existe) {
        await this.spinnerService.ocultar();
        await Haptics.impact({ style: ImpactStyle.Heavy });
        this.toastService.mostrarError(`La Mesa N° ${this.nuevaMesa.numero} ya existe en el sistema.`);
        return;
      }

      // 2. Armamos el dato del QR
      const datosQR = {
        numeroMesa: this.nuevaMesa.numero,
        tipo: this.nuevaMesa.tipo
      };
      this.nuevaMesa.qr_data = JSON.stringify(datosQR);

      // 3. Guardamos en Supabase
      await this.mesaService.crearMesa(this.nuevaMesa);

      // 4. Mostramos el éxito (QR y Sonido)
      this.qrGenerado = true;
      await this.spinnerService.ocultar();
      
      const audio = new Audio('assets/sounds/exito.mp3');
      audio.play().catch(err => console.log('Error de audio', err));

      this.toastService.mostrarExito('¡Mesa guardada exitosamente!');

    } catch (error) {
      await this.spinnerService.ocultar();
      await Haptics.vibrate();
      this.toastService.mostrarError('Ocurrió un error al guardar la mesa.');
      console.error(error);
    }
  }

  limpiarFormulario() {
    this.nuevaMesa = { numero: 1, comensales: 2, tipo: 'Estándar', qr_data: '' };
    this.qrGenerado = false;
  }
}