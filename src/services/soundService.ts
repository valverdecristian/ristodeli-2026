import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

//  tipos de sonido 
export type TipoSonido = 'inicio' | 'cierre' | 'error' | 'exito';

export const SoundService = {
    reproducir: async (tipo: TipoSonido) => {
        try {
        let archivoAudio;

        // Mapeo de cada archivo en assets
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
        const { sound } = await Audio.Sound.createAsync(archivoAudio);
        await sound.playAsync();

        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
            }
        });

        if (tipo === 'error') {
            if (Platform.OS !== 'web') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } else {
            Vibration.vibrate([0, 200]); 
            }
        }
        } catch (error) {
        console.log('No se pudo reproducir el recurso de audio:', error);
        }
    }
};