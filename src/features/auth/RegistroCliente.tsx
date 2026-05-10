import React, { FC, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StatusBar, Modal, ActivityIndicator, } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MyIcon } from '../../shared/components/Icon';
import { colors } from '../../theme/colors';
import { globalStyles } from '../../theme/globalStyles';

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
    onBarcodeScanned: (codes) => {
      if (codes.length > 0 && scannerVisible) {
        const rawData = codes[0].value;
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
    <LinearGradient colors={['#0F2027', '#203A43', '#2C5364']} style={globalStyles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Logo superior */}
            <View style={styles.logoHeader}>
              <Text style={styles.logoTextMain}>RISTO</Text>
              <Text style={styles.logoTextSub}>DELI</Text>
              <Text style={styles.byAlfa}>by ALFA DEVS</Text>
            </View>

            <Text style={styles.registerTitle}>REGISTRO</Text>

            {/* --- SECTOR FOTO DE PERFIL --- */}
            <TouchableOpacity style={styles.photoPicker} onPress={takeProfilePhoto}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <MyIcon name="camera-outline" size={40} color={colors.russet} />
                  <Text style={styles.photoText}>Tomar Foto</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Inputs del formulario */}
            <View style={styles.formContainer}>
              {/* Input Nombre */}
              <View style={styles.inputWrapper}>
                <MyIcon name="person-outline" size={20} color={colors.russet} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={colors.russet} value={nombre} onChangeText={setNombre} />
              </View>

              {/* Input Apellido */}
              <View style={styles.inputWrapper}>
                <MyIcon name="person-outline" size={20} color={colors.russet} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Apellido" placeholderTextColor={colors.russet} value={apellido} onChangeText={setApellido} />
              </View>

              {/* --- INPUT DNI CON ESCÁNER --- */}
              <View style={styles.dniInputGroup}>
                <View style={[styles.inputWrapper, { flex: 1, marginBottom: 0 }]}>
                  <MyIcon name="id-card-outline" size={20} color={colors.russet} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="DNI"
                    placeholderTextColor={colors.russet}
                    value={dni}
                    onChangeText={setDni}
                    keyboardType="numeric"
                  />
                </View>
                {/* Botón para escanear */}
                <TouchableOpacity
                  style={styles.scanBarButton}
                  onPress={() => setScannerVisible(true)}
                  disabled={!hasPermission}
                >
                  <LinearGradient colors={['#FF512F', '#DD2476']} style={styles.scanBarGradient}>
                    <MyIcon name="scan-outline" size={22} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <MyIcon name="calculator-outline" size={20} color={colors.russet} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="CUIL" placeholderTextColor={colors.russet} value={cuil} onChangeText={setCuil} keyboardType="numeric" />
              </View>

              <View style={styles.inputWrapper}>
                <MyIcon name="mail-outline" size={20} color={colors.russet} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.russet} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.inputWrapper}>
                <MyIcon name="lock-closed-outline" size={20} color={colors.russet} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor={colors.russet} value={password} onChangeText={setPassword} secureTextEntry />
              </View>

            </View>

            {/* Botón principal */}
            <TouchableOpacity style={styles.buttonRegister} onPress={enviarFormulario} disabled={loading}>
              <LinearGradient
                colors={['#FF512F', '#DD2476']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>REGISTRARSE</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerTextBold}> Inicia sesión aquí</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* --- MODAL DEL ESCÁNER DE DNI --- */}
      <Modal animationType="slide" transparent={false} visible={scannerVisible}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setScannerVisible(false)} style={styles.closeScanner}>
              <MyIcon name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Escanee el código PDF417 del DNI</Text>
          </View>
          
          {device != null && hasPermission ? (
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={scannerVisible}
                outputs={[scannerOutput]}
              />
          ) : (
            <View style={styles.noCamera}>
              <Text style={{color: '#fff'}}>Esperando cámara o permisos...</Text>
            </View>
          )}
          
          {/* Superposición visual para centrar el DNI */}
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTarget} />
          </View>
        </SafeAreaView>
      </Modal>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  logoHeader: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoTextMain: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.vanillaCream,
    letterSpacing: 2,
  },
  logoTextSub: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.saffron,
    marginTop: -10,
  },
  byAlfa: {
    fontSize: 12,
    color: '#ddd',
    marginTop: 5,
  },
  registerTitle: {
    fontSize: 24,
    color: colors.vanillaCream,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  photoPicker: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.vanillaCream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoText: {
    marginTop: 5,
    color: colors.russet,
    fontWeight: 'bold',
    fontSize: 12,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.vanillaCream,
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.russet,
    fontWeight: 'bold',
  },
  dniInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  scanBarButton: {
    width: 50,
    height: 55, // Misma altura que el input
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
  },
  scanBarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRegister: {
    marginTop: 15,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 3,
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#ddd',
  },
  footerTextBold: {
    color: colors.saffron,
    fontWeight: 'bold',
  },
  scannerHeader: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeScanner: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  scannerTitle: {
    color: '#fff',
    marginLeft: 15,
    fontWeight: 'bold',
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scannerTarget: {
    width: '80%',
    height: 150, // Formato DNI PDF417
    borderWidth: 2,
    borderColor: colors.saffron,
    borderRadius: 10,
  },
  noCamera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
