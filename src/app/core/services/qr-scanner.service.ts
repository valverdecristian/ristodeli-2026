import { Injectable } from '@angular/core';
import { BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { BaseScannerService } from './base-scanner.service';

@Injectable({
  providedIn: 'root'
})
export class QrScannerService extends BaseScannerService {

  public async scanQr(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('El escáner de QR requiere un dispositivo móvil. Simulando escaneo puro de QR.');
      return 'Mesa 1 (Simulada)'; 
    }

    // Usamos el método blindado y genérico de la clase padre
    const barcodes = await this.ejecutarEscaneoNativo([BarcodeFormat.QrCode]);

    if (barcodes && barcodes.length > 0) {
      return barcodes[0].rawValue || null;
    }
    
    return null;
  }

}
