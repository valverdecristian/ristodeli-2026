import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { MyIcon } from '../../shared/components/Icon';
import { colors } from '../../theme/colors';
import { globalStyles } from '../../theme/globalStyles';
import { FotoService } from '../../core/services/FotoService';
import { ToastService } from '../../core/services/ToastService';
import { StorageService } from '../../core/services/StorageService';
import { supabase } from '../../core/services/supabase';

export const RegistroAnonimo = ({ navigation }: any) => {
  const [nombre, setNombre] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tomarFotografia = async () => {
    try {
      const uri = await FotoService.sacarFoto();
      if (uri) {
        setFotoUri(uri);
      }
    } catch (error) {
      console.log('Error al tomar foto', error);
    }
  };

  const registrarAnonimo = async () => {
    if (nombre.length < 3) {
      ToastService.mostrarError('Por favor ingrese un nombre válido (mínimo 3 letras).');
      return;
    }
    if (!fotoUri) {
      ToastService.mostrarError('Es obligatorio tomarse una fotografía.');
      return;
    }

    setLoading(true);

    try {
      // 1. Subir la foto al bucket 'avatares'
      const urlPublica = await StorageService.subirImagen(fotoUri, 'avatares');

      if (!urlPublica) throw new Error('No se pudo subir la imagen.');

      // 2. Insertar en Supabase DB con el link
      const { error } = await supabase
        .from('usuarios')
        .insert({
          nombres: nombre,
          foto: urlPublica,
          rol: 'cliente_anon'
        });

      if (error) throw error;

      ToastService.mostrarExito('¡Registro exitoso!');
      navigation.replace('Home');

    } catch (error: any) {
      ToastService.mostrarError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={globalStyles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MyIcon name="arrow-back-outline" size={30} color={colors.vanillaCream} />
        </TouchableOpacity>

        <Text style={styles.title}>Ingreso Anónimo</Text>
        <Text style={styles.subtitle}>Ingresa tu nombre y tómate una foto para continuar hacia el menú.</Text>

        <View style={styles.fotoContainer}>
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <MyIcon name="camera-outline" size={50} color={colors.russet} />
            </View>
          )}
          <TouchableOpacity style={styles.btnCamara} onPress={tomarFotografia}>
            <Text style={styles.btnCamaraText}>{fotoUri ? 'Cambiar Foto' : 'Tomar Foto'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nombre o Apodo"
            placeholderTextColor={colors.russet}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <TouchableOpacity style={styles.buttonPrimary} onPress={registrarAnonimo}>
          <Text style={styles.buttonTextPrimary}>INGRESAR COMO ANÓNIMO</Text>
        </TouchableOpacity>

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
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 32,
    color: colors.vanillaCream,
    fontFamily: 'serif',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.vanillaCream,
    marginBottom: 30,
    opacity: 0.9,
  },
  fotoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  fotoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.vanillaCream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.saffron,
    borderStyle: 'dashed',
  },
  fotoPreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: colors.saffron,
  },
  btnCamara: {
    marginTop: -20,
    backgroundColor: colors.saffron,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  btnCamaraText: {
    color: colors.russet,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 30,
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
  buttonPrimary: {
    backgroundColor: colors.purple, // Usamos el morado que estaba en Login para anónimo
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 3,
  },
  buttonTextPrimary: {
    color: colors.russet,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
