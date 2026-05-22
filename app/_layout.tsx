import { AuthProvider } from '@/src/context/AuthContext';
import { ToastProvider } from '@/src/context/ToastContext';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router'; // 🌟 Agregamos useRouter
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SoundService } from '@/src/services/soundService';
import * as Notifications from 'expo-notifications'; // 🌟 Importamos Notifications

import '../global.css'; 

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // 🌟 Instanciamos el router para poder hacer las redirecciones
  const router = useRouter(); 

  // Efecto 1: Inicialización de la app (Tu código original)
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

  // 🌟 Efecto 2: Escuchador global de Notificaciones
  useEffect(() => {
    // Este código "despierta" cuando el usuario toca la notificación
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      // Extraemos la "mochila" de datos que mandamos desde el NotificationService
      const data = response.notification.request.content.data;
      console.log("[RootLayout] Notificación tocada con datos:", data);

      // Si viene la propiedad 'pantalla', ejecutamos la redirección
      if (data && data.pantalla) {
        if (data.pantalla === 'homeCliente') {
          router.push('/(tabs)/home' as any); 
        } else if (data.pantalla === 'listaEspera') {
          // Si es el metre, lo mandamos a su pantalla principal (puedes ajustar esta ruta a la vista exacta de tu lista)
          router.push('/(homes)/metre' as any);
        } else if (data.pantalla === 'aprobaciones') {
          // Si es el staff de aprobación, lo mandamos a su pantalla de aprobaciones
          router.push('/(homes)/supervisor/aprobaciones' as any);
        } else if (data.pantalla === 'chatCliente') {
          // Si es el cliente, lo mandamos al chat (ajusta la ruta y los parámetros según tu estructura)
          router.push('/(tabs)/mesa/chatMozo' as any);
        } else if (data.pantalla === 'consultasClientes') {
          // Si es el mozo, lo mandamos a la pantalla de consultas de clientes
          router.push('/(homes)/mozo/consultasClientes' as any);
        }
      }
    });

    // Limpieza de memoria vital para evitar fugas cuando se cierra la app
    return () => subscription.remove();
  }, [router]);

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