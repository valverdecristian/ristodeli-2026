import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@navigation/AppNavigator';
import { StatusBar, useColorScheme } from 'react-native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { colors } from './src/theme/colors';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.retroGreen, backgroundColor: colors.retroGreen, borderRadius: 8, elevation: 4 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', color: colors.vanillaCream }}
      text2Style={{ fontSize: 14, color: colors.vanillaCream }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: colors.fireRed, backgroundColor: colors.fireRed, borderRadius: 8, elevation: 4 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', color: colors.vanillaCream }}
      text2Style={{ fontSize: 14, color: colors.vanillaCream }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.saffron, backgroundColor: colors.saffron, borderRadius: 8, elevation: 4 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold', color: colors.russet }}
      text2Style={{ fontSize: 14, color: colors.russet }}
    />
  )
};

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';


  console.log('--- CONFIGURACIÓN DE SUPABASE ---');
  console.log('URL:', SUPABASE_URL);
  console.log('KEY:', SUPABASE_ANON_KEY ? 'Cargada correctamente ✅' : 'No encontrada ❌');
  console.log('---------------------------------');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}

export default App;
