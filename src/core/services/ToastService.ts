import Toast from 'react-native-toast-message';

export const ToastService = {
  mostrarExito: (mensaje: string) => {
    Toast.show({
      type: 'success',
      text1: 'Éxito',
      text2: mensaje,
      position: 'top',
      visibilityTime: 4000,
    });
  },
  mostrarError: (mensaje: string) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: mensaje,
      position: 'top',
      visibilityTime: 4000,
    });
  },
  mostrarAdvertencia: (mensaje: string) => {
    Toast.show({
      type: 'info',
      text1: 'Atención',
      text2: mensaje,
      position: 'top',
      visibilityTime: 4000,
    });
  }
};
