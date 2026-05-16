import { useAuth } from '@/src/context/AuthContext';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HomeButton {
  title: string;
  icon: string; 
  onPress: () => void;
}

interface HomeBaseProps {
  roleTitle: string;
  buttons: HomeButton[];
}

export default function HomeBase({ roleTitle, buttons }: HomeBaseProps) {
  const router = useRouter();
  const { cerrarSesion } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false); 

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoggingOut(true); 

    try {
      await SoundService.reproducir('cierre');
      // cerrarSesion() hace signOut + limpia el contexto global (currentUser, currentSession)
      await cerrarSesion();
    } catch (error) {
      console.log("Fallo multimedia o de red en el deslogueo:", error);
    } finally {
      setIsLoggingOut(false);
      router.replace('/'); 
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-primary">
      
      {/* 1. INDICADOR VISUAL (SPINNER) DE CIERRE */}
      <Modal transparent={true} visible={isLoggingOut} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-primary p-10 rounded-3xl items-center border-2 border-tertiary shadow-2xl">
            {/* Logo de la empresa en la espera [cite: 51] */}
            <View className="bg-secondary rounded-full p-2 mb-4 border border-tertiary">
              <Image 
                source={require('../../assets/images/icon.png')} 
                className="w-12 h-12" 
                resizeMode="contain" 
              />
            </View>
            <ActivityIndicator size="large" color="#F5C065" />
            <Text className="text-secondary font-bold mt-4 text-lg text-center">
              Cerrando sesión de forma segura...
            </Text>
          </View>
        </View>
      </Modal>

      {/* 2. ENCABEZADO SUPERIOR */}
      <View className="bg-tertiary px-6 pt-12 pb-4 flex-row justify-between items-center shadow-md">
        <Text className="text-primary font-bold text-2xl uppercase tracking-tight">
          {roleTitle}
        </Text>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={30} color="#31603D" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        className="px-6"
        showsVerticalScrollIndicator={false}
      >
        {/* 3. LOGO CENTRAL */}
        <View className="items-center my-8">
          <View className="bg-secondary/10 rounded-full p-4 border border-secondary/20 shadow-sm">
            <Image 
              source={require('../../assets/images/icon.png')} 
              className="w-24 h-24" 
              resizeMode="contain" 
            />
          </View>
        </View>

        {/* 4. GRILLA DE BOTONES (2 COLUMNAS) */}
        <View className="flex-row flex-wrap justify-between pb-10">
          {buttons.map((btn, index) => (
            <TouchableOpacity
              key={index}
              onPress={btn.onPress}
              style={{ elevation: 8 }} 
              className="bg-tertiary w-[47%] aspect-square rounded-[35px] p-4 items-center justify-center mb-6 shadow-xl active:bg-secondary"
            >
              <View className="bg-primary/10 p-4 rounded-full mb-3">
                <Ionicons name={btn.icon as any} size={42} color="#31603D" />
              </View>
              <Text className="text-primary font-extrabold text-center text-[15px] uppercase leading-tight">
                {btn.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}