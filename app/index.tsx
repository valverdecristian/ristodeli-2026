import { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreenCustom() {
  const router = useRouter();

  // 2. Creamos el "motor" de la animación (arranca en el valor 0)
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 3. Encendemos el motor para que vaya de 0 a 1 exactamente en 3 segundos
    Animated.timing(rotateValue, {
      toValue: 1, 
      duration: 3000, 
      easing: Easing.linear, // linear hace que el giro sea constante, sin acelerar ni frenar
      useNativeDriver: true, // Optimización nativa para que no trabe la pantalla
    }).start();

    // A los 3 segundos saltamos al Login
    const timer = setTimeout(() => {
      router.replace('/login'); 
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, rotateValue]);

  // 4. "Traducimos" ese valor de 0 a 1 a grados reales (de 0 a 360 grados)
  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView className="flex-1 bg-primary justify-between items-center py-16">
      
      {/* SECCIÓN SUPERIOR: Nombres del equipo */}
      <View className="items-center mt-10">
        <Text className="text-secondary text-4xl font-serif tracking-widest mb-3">
          Chavez Alejo
        </Text>
        <Text className="text-secondary text-4xl font-serif tracking-widest mb-3">
          Trkmic Torres Ignacio
        </Text>
        <Text className="text-secondary text-4xl font-serif tracking-widest">
          Valverde Cristian Jorge
        </Text>
      </View>

      {/* SECCIÓN CENTRAL: Logo Animado */}
      <View className="items-center justify-center shadow-2xl">
        {/* 5. Cambiamos la etiqueta <Image> por <Animated.Image> y le inyectamos el giro */}
        <Animated.Image 
          source={require('@/assets/images/icon.png')} 
          style={{ 
            width: 220, 
            height: 220, 
            borderRadius: 110,
            transform: [{ rotate: spin }] // <-- Acá aplicamos la magia de la rotación
          }}
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