import { AuthProvider } from '@/src/context/AuthContext';
import { ToastProvider } from '@/src/context/ToastContext';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importamos el administrador de sonidos nativos
import { SoundService } from '@/src/services/soundService';

import '../global.css'; // <-- La magia de Tailwind

// 1. Evitamos que el splash se oculte antes de tiempo
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    // Definimos una función asíncrona para manejar el inicio limpio y multimedia
    const inicializarAplicacion = async () => {
      try {
        // Ocultamos el splash screen nativo
        await SplashScreen.hideAsync();
        
        // Gatillamos el sonido de bienvenida obligatorio del TFI
        await SoundService.reproducir('inicio');
      } catch (error) {
        console.log("Error al inicializar los recursos de carga:", error);
      }
    };

    inicializarAplicacion();
  }, []);

  return (
    <SafeAreaProvider>
      {/* AuthProvider detecta la sesión activa al arrancar y la comparte en toda la app */}
      <AuthProvider>
        <ToastProvider>
          <ThemeProvider value={DefaultTheme}>
            {/* Agregamos screenOptions para apagar todos los encabezados por defecto */}
            <Stack screenOptions={{ headerShown: false }}>
              
              {/* Declaramos el Login */}
              <Stack.Screen name="index" options={{ headerShown: false }} />

              {/* Declaramos explícitamente la pantalla de Registro para que no tenga Header */}
              <Stack.Screen name="registro" options={{ headerShown: false }} />
              
              {/* Declaramos explícitamente el grupo (homes) para asegurar que no tenga header */}
              <Stack.Screen name="(homes)" options={{ headerShown: false }} />
              
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
            </Stack>
            
            <StatusBar style="light" /> 
          </ThemeProvider>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}