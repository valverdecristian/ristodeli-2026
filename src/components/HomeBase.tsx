import { useAuth } from '@/src/context/AuthContext';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LoadingModal from '@/src/components/LoadingModal';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HomeButton {
  title: string;
  icon: string; 
  onPress: () => void;
  badge?: number;
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
      
      <LoadingModal visible={isLoggingOut} message="Cerrando sesión de forma segura..." />

      {/* ENCABEZADO SUPERIOR */}
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
        {/* LOGO CENTRAL */}
        <View className="items-center my-8">
          <View className="bg-secondary/10 rounded-full p-4 border border-secondary/20 shadow-sm">
            <Image 
              source={require('../../assets/images/icon.png')} 
              className="w-24 h-24" 
              resizeMode="contain" 
            />
          </View>
        </View>

        {/* GRILLA DE BOTONES */}
        <View className="flex-row flex-wrap justify-between pb-10">
          {buttons.map((btn, index) => (
            <TouchableOpacity
              key={index}
              onPress={btn.onPress}
              style={{ elevation: 8 }} 
              className="bg-tertiary w-[47%] aspect-square rounded-[35px] p-4 items-center justify-center mb-6 shadow-xl active:bg-secondary"
            >
              {btn.badge ? (
                <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-7 h-7 items-center justify-center z-10 shadow-lg border-2 border-tertiary">
                  <Text className="text-white font-black text-[11px]">{btn.badge > 99 ? '99+' : btn.badge}</Text>
                </View>
              ) : null}
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