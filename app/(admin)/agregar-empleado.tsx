import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  KeyboardAvoidingView, Platform, ScrollView, Modal,
  ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useToast } from '@/src/context/ToastContext';
import { AuthService } from '@/src/services/authService';
import { ImageService } from '@/src/services/imageService';
import { SoundService } from '@/src/services/soundService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ROLES_EMPLEADO = [
  { id: 'supervisor', label: 'Supervisor', emoji: '🔑' },
  { id: 'metre',      label: 'Metre',      emoji: '📋' },
  { id: 'mozo',       label: 'Mozo',       emoji: '🍽️' },
  { id: 'cantinero',  label: 'Cantinero',  emoji: '🍸' },
  { id: 'cocinero',   label: 'Cocinero',   emoji: '👨‍🍳' },
];

export default function AgregarEmpleadoScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();

  // Navegación entre pasos
  const [paso, setPaso] = useState<1 | 2>(1);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // UI
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Creando empleado...');
  const [scanned, setScanned] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showRoles, setShowRoles] = useState(false);

  // Datos del formulario
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [cuil, setCuil] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState('mozo');

  const rolActual = ROLES_EMPLEADO.find(r => r.id === rolSeleccionado)!;

  const dispararError = (titulo: string, mensaje: string) => {
    SoundService.reproducir('error');
    showToast('error', titulo, mensaje);
  };

  // ── ANIMACIÓN DE PÁGINA ──────────────────────────────────────────────────────
  const irAPaso = (destino: 1 | 2) => {
    const toValue = destino === 2 ? -SCREEN_WIDTH : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setPaso(destino));
    setPaso(destino);
  };

  // ── FOTO ────────────────────────────────────────────────────────────────────
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

  // ── SCANNER DNI ─────────────────────────────────────────────────────────────
  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
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
    setScanned(false);
    setShowScanner(true);
  };

  // ── VALIDACIÓN PASO 1 → SIGUIENTE ────────────────────────────────────────────
  const irAlPaso2 = () => {
    if (!nombres.trim() || !apellidos.trim()) {
      dispararError('Nombre incompleto', 'Ingresá nombre y apellido del empleado.');
      return;
    }
    if (nombres.length > 20 || apellidos.length > 20) {
      dispararError('Límite excedido', 'Nombre y apellido no pueden superar los 20 caracteres.');
      return;
    }
    if (dni.length < 8) {
      dispararError('DNI Inválido', 'Ingresá un DNI válido (mínimo 8 dígitos).');
      return;
    }
    if (cuil.length < 11) {
      dispararError('CUIL Inválido', 'Ingresá un CUIL válido (11 dígitos).');
      return;
    }
    if (!fotoUri) {
      dispararError('Foto obligatoria', 'Debe tomarse una foto de perfil del empleado.');
      return;
    }
    irAPaso(2);
  };

  // ── CREAR EMPLEADO (PASO 2) ──────────────────────────────────────────────────
  const handleCrearEmpleado = async () => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      dispararError('Email inválido', 'El formato del correo electrónico no es válido.');
      return;
    }
    if (password.length < 6) {
      dispararError('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      dispararError('Contraseñas distintas', 'La contraseña y su confirmación no coinciden.');
      return;
    }

    setLoading(true);
    try {
      setLoadingText('Subiendo foto del empleado...');
      const resultadoSubida = await ImageService.uploadToSupabase(
        fotoUri!, 'avatares', 'empleados', `emp_${dni.trim()}`
      );
      if (!resultadoSubida.success || !resultadoSubida.url) {
        setLoading(false);
        dispararError('Error de almacenamiento', 'No se pudo guardar la foto del empleado.');
        return;
      }

      setLoadingText(`Creando cuenta de ${nombres.trim()}...`);
      await AuthService.registrarEmpleado(password, {
        email, nombres, apellidos, dni, cuil,
        perfil: rolSeleccionado,
        foto_url: resultadoSubida.url,
      });

      setLoading(false);
      await SoundService.reproducir('exito');
      showToast('success', '¡Empleado creado!',
        `${nombres.trim()} registrado como ${rolActual.label} correctamente.`);
      router.back();

    } catch (error: any) {
      setLoading(false);
      if (error?.message?.includes('duplicate') || error?.code === '23505') {
        dispararError('Datos duplicados', 'El DNI, CUIL o Email ya están registrados.');
      } else if (error?.message?.includes('already registered')) {
        dispararError('Email existente', 'Este correo ya tiene una cuenta registrada.');
      } else {
        dispararError('Error crítico', 'Ocurrió un fallo al crear el empleado. Intentá nuevamente.');
        console.error('[AgregarEmpleado]', error);
      }
    }
  };

  // ── VISTA SCANNER ────────────────────────────────────────────────────────────
  if (showScanner) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <CameraView
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['pdf417', 'qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View className="w-[85%] h-44 border-2 border-tertiary rounded-2xl mb-6 bg-transparent" />
        <Text className="text-secondary font-bold text-center mb-8 px-6 bg-black/70 py-3 rounded-2xl mx-4 text-xs uppercase tracking-wider">
          Alineá la barra horizontal del reverso del DNI en el recuadro
        </Text>
        <TouchableOpacity
          onPress={() => setShowScanner(false)}
          className="bg-tertiary px-10 py-4 rounded-full border-b-4 border-orange"
        >
          <Text className="text-primary font-bold uppercase">Volver al Formulario</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── LAYOUT PRINCIPAL ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-primary">

      {/* Spinner */}
      <Modal transparent visible={loading} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-primary p-10 rounded-3xl items-center border-2 border-tertiary shadow-2xl w-[80%]">
            <ActivityIndicator size="large" color="#F5C065" />
            <Text className="text-secondary font-bold mt-4 text-base text-center">{loadingText}</Text>
          </View>
        </View>
      </Modal>

      {/* Header con indicador de paso */}
      <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center justify-between shadow-2xl">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => paso === 1 ? router.back() : irAPaso(1)} className="mr-3">
            <Ionicons name="arrow-back" size={30} color="#31603D" />
          </TouchableOpacity>
          <Text className="text-primary font-bold text-xl uppercase tracking-tighter">
            {paso === 1 ? 'Datos Personales' : 'Credenciales'}
          </Text>
        </View>
        {/* Indicador de paso 1/2 */}
        <View className="flex-row items-center gap-2">
          <View className={`w-8 h-2 rounded-full ${paso === 1 ? 'bg-primary' : 'bg-primary/30'}`} />
          <View className={`w-8 h-2 rounded-full ${paso === 2 ? 'bg-primary' : 'bg-primary/30'}`} />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

        {/* ═══════════════════ PASO 1 ═══════════════════ */}
        {paso === 1 && (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-8 pt-6"
            showsVerticalScrollIndicator={false}
          >
            {/* Foto grande centrada */}
            <View className="items-center mb-6">
              <TouchableOpacity
                onPress={tomarFoto}
                className="bg-secondary w-36 h-36 rounded-full items-center justify-center border-4 border-tertiary overflow-hidden shadow-xl mb-3"
              >
                {fotoUri ? (
                  <Image source={{ uri: fotoUri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="items-center">
                    <Ionicons name="camera-outline" size={52} color="#31603D" />
                    <Text className="text-primary/60 text-[10px] font-bold uppercase mt-1">Foto</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={tomarFoto}>
                <Text className="text-tertiary font-bold text-xs uppercase tracking-tight">
                  {fotoUri ? '✓ Cambiar foto' : 'Tomar foto obligatoria ⚠️'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selector de rol (acordeón) */}
            <View className="mb-5">
              <TouchableOpacity
                onPress={() => setShowRoles(!showRoles)}
                className="bg-secondary rounded-2xl px-5 py-4 flex-row items-center justify-between shadow-sm"
              >
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">{rolActual.emoji}</Text>
                  <View>
                    <Text className="text-primary/50 text-[10px] uppercase font-bold tracking-wider">Perfil del empleado</Text>
                    <Text className="text-primary font-bold text-base">{rolActual.label}</Text>
                  </View>
                </View>
                <Ionicons name={showRoles ? 'chevron-up' : 'chevron-down'} size={22} color="#31603D" />
              </TouchableOpacity>

              {showRoles && (
                <View className="bg-secondary/90 rounded-b-2xl mt-0.5 overflow-hidden border-x border-b border-secondary/50 shadow-sm">
                  {ROLES_EMPLEADO.map((rol, index) => (
                    <TouchableOpacity
                      key={rol.id}
                      onPress={() => { setRolSeleccionado(rol.id); setShowRoles(false); }}
                      className={`flex-row items-center px-5 py-4 ${
                        index < ROLES_EMPLEADO.length - 1 ? 'border-b border-primary/10' : ''
                      } ${rolSeleccionado === rol.id ? 'bg-tertiary/25' : ''}`}
                    >
                      <Text className="text-xl mr-3">{rol.emoji}</Text>
                      <Text className={`font-bold text-sm flex-1 ${
                        rolSeleccionado === rol.id ? 'text-primary' : 'text-primary/70'
                      }`}>
                        {rol.label}
                      </Text>
                      {rolSeleccionado === rol.id && (
                        <Ionicons name="checkmark-circle" size={20} color="#31603D" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Inputs de datos personales - full width, grandes */}
            <TextInput
              placeholder="Nombres"
              placeholderTextColor="#6E433D"
              value={nombres}
              onChangeText={setNombres}
              maxLength={20}
              className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg shadow-sm mb-4 text-primary font-semibold"
            />
            <TextInput
              placeholder="Apellidos"
              placeholderTextColor="#6E433D"
              value={apellidos}
              onChangeText={setApellidos}
              maxLength={20}
              className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg shadow-sm mb-4 text-primary font-semibold"
            />
            <TextInput
              placeholder="DNI (8 dígitos)"
              placeholderTextColor="#6E433D"
              value={dni}
              onChangeText={setDni}
              maxLength={8}
              keyboardType="numeric"
              className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg shadow-sm mb-4 text-primary font-semibold"
            />
            <TextInput
              placeholder="CUIL (11 dígitos)"
              placeholderTextColor="#6E433D"
              value={cuil}
              onChangeText={setCuil}
              maxLength={11}
              keyboardType="numeric"
              className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg shadow-sm mb-5 text-primary font-semibold"
            />

            {/* Botón escanear DNI */}
            <TouchableOpacity
              onPress={iniciarEscaneo}
              className="w-full flex-row items-center justify-center bg-primary/20 border border-tertiary rounded-full py-3 mb-6 shadow-sm"
            >
              <Ionicons name="qr-code-outline" size={18} color="#F5C065" style={{ marginRight: 8 }} />
              <Text className="text-tertiary font-bold text-sm uppercase tracking-wider">Escanear Tarjeta DNI</Text>
            </TouchableOpacity>

            {/* Botón siguiente */}
            <TouchableOpacity
              onPress={irAlPaso2}
              className="w-full bg-tertiary rounded-full py-5 shadow-lg border-b-4 border-orange active:opacity-90 mb-8"
            >
              <View className="flex-row justify-center items-center">
                <Text className="text-center font-bold text-primary text-lg uppercase mr-2">Siguiente</Text>
                <Ionicons name="arrow-forward" size={20} color="#31603D" />
              </View>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ═══════════════════ PASO 2 ═══════════════════ */}
        {paso === 2 && (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-8 pt-8"
            showsVerticalScrollIndicator={false}
          >
            {/* Resumen del paso 1 */}
            <View className="bg-secondary/10 border border-secondary/20 rounded-3xl p-4 mb-8 flex-row items-center">
              {fotoUri && (
                <Image source={{ uri: fotoUri }} className="w-14 h-14 rounded-full mr-4 border-2 border-tertiary" resizeMode="cover" />
              )}
              <View className="flex-1">
                <Text className="text-secondary font-bold text-base">
                  {nombres} {apellidos}
                </Text>
                <Text className="text-secondary/60 text-xs uppercase font-semibold">
                  {rolActual.emoji} {rolActual.label} · DNI {dni}
                </Text>
              </View>
              <TouchableOpacity onPress={() => irAPaso(1)}>
                <Text className="text-tertiary text-xs font-bold underline">Editar</Text>
              </TouchableOpacity>
            </View>

            {/* Inputs de credenciales - full width, grandes */}
            <TextInput
              placeholder="Correo electrónico"
              placeholderTextColor="#6E433D"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg shadow-sm mb-4 text-primary font-semibold"
            />
            <TextInput
              placeholder="Contraseña temporal"
              placeholderTextColor="#6E433D"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg shadow-sm mb-4 text-primary font-semibold"
            />
            <TextInput
              placeholder="Confirmar contraseña"
              placeholderTextColor="#6E433D"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg shadow-sm mb-8 text-primary font-semibold"
            />

            {/* Botón CREAR EMPLEADO */}
            <TouchableOpacity
              onPress={handleCrearEmpleado}
              style={{ elevation: 12 }}
              className="w-full bg-tertiary rounded-full py-5 shadow-2xl border-b-4 border-orange active:opacity-90 mb-4"
            >
              <View className="flex-row justify-center items-center">
                <Ionicons name="person-add" size={22} color="#31603D" style={{ marginRight: 10 }} />
                <Text className="text-center font-black text-primary text-xl uppercase tracking-wide">
                  Crear Empleado
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => irAPaso(1)} className="py-3 items-center mb-4">
              <Text className="text-secondary/60 font-semibold text-sm">← Volver al paso anterior</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
