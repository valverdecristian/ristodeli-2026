import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

<<<<<<< HEAD
SplashScreen.preventAutoHideAsync();
=======
import { Colors } from "@/src/constants/theme";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { HapticTab } from "@/src/components/haptic-tab";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
>>>>>>> abe52bb633add7cf6ee79eaffa034b6319ae3c97

export default function RootLayout() {
  useEffect(() => {
    // Simula una carga (fuentes, auth, etc.) y despues oculta el splash
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 2000);
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" /> 
      </Stack>
    </SafeAreaProvider>
  );
}