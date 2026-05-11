import { launchCamera, CameraOptions } from 'react-native-image-picker';
import { Platform, PermissionsAndroid } from 'react-native';

export const FotoService = {
  sacarFoto: async (): Promise<{ uri: string; base64: string } | null> => {
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
        includeBase64: true, // Requerido para Supabase en React Native
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
          // Retornamos tanto la URI para visualización como el base64 para subir
          if (asset.uri && asset.base64) {
            resolve({ uri: asset.uri, base64: asset.base64 });
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }
};
