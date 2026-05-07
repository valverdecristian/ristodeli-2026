import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../core/services/supabase';
import { colors } from '../../theme/colors';
import { globalStyles } from '../../theme/globalStyles';

export const HomeScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        // Si no hay sesión, volver al login (protección de ruta básica)
        navigation.replace('Login');
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.saffron} />
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, styles.center]}>
      <Text style={styles.title}>¡Bienvenido!</Text>
      <Text style={styles.subtitle}>Conexión con Supabase exitosa</Text>
      
      <View style={styles.card}>
        <Text style={styles.infoText}>Has ingresado con la cuenta:</Text>
        <Text style={styles.emailText}>{user?.email}</Text>
        <Text style={styles.infoText}>ID (UUID):</Text>
        <Text style={styles.uuidText}>{user?.id}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.vanillaCream,
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.saffron,
    marginBottom: 40,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.vanillaCream,
    padding: 20,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.saffron,
  },
  infoText: {
    color: colors.russet,
    fontSize: 14,
    marginBottom: 5,
  },
  emailText: {
    color: colors.retroGreen,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  uuidText: {
    color: colors.purple,
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: colors.fireRed,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 3,
  },
  logoutText: {
    color: colors.vanillaCream,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  }
});
