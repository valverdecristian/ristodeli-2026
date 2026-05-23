import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';

import { useToast } from '@/src/context/ToastContext';
import { AuthService } from '@/src/services/authService';
import { ImageService } from '@/src/services/imageService';
import { SoundService } from '@/src/services/soundService';

import LoadingModal from '@/src/components/LoadingModal';
import ScannerDNI from '@/src/components/ScannerDNI';
import CustomInput from '@/src/components/CustomInput';
import SelectorDeRol from '@/src/components/SelectorDeRol';
import CapturaFoto from '@/src/components/CapturaFoto';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ROLES_EMPLEADO = [
  { id: 'supervisor', label: 'Supervisor', emoji: '🔑' },
  { id: 'metre', label: 'Metre', emoji: '📋' },
  { id: 'mozo', label: 'Mozo', emoji: '🍽️' },
  { id: 'cantinero', label: 'Cantinero', emoji: '🍸' },
  { id: 'cocinero', label: 'Cocinero', emoji: '👨‍🍳' },
];

export default function AgregarEmpleadoScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();

  const [paso, setPaso] = useState<1 | 2>(1);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Estados de UI Modulares
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Creando empleado...');
  const [showScanner, setShowScanner] = useState(false);

  // Formulario
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [cuil, setCuil] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState('mozo');

  const dispararError = (titulo: string, mensaje: string) => {
    SoundService.reproducir('error');
    showToast('error', titulo, mensaje);
  };

  const irAPaso = (destino: 1 | 2) => {
    const toValue = destino === 2 ? -SCREEN_WIDTH : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setPaso(destino));
    setPaso(destino);
  };

  const tomarFoto = async () => {
    try {
      const foto = await ImageService.takePhoto();
      if (foto) {
        setFotoUri(foto.uri);
        showToast('success', '¡Foto capturada!', 'Imagen del empleado tomada correctamente.');
      }
    } catch {
      dispararError('Error de cámara', 'No se pudo acceder a la cámara del dispositivo.');
    }
  };

  // FUNCIÓN SIMPLIFICADA QUE RECIBE LA DATA DEL COMPONENTE SCANNERDNI
  const procesarDniEscaneado = (data: string) => {
    setShowScanner(false);
    try {
      if (data?.includes('@')) {
        const d = data.split('@');
        if (d.length > 5) {
          setApellidos(d[1]?.trim() || '');
          setNombres(d[2]?.trim() || '');
          setDni(d[4]?.trim() || '');
          if (d[4]?.trim().length === 8) setCuil(`20${d[4].trim()}7`);
          showToast('success', 'DNI Escaneado', 'Datos del empleado cargados correctamente.');
        } else {
          dispararError('Lectura ilegible', 'El formato del código escaneado no es válido.');
        }
      } else {
        dispararError('Código incorrecto', 'Escanea el código de barras del reverso del DNI.');
      }
    } catch {
      dispararError('Error al escanear', 'No se pudieron procesar los datos de la tarjeta.');
    }
  };

  const iniciarEscaneo = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        dispararError('Permiso denegado', 'Se requieren permisos de cámara para escanear el DNI.');
        return;
      }
    }
    setShowScanner(true);
  };

  const irAlPaso2 = () => {
    if (!nombres.trim() || !apellidos.trim() || dni.length < 8 || cuil.length < 11 || !fotoUri) {
      dispararError('Campos incompletos', 'Verificá los datos y la foto antes de avanzar.');
      return;
    }
    irAPaso(2);
  };

  const handleCrearEmpleado = async () => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email) || password.length < 6 || password !== confirmPassword) {
      dispararError('Error en credenciales', 'Verificá el correo y contraseñas.');
      return;
    }

    setLoading(true);
    try {
      setLoadingText('Subiendo foto...');
      const result = await ImageService.uploadToSupabase(fotoUri!, 'avatares', 'empleados', `emp_${dni.trim()}`);

      if (!result.success || !result.url) {
        throw new Error("Fallo la subida de imagen");
      }

      setLoadingText(`Creando cuenta...`);
      await AuthService.registrarEmpleado(password, {
        email, nombres, apellidos, dni, cuil, perfil: rolSeleccionado, foto_url: result.url,
      });

      setLoading(false);
      await SoundService.reproducir('exito');
      showToast('success', '¡Empleado creado!', `${nombres.trim()} registrado correctamente.`);
      router.back();

    } catch (error: any) {
      setLoading(false);
      dispararError('Error de registro', error.message || 'Ocurrió un fallo imprevisto.');
    }
  };

  // INYECTA EL COMPONENTE MODULAR DEL ESCÁNER
  if (showScanner) {
    return (
      <ScannerDNI
        onScan={procesarDniEscaneado}
        onCancel={() => setShowScanner(false)}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">

      {/* 4. INYECTAMOS EL COMPONENTE MODULAR DEL SPINNER */}
      <LoadingModal visible={loading} message={loadingText} />

      <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center justify-between shadow-2xl">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => paso === 1 ? router.back() : irAPaso(1)} className="mr-3">
            <Ionicons name="arrow-back" size={30} color="#31603D" />
          </TouchableOpacity>
          <Text className="text-primary font-bold text-xl uppercase tracking-tighter">
            {paso === 1 ? 'Datos Del Empleado' : 'Credenciales'}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className={`w-8 h-2 rounded-full ${paso === 1 ? 'bg-primary' : 'bg-primary/30'}`} />
          <View className={`w-8 h-2 rounded-full ${paso === 2 ? 'bg-primary' : 'bg-primary/30'}`} />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {paso === 1 && (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8 pt-6" showsVerticalScrollIndicator={false}>
            {/* Foto, Roles y Formulario Paso 1 (Igual que antes) */}
            <CapturaFoto
              fotoUri={fotoUri}
              onPress={tomarFoto}
              textoInferior="Tocar para tomar foto"
              size="grande"
            />

            {/* ... foto ... */}
            <CustomInput placeholder="Nombres" value={nombres} onChangeText={setNombres} maxLength={20} />
            <CustomInput placeholder="Apellidos" value={apellidos} onChangeText={setApellidos} maxLength={20} />
            <CustomInput placeholder="DNI (8 dígitos)" value={dni} onChangeText={setDni} maxLength={8} keyboardType="numeric" />
            <CustomInput placeholder="CUIL (11 dígitos)" value={cuil} onChangeText={setCuil} maxLength={11} keyboardType="numeric" marginBottom="mb-5" />

            <TouchableOpacity onPress={iniciarEscaneo} className="w-full flex-row items-center justify-center bg-primary/20 border border-tertiary rounded-full py-3 mb-6 shadow-sm">
              <Ionicons name="qr-code-outline" size={18} color="#F5C065" style={{ marginRight: 8 }} />
              <Text className="text-tertiary font-bold text-sm uppercase tracking-wider">Escanear Tarjeta DNI</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={irAlPaso2} className="w-full bg-tertiary rounded-full py-5 shadow-lg border-b-4 border-orange mb-8">
              <Text className="text-center font-bold text-primary text-lg uppercase mr-2">Siguiente</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {paso === 2 && (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8 pt-8" showsVerticalScrollIndicator={false}>
            {/* Formulario  (Igual que antes) */}
            <CustomInput placeholder="Correo electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <CustomInput placeholder="Contraseña temporal" secureTextEntry value={password} onChangeText={setPassword} />
            <CustomInput placeholder="Confirmar contraseña" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} marginBottom="mb-8" />

            {/* NUESTRO ACORDEON MODULARIZADO */}
            <SelectorDeRol
              roles={ROLES_EMPLEADO}
              rolSeleccionado={rolSeleccionado}
              onSelect={setRolSeleccionado}
            />
            <TouchableOpacity onPress={handleCrearEmpleado} className="w-full bg-tertiary rounded-full py-5 shadow-2xl border-b-4 border-orange mb-4">
              <Text className="text-center font-black text-primary text-xl uppercase">Crear Empleado</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}