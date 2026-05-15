import { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreenCustom() {
  const router = useRouter();

  useEffect(() => {
    // A los 3 segundos de mostrar los nombres y el logo, saltamos al Login
    const timer = setTimeout(() => {
      router.replace('/login'); 
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-primary justify-between items-center py-16">
      
      {/* SECCIÓN SUPERIOR: Nombres del equipo */}
      <View className="items-center mt-10">
        <Text className="text-secondary text-2xl font-serif tracking-widest mb-3">
          Chavez Alejo
        </Text>
        <Text className="text-secondary text-2xl font-serif tracking-widest mb-3">
          Trkmic Torres Ignacio
        </Text>
        <Text className="text-secondary text-2xl font-serif tracking-widest">
          Valverde Cristian Jorge
        </Text>
      </View>

      {/* SECCIÓN CENTRAL: Logo */}
      <View className="items-center justify-center shadow-2xl">
        <Image 
          // Ajustá esta ruta si tu logo está en otra carpeta
          source={require('@/assets/images/icon.png')} 
          style={{ width: 220, height: 220, borderRadius: 110 }}
          resizeMode="contain"
        />
      </View>

      {/* SECCIÓN INFERIOR: Título de la app */}
      <View className="mb-10">
        <Text className="text-secondary text-[45px] font-serif tracking-[8px]">
          RISTODELI
        </Text>
      </View>

    </SafeAreaView>
  );
}