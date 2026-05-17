import { AuthProvider } from '@/src/context/AuthContext';
import { ToastProvider } from '@/src/context/ToastContext';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SoundService } from '@/src/services/soundService';

import '../global.css'; 

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    const inicializarAplicacion = async () => {
      try {
        await SplashScreen.hideAsync();
        await SoundService.reproducir('inicio');
      } catch (error) {
        console.log("Error al inicializar los recursos de carga:", error);
      }
    };

    inicializarAplicacion();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <ThemeProvider value={DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="registro" options={{ headerShown: false }} />
              <Stack.Screen name="(homes)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen name="mesa/[numero]" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
            </Stack>
            
            <StatusBar style="light" /> 
          </ThemeProvider>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}