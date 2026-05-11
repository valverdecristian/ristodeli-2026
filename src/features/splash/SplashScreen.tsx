import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export const SplashScreen = ({ navigation }: any) => {
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de rotación (como la clase .rotating-logo en CSS)
    const startRotation = () => {
      Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    startRotation();

    // Navegar a la siguiente pantalla después de 4 segundos
    const timer = setTimeout(() => {
      if (navigation) {
        navigation.replace('Login');
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigation, rotateValue]);

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="flex-1 bg-retro-green justify-between items-center py-20">
      {/* Nombres de los integrantes */}
      <View className="items-center mt-5">
        <Text className="text-vanilla-cream text-2xl font-serif mb-2 tracking-wider">Chavez Alejo</Text>
        <Text className="text-vanilla-cream text-2xl font-serif mb-2 tracking-wider">Trkmic Torres Ignacio</Text>
        <Text className="text-vanilla-cream text-2xl font-serif mb-2 tracking-wider">Valverde Cristian Jorge</Text>
      </View>

      {/* Logo rotatorio */}
      <View className="justify-center items-center bg-retro-green rounded-full p-2.5 shadow-2xl elevation-2xl" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15 }}>
        <Animated.Image 
          source={require('../../../assets/icon.png')} 
          style={[{ width: 200, height: 200 }, { transform: [{ rotate: spin }] }]} 
          resizeMode="contain"
        />
      </View>

      {/* Nombre de la app */}
      <View className="mb-10">
        <Text className="text-vanilla-cream text-5xl font-serif tracking-[3px]">RISTODELI</Text>
      </View>
    </View>
  );
};


