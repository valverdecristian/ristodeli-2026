import { inject } from '@angular/core';
import { BarcodeScanner, BarcodeFormat, Barcode } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { ToastService } from './toast.service';

/**
 * Clase base abstracta para encapsular la lógica compartida de escaneo nativo.
 * Aplica principios DRY (Don't Repeat Yourself) y SOLID (Open-Closed).
 */
export abstract class BaseScannerService {
  protected toastService = inject(ToastService);

  /**
   * Ejecuta el flujo compartido de validación de módulos, permisos y escaneo.
   * @param formatos Array de formatos de código a detectar (e.g. QrCode, Pdf417)
   */
  protected async ejecutarEscaneoNativo(formatos: BarcodeFormat[]): Promise<Barcode[] | null> {
    try {
      // 1. Instalación automática (Android)
      if (Capacitor.getPlatform() === 'android') {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        if (!available) {
          this.toastService.mostrarError('Instalando módulo de escáner. Aguarde unos momentos y vuelva a intentar.');
          await BarcodeScanner.installGoogleBarcodeScannerModule();
          return null;
        }
      }

      // 2. Solicitar permisos de cámara al OS
      const status = await BarcodeScanner.checkPermissions();
      if (status.camera !== 'granted') {
          const { camera } = await BarcodeScanner.requestPermissions();
          if (camera !== 'granted' && camera !== 'limited') {
            this.toastService.mostrarError('Permiso de cámara denegado.');
            return null;
          }
      }

      // 3. Lanzar la cámara nativa
      const { barcodes } = await BarcodeScanner.scan({
        formats: formatos,
      });

      return barcodes;

    } catch (e: any) {
      console.error('Error durante el escaneo nativo:', e);
      this.toastService.mostrarError('Error al escanear: ' + (e.message || JSON.stringify(e)));
      return null;
    }
  }

  /**
   * Destruye la instancia nativa de la cámara, previniendo bugs fantasma en 2do plano.
   */
  public async detenerEscaneo(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await BarcodeScanner.stopScan();
        await BarcodeScanner.removeAllListeners();
      } catch (e) {
        console.warn('Error al detener la cámara nativa silenciosamente:', e);
      }
    }
  }
}
