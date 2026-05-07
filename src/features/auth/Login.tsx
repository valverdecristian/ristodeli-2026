import React, { FC, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { MyIcon } from '../../shared/components/Icon';
import { colors } from '../../theme/colors';
import { supabase } from '@core/services/supabase';
import { globalStyles } from '../../theme/globalStyles';
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
      style={globalStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Correo Electrónico"
            placeholderTextColor={colors.russet}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={colors.russet}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.buttonPrimary} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.russet} /> : <Text style={styles.buttonTextPrimary}>INICIAR SESIÓN</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.buttonPrimary, { marginTop: 10 }]}
            onPress={() => navigation.navigate('RegistroCliente')} 
          >
            <Text style={styles.buttonTextPrimary}>REGISTRARSE</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.buttonPurple}
            onPress={() => navigation.navigate('RegistroAnonimo')} 
          >
            <Text style={styles.buttonTextPurple}>REGISTRARSE COMO ANÓNIMO</Text>
          </TouchableOpacity>
        </View>

        {/* Accesos rápidos */}
        <View style={styles.quickAccessContainer}>
          <View style={styles.row}>
            {['admin', 'mozo', 'metre'].map(role => (
              <TouchableOpacity key={role} style={styles.iconButton} onPress={() => handleQuickAccess(role)}>
                <MyIcon name={role === 'admin' ? 'shield-outline' : role === 'mozo' ? 'person-outline' : 'notifications-outline'} size={30} color={colors.russet} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row}>
            {['supervisor', 'cocinero', 'cantinero'].map(role => (
              <TouchableOpacity key={role} style={styles.iconButton} onPress={() => handleQuickAccess(role)}>
                <MyIcon name={role === 'supervisor' ? 'clipboard-outline' : role === 'cocinero' ? 'flame-outline' : 'wine-outline'} size={30} color={colors.russet} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0,0,0,0.1)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  formContainer: {
    width: '100%',
    marginBottom: 15,
  },
  input: {
    backgroundColor: colors.vanillaCream,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.russet,
    marginBottom: 15,
    textAlign: 'center', 
    fontWeight: 'bold',
  },
  buttonsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  buttonPrimary: {
    backgroundColor: colors.saffron,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonTextPrimary: {
    color: colors.russet,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buttonPurple: {
    backgroundColor: colors.purple,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginTop: 15,
  },
  buttonTextPurple: {
    color: colors.russet,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  quickAccessContainer: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 20, 
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.saffron,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
