import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const Icon = ({ emoji }: { emoji: string }) => <Text className="text-primary text-3xl mb-1">{emoji}</Text>;

export default function LoginScreen() {
  const router = useRouter();
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const profiles = [
    { id: 'dueño', label: 'Dueño', emoji: '👑', email: 'dueno@ristodeli.com', pass: '123456' },
    { id: 'supervisor', label: 'Supervisor', emoji: '🔑', email: 'supervisor@ristodeli.com', pass: '123456' },
    { id: 'metre', label: 'Metre', emoji: '📋', email: 'metre@ristodeli.com', pass: '123456' },
    { id: 'mozo', label: 'Mozo', emoji: '🍽️', email: 'mozo@ristodeli.com', pass: '123456' },
    { id: 'Cantinero', label: 'Cantinero', emoji: '🍸', email: 'cantinero@ristodeli.com', pass: '123456' },
    { id: 'cocinero', label: 'Cocinero', emoji: '👨‍🍳', email: 'cocinero@ristodeli.com', pass: '123456' },
  ];

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMessage('');
  };

  const handleLogin = async () => {
    setErrorMessage('');
    const emailRegex = /\S+@\S+\.\S+/;

    if (!email || !password) {
      setErrorMessage('Por favor, completa todos los campos.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!emailRegex.test(email)) {
      setErrorMessage('El formato del correo electrónico no es válido.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      
      switch (email.toLowerCase()) {
        case 'dueno@ristodeli.com':
          router.replace('/(homes)/duenio');
          break;
        case 'supervisor@ristodeli.com':
          router.replace('/(homes)/supervisor');
          break;
        case 'metre@ristodeli.com':
          router.replace('/(homes)/metre');
          break;
        case 'mozo@ristodeli.com':
          router.replace('/(homes)/mozo');
          break;
        case 'cantinero@ristodeli.com':
          router.replace('/(homes)/cantinero');
          break;
        case 'cocinero@ristodeli.com':
          router.replace('/(homes)/cocinero');
          break;
        default:
          router.replace('/(tabs)'); 
          break;
      }
    }, 2000);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <Modal transparent={true} visible={loading} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-primary p-10 rounded-3xl items-center border-2 border-tertiary shadow-2xl">
            <View className="bg-secondary rounded-full p-2 mb-4 border border-tertiary">
              <Image source={require('../../assets/images/icon.png')} className="w-12 h-12" resizeMode="contain" />
            </View>
            <ActivityIndicator size="large" color="#F5C065" />
            <Text className="text-secondary font-bold mt-4 text-lg">Iniciando sesión...</Text>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 bg-primary items-center justify-center px-10">
          
          <View className="bg-secondary rounded-full p-2 mb-10 shadow-2xl border-4 border-tertiary">
            <Image source={require('../../assets/images/icon.png')} className="w-24 h-24" resizeMode="contain" />
          </View>

          <View className="w-full">
            {errorMessage ? (
              <Text className="text-red-500 font-bold text-center mb-4 bg-white/20 p-2 rounded-lg">
                {errorMessage}
              </Text>
            ) : null}

            <TextInput 
              placeholder="Correo electrónico" 
              placeholderTextColor="#555" 
              value={email}
              onChangeText={setEmail}
              className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg shadow-md mb-6" 
            />
            <TextInput 
              placeholder="Contraseña" 
              placeholderTextColor="#555" 
              secureTextEntry 
              value={password}
              onChangeText={setPassword}
              className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg shadow-md mb-8" 
            />

            <TouchableOpacity 
              onPress={handleLogin}
              className="w-full bg-tertiary rounded-full py-4 shadow-lg border-b-4 border-orange active:opacity-90 mb-4"
            >
              <Text className="text-center font-bold text-primary text-xl uppercase">Iniciar sesión</Text>
            </TouchableOpacity>

            {/* BOTONES DE REGISTRO (VIOLETAS)  */}
            <View className="flex-row justify-between w-full">
              <TouchableOpacity 
                onPress={() => console.log('Ir a Registro')}
                className="bg-purple w-[48%] rounded-full py-3 shadow-md active:opacity-80"
              >
                <Text className="text-center font-bold text-primary text-sm uppercase">Registro</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => console.log('Ir a Registro Anónimo')}
                className="bg-purple w-[48%] rounded-full py-3 shadow-md active:opacity-80"
              >
                <Text className="text-center font-bold text-primary text-sm uppercase">Registro Anónimo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mt-10 items-center w-full">
            <View className="flex-row items-center justify-between w-full px-2 mb-2">
                <Text className="text-secondary font-bold text-lg">Acceso rápido</Text>
                <TouchableOpacity onPress={() => setShowQuickAccess(!showQuickAccess)} className="bg-secondary rounded-full p-2">
                  <Text className="text-primary text-xl" style={{ transform: [{ rotate: showQuickAccess ? '180deg' : '0deg' }] }}>▼</Text>
                </TouchableOpacity>
            </View>

            {showQuickAccess && (
              <View className="w-full bg-[#1e3d25] rounded-3xl p-4 shadow-inner border border-secondary/20">
                <View className="flex-row flex-wrap justify-between">
                    {profiles.map((profile) => (
                        <TouchableOpacity 
                            key={profile.id}
                            onPress={() => fillCredentials(profile.email, profile.pass)} 
                            className="bg-secondary w-[31%] aspect-square rounded-2xl p-2 items-center justify-center shadow-md mb-3 border-b-2 border-gray-300"
                        >
                            <Icon emoji={profile.emoji} />
                            <Text className="text-primary font-bold text-[9px] uppercase text-center">
                                {profile.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}