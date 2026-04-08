import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastController = inject(ToastController);

  /**
   * Muestra un toast de éxito en la parte superior.
   */
  async mostrarExito(mensaje: string, duracion: number = 2000) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: duracion,
      position: 'top',
      cssClass: 'custom-toast-success',
      icon: 'checkmark-circle-outline' // Icono opcional
    });
    await toast.present();
  }

  /**
   * Muestra un toast de error en la parte superior.
   */
  async mostrarError(mensaje: string, duracion: number = 3000) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: duracion,
      position: 'top',
      cssClass: 'custom-toast-error',
      icon: 'warning-outline'
    });
    await toast.present();
  }

  /**
   * Muestra un toast de advertencia/información en la parte superior.
   */
  async mostrarAdvertencia(mensaje: string, duracion: number = 3000) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: duracion,
      position: 'top',
      cssClass: 'custom-toast-warning',
      icon: 'information-circle-outline'
    });
    await toast.present();
  }
}
