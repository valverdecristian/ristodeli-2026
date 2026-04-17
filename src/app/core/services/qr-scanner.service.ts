import { Injectable } from '@angular/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class QrScannerService {

  constructor() { }

  public async scanQr(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('El escáner de QR requiere un dispositivo móvil. Simulando escaneo puro de QR.');
      return 'Mesa 1 (Simulada)'; 
    }

    try {
      // 1. Pedir permisos
      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== 'granted' && camera !== 'limited') {
        return null; // Permiso denegado
      }

      // 2. Ejecutar escaneo orientado exclusivamente a QRCodes
      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
      });

      // 3. Devolver la data cruda del QR
      if (barcodes && barcodes.length > 0) {
        return barcodes[0].rawValue || null;
      }
      return null;
    } catch (e) {
      console.error('Error al escanear el QR:', e);
      return null;
    }
  }

}
