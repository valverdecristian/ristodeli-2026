import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/src/context/ToastContext';

import '../global.css'; // <-- La magia de Tailwind

// 1. Evitamos que el splash se oculte antes de tiempo
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <ToastProvider>
      <ThemeProvider value={DefaultTheme}>
        {/* Agregamos screenOptions para apagar todos los encabezados por defecto */}
        <Stack screenOptions={{ headerShown: false }}>
          
          {/* Declaramos explícitamente el grupo (homes) para asegurar que no tenga header */}
          <Stack.Screen name="(homes)" options={{ headerShown: false }} />
          
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
        </Stack>
        
        <StatusBar style="light" /> 
      </ThemeProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}