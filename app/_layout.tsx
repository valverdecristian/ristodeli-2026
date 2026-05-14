import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css'; // <-- La magia de Tailwind

// 1. Evitamos que el splash se oculte antes de tiempo
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {

  // 2. Controlamos cuándo ocultar el splash screen
  useEffect(() => {
    // Más adelante acá vas a poder chequear si el usuario está logueado en Supabase
    // Por ahora, simplemente lo ocultamos al renderizar
    SplashScreen.hideAsync();
  }, []);

  return (
    // 3. Envolvemos todo en SafeAreaProvider
    <SafeAreaProvider>
      {/* 4. Forzamos DefaultTheme cumpliendo el requerimiento del TFI */}
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          {/* Es buena práctica dejar la ruta de error por si falla la navegación */}
          <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
        </Stack>
        {/* Forzamos la barra de estado en "dark" para que contraste con fondos claros */}
        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}