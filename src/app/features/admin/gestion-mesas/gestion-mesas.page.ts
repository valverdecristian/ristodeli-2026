import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonInput, 
  IonSelect, IonSelectOption, IonButton, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButtons, IonBackButton, IonIcon, IonLabel,

} from '@ionic/angular/standalone';
import { QRCodeComponent } from 'angularx-qrcode';
import { Mesa } from '../../../core/models/mesa.model';
import { ToastService } from '../../../core/services/toast.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { MesaService } from '../../../core/services/mesa.service';
import { SpinnerService } from '../../../core/services/spinner.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { cameraOutline, qrCodeOutline, chevronDownOutline,refreshOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-gestion-mesas',
  templateUrl: './gestion-mesas.page.html',
  styleUrls: ['./gestion-mesas.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonInput, 
    IonSelect, IonSelectOption, IonButton, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonButtons, IonBackButton,
    CommonModule, FormsModule, QRCodeComponent,IonIcon, IonLabel,

  ]
})
export class GestionMesasPage {
  private toastService = inject(ToastService);
  private mesaService = inject(MesaService);       
  private spinnerService = inject(SpinnerService);
  fotoMesa: string | undefined = undefined;

  nuevaMesa: any = { 
    numero: 1,
    comensales: 2,
    tipo: 'Estándar',
    qr_data: '',
    foto_url: '' 
  };

  qrGenerado: boolean = false;

  constructor() {
    addIcons({ cameraOutline, qrCodeOutline, chevronDownOutline, refreshOutline });
  }

  async generarMesa() {
    if (this.nuevaMesa.numero <= 0 || this.nuevaMesa.comensales <= 0) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      this.toastService.mostrarError('El número de mesa y comensales debe ser mayor a 0');
      return;
    }
  
    try {
      await this.spinnerService.mostrar('Guardando mesa y generando QR...');
  
      const existe = await this.mesaService.verificarSiExiste(this.nuevaMesa.numero);
      if (existe) {
        await this.spinnerService.ocultar();
        await Haptics.impact({ style: ImpactStyle.Heavy });
        this.toastService.mostrarError(`La Mesa N° ${this.nuevaMesa.numero} ya existe.`);
        return;
      }
  
      // --- CAMBIO CLAVE PARA EL FLUJO GAMMA ---
      // En lugar de JSON, guardamos el identificador que el cliente escanea.
      this.nuevaMesa.qr_data = `MESA_${this.nuevaMesa.numero}`; 
  
      const mesaFinal = {
        numero: this.nuevaMesa.numero,
        comensales: this.nuevaMesa.comensales,
        tipo: this.nuevaMesa.tipo,
        qr_data: this.nuevaMesa.qr_data, // Ahora dice "MESA_1"
        foto: this.nuevaMesa.foto_url, 
        estado: 'Libre'
      };
  
      await this.mesaService.crearMesa(mesaFinal);
      // ---------------------------------------
  
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
  this.nuevaMesa = { 
    numero: 1, 
    comensales: 2, 
    tipo: 'Estándar', 
    qr_data: '', 
    foto_url: '' 
  };
    this.fotoMesa = undefined; 
    this.qrGenerado = false;
  }

  async tomarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera 
      });
      this.fotoMesa = image.dataUrl;
      this.nuevaMesa.foto_url = image.dataUrl; 
    } catch (error) {
      console.log('El usuario cerró la cámara');
    }
  }

}
