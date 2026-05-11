import React, { FC, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { MyIcon } from '../../shared/components/Icon';
import { colors } from '../../theme/colors';
import { supabase } from '@core/services/supabase';

import { ToastService } from '@core/services/ToastService';

interface LoginProps {
  navigation: any;
}

export const Login: FC<LoginProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Función para rellenar los inputs automáticamente al tocar los accesos rápidos
  const handleQuickAccess = (role: string) => {
    const credentials: Record<string, string> = {
      admin: 'admin@ristodeli.com',
      mozo: 'mozo1@ristodeli.com',
      metre: 'metre@ristodeli.com',
      supervisor: 'supervisor@ristodeli.com',
      cocinero: 'cocinero1@ristodeli.com',
      cantinero: 'cantinero1@ristodeli.com',
    };
    setEmail(credentials[role]);
    setPassword('12345678');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      ToastService.mostrarAdvertencia('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      ToastService.mostrarError(error.message);
    } else {
      ToastService.mostrarExito('¡Bienvenido a Ristodeli!');
      navigation.replace('Home');
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-retro-green" 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-8 py-5" showsVerticalScrollIndicator={false}>
        
        <View className="items-center mb-8 mt-5">
          <Image 
            source={require('../../../assets/icon.png')} 
            className="w-24 h-24" 
            resizeMode="contain"
          />
        </View>

        <View className="w-full mb-4">
          <TextInput
            className="bg-vanilla-cream rounded-full px-5 py-4 text-base text-russet mb-4 text-center font-bold"
            placeholder="Correo Electrónico"
            placeholderTextColor={colors.russet}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            className="bg-vanilla-cream rounded-full px-5 py-4 text-base text-russet mb-4 text-center font-bold"
            placeholder="Contraseña"
            placeholderTextColor={colors.russet}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View className="w-full mb-8">
          <TouchableOpacity className="bg-saffron rounded-full py-4 items-center shadow-sm" onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.russet} /> : <Text className="text-russet text-sm font-bold tracking-wider">INICIAR SESIÓN</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-saffron rounded-full py-4 items-center shadow-sm mt-3"
            onPress={() => navigation.navigate('RegistroCliente')} 
          >
            <Text className="text-russet text-sm font-bold tracking-wider">REGISTRARSE</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-purple rounded-full py-4 items-center shadow-sm mt-4"
            onPress={() => navigation.navigate('RegistroAnonimo')} 
          >
            <Text className="text-russet text-sm font-bold tracking-wider">REGISTRARSE COMO ANÓNIMO</Text>
          </TouchableOpacity>
        </View>

        {/* Accesos rápidos */}
        <View className="items-center">
          <View className="flex-row justify-center mb-4 gap-5">
            {['admin', 'mozo', 'metre'].map(role => (
              <TouchableOpacity key={role} className="w-14 h-14 rounded-full bg-saffron justify-center items-center shadow-sm" onPress={() => handleQuickAccess(role)}>
                <MyIcon name={role === 'admin' ? 'shield-outline' : role === 'mozo' ? 'person-outline' : 'notifications-outline'} size={30} color={colors.russet} />
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row justify-center mb-4 gap-5">
            {['supervisor', 'cocinero', 'cantinero'].map(role => (
              <TouchableOpacity key={role} className="w-14 h-14 rounded-full bg-saffron justify-center items-center shadow-sm" onPress={() => handleQuickAccess(role)}>
                <MyIcon name={role === 'supervisor' ? 'clipboard-outline' : role === 'cocinero' ? 'flame-outline' : 'wine-outline'} size={30} color={colors.russet} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
