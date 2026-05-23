import { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreenCustom() {
  const router = useRouter();

  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateValue, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, rotateValue]);

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView className="flex-1 bg-primary justify-between items-center py-16">

      {/* SECCION SUPERIOR: Nombres del equipo */}
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

      {/* SECCION CENTRAL: Logo Animado */}
      <View className="items-center justify-center shadow-2xl">
        <Animated.Image
          source={require('@/assets/images/icon.png')}
          style={{
            width: 220,
            height: 220,
            borderRadius: 110,
            transform: [{ rotate: spin }]
          }}
          resizeMode="contain"
        />
      </View>

      {/* SECCION INFERIOR: Titulo de la app */}
      <View className="mb-10">
        <Text className="text-secondary text-[45px] font-serif tracking-[8px]">
          RISTODELI
        </Text>
      </View>

    </SafeAreaView>
  );
}