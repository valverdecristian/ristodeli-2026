import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@features/home/HomeScreen';
import { SplashScreen } from '@features/splash/SplashScreen';
import { Login } from '@features/auth/Login';
import { RegistroAnonimo } from '@features/auth/RegistroAnonimo';
import { RegistroCliente } from '@features/auth/RegistroCliente';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="RegistroAnonimo" component={RegistroAnonimo} options={{ headerShown: false }} />
      <Stack.Screen name="RegistroCliente" component={RegistroCliente} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Ristodeli', headerShown: false }} />
    </Stack.Navigator>
  );
};
