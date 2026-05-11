import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { MyIcon } from '../../shared/components/Icon';
import { colors } from '../../theme/colors';
import { FotoService } from '../../core/services/FotoService';
import { ToastService } from '../../core/services/ToastService';
import { StorageService } from '../../core/services/StorageService';
import { supabase } from '../../core/services/supabase';

export const RegistroAnonimo = ({ navigation }: any) => {
  const [nombre, setNombre] = useState('');
  const [fotoData, setFotoData] = useState<{ uri: string; base64: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const tomarFotografia = async () => {
    try {
      const foto = await FotoService.sacarFoto();
      if (foto) {
        setFotoData(foto);
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
    if (!fotoData) {
      ToastService.mostrarError('Es obligatorio tomarse una fotografía.');
      return;
    }

    setLoading(true);

    try {
      // 1. Subir la foto al bucket 'avatares' usando el base64
      const urlPublica = await StorageService.subirImagen(fotoData.base64, 'avatares', true);

      if (!urlPublica) throw new Error('No se pudo subir la imagen.');

      // 2. Insertar en Supabase DB directamente a la tabla 'anonimos'
      const { error } = await supabase
        .from('anonimos')
        .insert({
          nombre: nombre,
          foto: urlPublica,
          push_token: 'token_pendiente' // TODO: Reemplazar con el token real de FCM/OneSignal
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
    <KeyboardAvoidingView className="flex-1 bg-retro-green" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerClassName="flex-grow px-8 py-10">

        <TouchableOpacity className="mb-5 self-start" onPress={() => navigation.goBack()}>
          <MyIcon name="arrow-back-outline" size={30} color={colors.vanillaCream} />
        </TouchableOpacity>

        <Text className="text-3xl text-vanilla-cream font-serif font-bold mb-3">Ingreso Anónimo</Text>
        <Text className="text-base text-vanilla-cream/90 mb-8">Ingresa tu nombre y tómate una foto para continuar hacia el menú.</Text>

        <View className="items-center mb-10">
          {fotoData ? (
            <TouchableOpacity onPress={tomarFotografia}>
              <Image source={{ uri: fotoData.uri }} className="w-36 h-36 rounded-full border-2 border-saffron" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity className="w-36 h-36 rounded-full bg-vanilla-cream justify-center items-center border-2 border-dashed border-saffron" onPress={tomarFotografia}>
              <MyIcon name="camera-outline" size={50} color={colors.russet} />
            </TouchableOpacity>
          )}
          <TouchableOpacity className="-mt-5 bg-saffron px-5 py-2 rounded-full shadow-sm" onPress={tomarFotografia}>
            <Text className="text-russet font-bold">{fotoData ? 'Cambiar Foto' : 'Tomar Foto'}</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-8">
          <TextInput
            className="bg-vanilla-cream rounded-2xl px-5 py-4 text-base text-russet mb-4"
            placeholder="Nombre o Apodo"
            placeholderTextColor={colors.russet}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <TouchableOpacity className="bg-purple rounded-full py-4 items-center shadow-sm" onPress={registrarAnonimo}>
          <Text className="text-russet text-base font-bold tracking-wider">ENTRAR COMO ANÓNIMO</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};
