import React, { FC, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StatusBar, Modal, ActivityIndicator, } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MyIcon } from '../../shared/components/Icon';
import { colors } from '../../theme/colors';


// 1. IMPORTACIONES DE PLUGINS NATIVOS
import { launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useBarcodeScannerOutput } from 'react-native-vision-camera-barcode-scanner';

// 2. IMPORTACIONES DE SUPABASE Y SERVICIOS
import { supabase } from '../../core/services/supabase';
import { StorageService } from '../../core/services/StorageService';
import { ToastService } from '../../core/services/ToastService';

interface RegisterProps {
  navigation: any;
}

export const RegistroCliente: FC<RegisterProps> = ({ navigation }) => {
  // --- ESTADOS PARA DATOS ---
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [cuil, setCuil] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- ESTADOS PARA FUNCIONALIDAD NATIVA ---
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- CONFIGURACIÓN DE ESCÁNER DE DNI ---
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  // Escáner de códigos compatible con v5 usando CameraOutput
  const scannerOutput = useBarcodeScannerOutput({
    barcodeFormats: ['pdf-417'],
    onError: (error) => console.log('Scanner error:', error),
    onBarcodeScanned: (codes) => {
      if (codes.length > 0 && scannerVisible) {
        const rawData = codes[0].displayValue || codes[0].rawValue;
        if (rawData) {
          processDniData(rawData);
        }
      }
    }
  });

  // Función para pedir permisos de cámara al iniciar
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  // --- LÓGICA DE FOTO DE PERFIL ---
  const takeProfilePhoto = () => {
    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'front', // Foto selfie para el perfil
        quality: 0.7,
        includeBase64: false, // URI siempre
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorMessage) {
          ToastService.mostrarError(response.errorMessage);
          return;
        }
        if (response.assets && response.assets.length > 0) {
          setProfileImageUri(response.assets[0].uri || null);
        }
      }
    );
  };

  // --- LÓGICA DE ESCÁNER DE DNI ---
  const processDniData = (rawData: string) => {
    // Cerrar escáner
    setScannerVisible(false);

    /**
     * IMPORTANTE: El DNI Argentino usa PDF417.
     * El rawData es una cadena separada por pipes (|).
     * Ejemplo conceptual de parseo: "@DNI|APELLIDO|NOMBRE|GÉNERO|NÚMERO_DNI|..."
     * Aquí extraemos el Número de DNI, Nombre y Apellido.
     */
    try {
      const datos = rawData.split('@');
      const partes = datos.length > 1 ? datos[1].split('|') : rawData.split('|');
      
      if (partes.length > 4) {
        setDni(partes[4].trim()); 
        setNombre(partes[2].trim()); 
        setApellido(partes[1].trim());
        ToastService.mostrarExito('DNI Escaneado correctamente');
      } else {
        // Fallback si el formato es distinto
        setDni(rawData.replace(/\D/g, '').substring(0, 8)); 
      }
    } catch (e) {
      ToastService.mostrarError('Error al parsear datos del DNI');
    }
  };

  // --- LÓGICA DE ENVÍO A SUPABASE ---
  const enviarFormulario = async () => {
    if (!nombre || !apellido || !dni || !email || !password) {
      ToastService.mostrarAdvertencia('Por favor completa todos los campos requeridos.');
      return;
    }
    if (!profileImageUri) {
      ToastService.mostrarError('Es obligatorio tomarse una fotografía.');
      return;
    }
    
    setLoading(true);

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            role: 'cliente_reg', // Usamos cliente_reg como determinamos
            nombres: nombre,
            apellidos: apellido,
          }
        }
      });

      if (authError) throw authError;

      // 2. Subir foto al Storage
      let urlPublica = '';
      if (profileImageUri) {
        const url = await StorageService.subirImagen(profileImageUri, 'avatares');
        if (url) urlPublica = url;
      }

      // 3. Insertar datos adicionales en la tabla 'usuarios'
      const { error: dbError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user?.id, // Vinculamos con el ID de Auth
          email: email,
          nombres: nombre,
          apellidos: apellido,
          dni: dni,
          cuil: cuil,
          foto_url: urlPublica,
          perfil: 'cliente_reg' // Perfil en tabla usuarios
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
    <LinearGradient colors={['#0F2027', '#203A43', '#2C5364']} className="flex-1">
      <StatusBar barStyle="light-content" />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView contentContainerClassName="flex-grow px-8 py-10" showsVerticalScrollIndicator={false}>
            {/* Logo superior */}
            <View className="items-center mt-2 mb-5">
              <Text className="text-4xl font-bold text-vanilla-cream tracking-widest">RISTO</Text>
              <Text className="text-3xl font-bold text-saffron -mt-2">DELI</Text>
              <Text className="text-xs text-gray-300 mt-1">by ALFA DEVS</Text>
            </View>

            <Text className="text-2xl text-vanilla-cream font-bold text-center mb-5 tracking-wide">REGISTRO</Text>

            {/* --- SECTOR FOTO DE PERFIL --- */}
            <TouchableOpacity className="items-center mb-8" onPress={takeProfilePhoto}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} className="w-32 h-32 rounded-full" />
              ) : (
                <View className="w-32 h-32 rounded-full bg-vanilla-cream justify-center items-center border-2 border-black/10">
                  <MyIcon name="camera-outline" size={40} color={colors.russet} />
                  <Text className="mt-1 text-russet font-bold text-xs">Tomar Foto</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Inputs del formulario */}
            <View className="w-full">
              {/* Input Nombre */}
              <View className="flex-row items-center bg-vanilla-cream rounded-2xl mb-4 px-4">
                <MyIcon name="person-outline" size={20} color={colors.russet} style={{ marginRight: 10 }} />
                <TextInput className="flex-1 py-4 text-base text-russet font-bold" placeholder="Nombre" placeholderTextColor={colors.russet} value={nombre} onChangeText={setNombre} />
              </View>

              {/* Input Apellido */}
              <View className="flex-row items-center bg-vanilla-cream rounded-2xl mb-4 px-4">
                <MyIcon name="person-outline" size={20} color={colors.russet} style={{ marginRight: 10 }} />
                <TextInput className="flex-1 py-4 text-base text-russet font-bold" placeholder="Apellido" placeholderTextColor={colors.russet} value={apellido} onChangeText={setApellido} />
              </View>

              {/* --- INPUT DNI CON ESCÁNER --- */}
              <View className="flex-row items-center mb-4 gap-2">
                <View className="flex-row items-center bg-vanilla-cream rounded-2xl px-4 flex-1">
                  <MyIcon name="id-card-outline" size={20} color={colors.russet} style={{ marginRight: 10 }} />
                  <TextInput
                    className="flex-1 py-4 text-base text-russet font-bold"
                    placeholder="DNI"
                    placeholderTextColor={colors.russet}
                    value={dni}
                    onChangeText={setDni}
                    keyboardType="numeric"
                  />
                </View>
                {/* Botón para escanear */}
                <TouchableOpacity
                  className="w-12 h-14 rounded-2xl overflow-hidden shadow-sm"
                  onPress={() => setScannerVisible(true)}
                  disabled={!hasPermission}
                >
                  <LinearGradient colors={['#FF512F', '#DD2476']} className="flex-1 justify-center items-center">
                    <MyIcon name="scan-outline" size={22} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center bg-vanilla-cream rounded-2xl mb-4 px-4">
                <MyIcon name="calculator-outline" size={20} color={colors.russet} style={{ marginRight: 10 }} />
                <TextInput className="flex-1 py-4 text-base text-russet font-bold" placeholder="CUIL" placeholderTextColor={colors.russet} value={cuil} onChangeText={setCuil} keyboardType="numeric" />
              </View>

              <View className="flex-row items-center bg-vanilla-cream rounded-2xl mb-4 px-4">
                <MyIcon name="mail-outline" size={20} color={colors.russet} style={{ marginRight: 10 }} />
                <TextInput className="flex-1 py-4 text-base text-russet font-bold" placeholder="Email" placeholderTextColor={colors.russet} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View className="flex-row items-center bg-vanilla-cream rounded-2xl mb-4 px-4">
                <MyIcon name="lock-closed-outline" size={20} color={colors.russet} style={{ marginRight: 10 }} />
                <TextInput className="flex-1 py-4 text-base text-russet font-bold" placeholder="Contraseña" placeholderTextColor={colors.russet} value={password} onChangeText={setPassword} secureTextEntry />
              </View>

            </View>

            {/* Botón principal */}
            <TouchableOpacity className="mt-4 rounded-3xl overflow-hidden shadow-sm" onPress={enviarFormulario} disabled={loading}>
              <LinearGradient
                colors={['#FF512F', '#DD2476']}
                className="py-4 items-center justify-center"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-bold tracking-wider">REGISTRARSE</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer */}
            <View className="flex-row justify-center mt-8">
              <Text className="text-gray-300">¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text className="text-saffron font-bold"> Inicia sesión aquí</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* --- MODAL DEL ESCÁNER DE DNI --- */}
      <Modal animationType="slide" transparent={false} visible={scannerVisible}>
        <SafeAreaView className="flex-1 bg-black">
          <View className="absolute top-5 left-5 right-5 z-10 flex-row items-center">
            <TouchableOpacity onPress={() => setScannerVisible(false)} className="p-2 bg-black/50 rounded-full">
              <MyIcon name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white ml-4 font-bold">Escanee el código PDF417 del DNI</Text>
          </View>
          
          {device != null && hasPermission ? (
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={scannerVisible}
                outputs={[scannerOutput]}
              />
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-white">Esperando cámara o permisos...</Text>
            </View>
          )}
          
          {/* Superposición visual para centrar el DNI */}
          <View className="flex-1 justify-center items-center bg-black/30">
            <View className="w-4/5 h-40 border-2 border-saffron rounded-xl" />
          </View>
        </SafeAreaView>
      </Modal>

    </LinearGradient>
  );
};


