import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home } from '@features/home/Home';
import { SplashScreen } from '@features/splash/SplashScreen';
import { Login } from '@features/auth/Login';
import { RegistroAnonimo } from '@features/auth/RegistroAnonimo';
import { RegistroCliente } from '@features/auth/RegistroCliente';
import { AgregarMesa } from '@features/admin/AgregarMesa';
import { ListadoMesas } from '@features/admin/ListadoMesas';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="RegistroAnonimo" component={RegistroAnonimo} options={{ headerShown: false }} />
      <Stack.Screen name="RegistroCliente" component={RegistroCliente} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={Home} options={{ title: 'Ristodeli', headerShown: false }} />
      <Stack.Screen name="AgregarMesa" component={AgregarMesa} options={{ title: 'Nueva Mesa' }} />
      <Stack.Screen name="ListadoMesas" component={ListadoMesas} options={{ title: 'Listado de Mesas', headerShown: true }} />
    </Stack.Navigator>
  );
};
