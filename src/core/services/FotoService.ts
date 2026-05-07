import { launchCamera, CameraOptions } from 'react-native-image-picker';
import { Platform, PermissionsAndroid } from 'react-native';

export const FotoService = {
  sacarFoto: async (): Promise<string | null> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Permiso de Cámara",
          message: "La app necesita acceso a tu cámara para continuar.",
          buttonNeutral: "Preguntar Luego",
          buttonNegative: "Cancelar",
          buttonPositive: "OK"
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Permiso de cámara denegado");
        return null;
      }
    }

    return new Promise((resolve, reject) => {
      const options: CameraOptions = {
        mediaType: 'photo',
        quality: 0.7,
        includeBase64: false, // Para subirlo a Supabase más fácil si se requiere
      };

      launchCamera(options, (response) => {
        if (response.didCancel) {
          console.log('El usuario canceló la cámara');
          resolve(null);
        } else if (response.errorCode) {
          console.log('Error de cámara: ', response.errorMessage);
          reject(response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          // Podríamos retornar asset.uri o la data base64 (asset.base64)
          // Usaremos URI por ahora para mostrar el preview visual
          resolve(asset.uri || null); 
        } else {
          resolve(null);
        }
      });
    });
  }
};
