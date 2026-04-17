import { inject, Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private loadingCtrl = inject(LoadingController);
  private currentLoading: HTMLIonLoadingElement | null = null;
  private showTimestamp: number = 0;
  private MINIMUM_SPIN_MS = 2000;
  private isCreating: boolean = false;

  /**
   * Muestra el LoadingOverlay forzando nuestra animación del logo.
   * @param mensaje Mensaje a mostrar bajo el logo (Opcional)
   */
  async mostrar(mensaje: string = 'Aguarde un momento...') {
    // Si ya hay uno mostrándose o en proceso de creación, omitimos.
    if (this.currentLoading || this.isCreating) {
      return;
    }

    this.isCreating = true;
    this.showTimestamp = Date.now();

    try {
      this.currentLoading = await this.loadingCtrl.create({
        spinner: null, // Desactivar el de defecto
        message: mensaje,
        cssClass: 'custom-spinner-logo',
        backdropDismiss: false // Impedir que toquen atrás
      });

      await this.currentLoading.present();
    } finally {
      this.isCreating = false;
    }
  }

  /**
   * Oculta el spinner, con la inteligencia de esperar a que se cumplan
   * al menos 2000ms desde que se invocó mostrar() para que el usuario pueda ver la animación.
   */
  async ocultar() {
    if (!this.currentLoading) return;

    const timeElapsed = Date.now() - this.showTimestamp;
    const timeRemaining = this.MINIMUM_SPIN_MS - timeElapsed;

    // Si aún no pasaron 2 segundos, hacemos un pequeño delay falso.
    if (timeRemaining > 0) {
      await new Promise(resolve => setTimeout(resolve, timeRemaining));
    }

    if (this.currentLoading) {
      try {
        await this.currentLoading.dismiss();
      } catch (err) {
        console.warn('Spinner ignorado; probablemente destruido por la navegación:', err);
      } finally {
        this.currentLoading = null;
      }
    }
  }
}
