import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

@Injectable({
  providedIn: 'root'
})
export class FotoService {

  constructor() { }

  /**
   * Abre la cámara del dispositivo para tomar una foto en el momento.
   * No permite seleccionar imágenes de la galería para cumplir con el requisito de seguridad.
   * @returns Una Promesa que resuelve con la Foto capturada o undefined en caso de error/cancelación.
   */
  public async sacarFoto(): Promise<Photo | undefined> {
    try {
      const fotoCapturada = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 70,
        allowEditing: false,
        saveToGallery: false
      });

      return fotoCapturada;
    } catch (error) {
      console.warn('Cámara cerrada o error al capturar la foto:', error);
      return undefined;
    }
  }
}