import { Injectable } from '@angular/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

export interface DatosDni {
  nombres: string;
  apellidos: string;
  dni: string;
  cuil: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScannerService {

  constructor() { }

  public async scanDni(): Promise<DatosDni | null> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('El escáner de DNI requiere un dispositivo móvil. Retornando datos simulados para prueba visual en web.');
      // Simulando un modelo de DNI escaneado exitosamente en navegador web para pruebas.
      return {
        nombres: 'Julio Cesar',
        apellidos: 'Mendieta',
        dni: '31234567',
        cuil: '20312345678'
      };
    }

    try {
      // 1. Pedir permisos
      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== 'granted' && camera !== 'limited') {
        return null; // Permiso denegado
      }

      // 2. Ejecutar escaneo orientado a PDF417 (DNI)
      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.Pdf417],
      });

      if (barcodes && barcodes.length > 0) {
        const rawData = barcodes[0].rawValue;
        if (rawData) {
           return this.parsearDni(rawData);
        }
      }
      return null;
    } catch (e) {
      console.error('Error al ejecutar el scanner:', e);
      return null;
    }
  }

  private parsearDni(rawData: string): DatosDni | null {
     if (!rawData) return null;
     
     // El string devuelto por el escaner en Argentina suele separarse con '@'
     // Limpiamos espacios y retornos de carro (\r o \n) que pueden venir al final
     const parts = rawData.split('@').map(p => p.trim());
     
     let nombres = '';
     let apellidos = '';
     let dni = '';
     let cuil = '';

     if (parts.length >= 8) {
       // Chequeamos dónde está el nro de DNI, usualmente hay dos formatos clásicos
       if (/^\d+$/.test(parts[0]) && /^\d+$/.test(parts[4])) {
          // Formato tradicional: NumeroTramite@Apellidos@Nombres@Sexo@DNI...
          apellidos = parts[1];
          nombres = parts[2];
          dni = parts[4];
       } else if (/^\d+$/.test(parts[3])) {
          // Si el tramite no vino al inicio y todo se desplazó una pos: Apellidos@Nombres@Sexo@DNI...
          apellidos = parts[0];
          nombres = parts[1];
          dni = parts[3];
       }
     }
     
     // Detectar cuil si el formato es muy nuevo y lo trae
     const dniPadded = dni.padStart(8, '0');
     const cuilParts = parts.filter(p => /^\d{11}$/.test(p));
     
     if (cuilParts.length > 0) {
        // Encontramos cadenas de 11 dígitos. Nos aseguramos de tomar estrictamente la que contenga el DNI
        // para no confundirla accidentalmente con el número de trámite (que también tiene 11 dígitos).
        const exactCuil = cuilParts.find(p => p.includes(dni) || p.includes(dniPadded));
        if (exactCuil) {
           cuil = exactCuil;
        }
     }

     if (!dni || !nombres || !apellidos) {
        return null; 
     }
     
     return {
       nombres: this.capitalizeLetras(nombres),
       apellidos: this.capitalizeLetras(apellidos),
       dni,
       cuil
     };
  }

  private capitalizeLetras(str: string): string {
    return str.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
}
