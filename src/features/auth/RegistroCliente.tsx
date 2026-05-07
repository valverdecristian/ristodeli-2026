import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { MyIcon } from '../../shared/components/Icon';
import { colors } from '../../theme/colors';
import { globalStyles } from '../../theme/globalStyles';
import { FotoService } from '../../core/services/FotoService';
import { ToastService } from '../../core/services/ToastService';
import { supabase } from '../../core/services/supabase';
import { StorageService } from '../../core/services/StorageService';
import { ActivityIndicator } from 'react-native';

export const RegistroCliente = ({ navigation }: any) => {
  const [step, setStep] = useState(1);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombres: '',
    apellidos: '',
    dni: '',
    cuil: '',
  });

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const tomarFotografia = async () => {
    try {
      const uri = await FotoService.sacarFoto();
      if (uri) {
        setFotoUri(uri);
      }
    } catch (error) {
      console.log('Error foto', error);
    }
  };

  const escanearDocumento = () => {
    ToastService.mostrarAdvertencia('Escáner de DNI en desarrollo...');
  };

  const enviarFormulario = async () => {
    if (formData.password !== formData.confirmPassword) {
      ToastService.mostrarError('Las contraseñas no coinciden.');
      return;
    }
    if (!fotoUri) {
      ToastService.mostrarError('Es obligatorio tomarse una fotografía.');
      return;
    }
    
    setLoading(true);

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'cliente',
            nombres: formData.nombres,
            apellidos: formData.apellidos,
          }
        }
      });

      if (authError) throw authError;

      // 2. Subir foto al Storage
      let urlPublica = '';
      if (fotoUri) {
        const url = await StorageService.subirImagen(fotoUri, 'avatares');
        if (url) urlPublica = url;
      }

      // 3. Insertar datos adicionales en la tabla 'usuarios'
      const { error: dbError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user?.id, // Vinculamos con el ID de Auth
          email: formData.email,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          dni: formData.dni,
          cuil: formData.cuil,
          foto: urlPublica,
          rol: 'cliente_reg'
        });

      if (dbError) throw dbError;

      ToastService.mostrarExito('¡Registro exitoso!');
      navigation.replace('Home');
    } catch (error: any) {
      ToastService.mostrarError(error.message || 'Error al registrar el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={globalStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
            <MyIcon name="arrow-back-outline" size={30} color={colors.vanillaCream} />
          </TouchableOpacity>
          <Text style={styles.stepText}>Paso {step} de 2</Text>
        </View>

        <Text style={styles.title}>Registro de Cliente</Text>

        {step === 1 ? (
          <View style={styles.stepContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Nombres" 
              placeholderTextColor={colors.russet} 
              value={formData.nombres} 
              onChangeText={(val) => handleChange('nombres', val)} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Apellidos" 
              placeholderTextColor={colors.russet} 
              value={formData.apellidos} 
              onChangeText={(val) => handleChange('apellidos', val)} 
            />
            
            <View style={styles.inputWithIcon}>
              <TextInput 
                style={[styles.input, {flex: 1, marginBottom: 0}]} 
                placeholder="DNI" 
                placeholderTextColor={colors.russet} 
                keyboardType="numeric" 
                value={formData.dni} 
                onChangeText={(val) => handleChange('dni', val)} 
              />
              <TouchableOpacity style={styles.scanBtn} onPress={escanearDocumento}>
                <MyIcon name="barcode-outline" size={24} color={colors.russet} />
              </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="CUIL" 
              placeholderTextColor={colors.russet} 
              keyboardType="numeric" 
              value={formData.cuil} 
              onChangeText={(val) => handleChange('cuil', val)} 
            />
            
            <TouchableOpacity style={styles.buttonPrimary} onPress={() => setStep(2)}>
              <Text style={styles.buttonTextPrimary}>SIGUIENTE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <View style={styles.fotoContainer}>
              {fotoUri ? (
                <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
              ) : (
                <View style={styles.fotoPlaceholder}>
                  <MyIcon name="person-circle-outline" size={60} color={colors.russet} />
                </View>
              )}
              <TouchableOpacity style={styles.btnCamara} onPress={tomarFotografia}>
                <MyIcon name="camera-outline" size={20} color={colors.russet} style={{marginRight: 5}}/>
                <Text style={styles.btnCamaraText}>{fotoUri ? 'Cambiar Foto' : 'Tomar Foto'}</Text>
              </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Correo Electrónico" 
              placeholderTextColor={colors.russet} 
              keyboardType="email-address" 
              autoCapitalize="none" 
              value={formData.email} 
              onChangeText={(val) => handleChange('email', val)} 
            />
            
            <View style={styles.inputWithIcon}>
              <TextInput 
                style={[styles.input, {flex: 1, marginBottom: 0}]} 
                placeholder="Contraseña" 
                placeholderTextColor={colors.russet} 
                secureTextEntry={!mostrarPassword} 
                value={formData.password} 
                onChangeText={(val) => handleChange('password', val)} 
              />
              <TouchableOpacity style={styles.scanBtn} onPress={() => setMostrarPassword(!mostrarPassword)}>
                <MyIcon name={mostrarPassword ? "eye-off-outline" : "eye-outline"} size={24} color={colors.russet} />
              </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Confirmar Contraseña" 
              placeholderTextColor={colors.russet} 
              secureTextEntry={!mostrarPassword} 
              value={formData.confirmPassword} 
              onChangeText={(val) => handleChange('confirmPassword', val)} 
            />

            <TouchableOpacity style={styles.buttonPrimary} onPress={enviarFormulario} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.russet} />
              ) : (
                <Text style={styles.buttonTextPrimary}>REGISTRARSE</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepText: {
    color: colors.vanillaCream,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    color: colors.vanillaCream,
    fontFamily: 'serif',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  stepContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: colors.vanillaCream,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.russet,
    marginBottom: 15,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  scanBtn: {
    backgroundColor: colors.saffron,
    padding: 15,
    borderRadius: 15,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.saffron,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  buttonTextPrimary: {
    color: colors.russet,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  fotoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  fotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.vanillaCream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.saffron,
    borderStyle: 'dashed',
  },
  fotoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.saffron,
  },
  btnCamara: {
    marginTop: -15,
    backgroundColor: colors.saffron,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  btnCamaraText: {
    color: colors.russet,
    fontWeight: 'bold',
    fontSize: 12,
  },
});
