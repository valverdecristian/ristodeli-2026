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
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 10,
        width: 600,
        height: 600,
        allowEditing: false,
        saveToGallery: false
      });

      return fotoCapturada;
    } catch (error) {
      console.warn('Cámara cerrada o error al capturar la foto:', error);
      return undefined;
    }
  }

  /*
    Convierte una cadena Base64 pura a un objeto Blob
   
  public b64toBlob(b64Data: string, contentType = 'image/jpeg') {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType });
  } */
} 
  
