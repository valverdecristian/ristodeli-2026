import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../theme/colors';

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
    <View style={styles.container}>
      {/* Nombres de los integrantes */}
      <View style={styles.namesContainer}>
        <Text style={styles.nameText}>Chavez Alejo</Text>
        <Text style={styles.nameText}>Trkmic Torres Ignacio</Text>
        <Text style={styles.nameText}>Valverde Cristian Jorge</Text>
      </View>

      {/* Logo rotatorio */}
      <View style={styles.logoWrapper}>
        <Animated.Image 
          source={require('../../../assets/icon.png')} 
          style={[styles.logo, { transform: [{ rotate: spin }] }]} 
          resizeMode="contain"
        />
      </View>

      {/* Nombre de la app */}
      <View style={styles.appNameContainer}>
        <Text style={styles.appName}>RISTODELI</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.retroGreen,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
  },
  namesContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  nameText: {
    color: colors.vanillaCream,
    fontSize: 22,
    fontFamily: 'serif',
    marginBottom: 8,
    letterSpacing: 1,
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    // Creamos la sombra y el fondo del logo de la imagen
    backgroundColor: colors.retroGreen,
    borderRadius: 150,
    padding: 10,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  logo: {
    width: 200,
    height: 200,
  },
  appNameContainer: {
    marginBottom: 40,
  },
  appName: {
    color: colors.vanillaCream,
    fontSize: 48,
    fontFamily: 'serif',
    letterSpacing: 3,
  },
});
