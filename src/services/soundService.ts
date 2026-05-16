import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

// Definimos los tipos de sonido que exige el TFI
export type TipoSonido = 'inicio' | 'cierre' | 'error' | 'exito';

export const SoundService = {
    reproducir: async (tipo: TipoSonido) => {
        try {
        let archivoAudio;

        // Mapeamos cada tipo a su respectivo archivo en assets
        switch (tipo) {
            case 'inicio':
            archivoAudio = require('@/assets/sounds/app_start.mp3');
            break;
            case 'error':
            archivoAudio = require('@/assets/sounds/error_alert.mp3');
            break;
            case 'exito':
            case 'cierre':
            archivoAudio = require('@/assets/sounds/success_bip.mp3');
            break;
        }

        // Creamos y reproducimos el sonido de forma asíncrona
        const { sound } = await Audio.Sound.createAsync(archivoAudio);
        await sound.playAsync();

        // Forzamos la descarga del archivo de la memoria RAM cuando termine de sonar
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
            }
        });

        // Si es un sonido de error, activamos la vibración obligatoria por RLS/Validación
        if (tipo === 'error') {
            if (Platform.OS !== 'web') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } else {
            Vibration.vibrate([0, 200]); // Fallback para navegadores o pruebas
            }
        }
        } catch (error) {
        console.log('No se pudo reproducir el recurso de audio:', error);
        }
    }
};