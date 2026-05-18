import { useToast } from "@/src/context/ToastContext";
import { AuthService } from '@/src/services/authService';
import { ImageService } from '@/src/services/imageService';
import { NotificationService } from '@/src/services/notificationService';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import LoadingModal from '@/src/components/LoadingModal';

export default function RegistroScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const [permission, requestPermission] = useCameraPermissions();
    
    // Estados de carga e interfaz
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Creando tu cuenta...');
    const [scanned, setScanned] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    // Estados del formulario 
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [dni, setDni] = useState('');
    const [cuil, setCuil] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fotoUri, setFotoUri] = useState<string | null>(null);

    const dispararAlertaError = (titulo: string, mensaje: string) => {
        SoundService.reproducir('error');
        showToast("error", titulo, mensaje);
    };

    // Función para capturar foto obligatoria con la cámara nativa
    const tomarFotoPerfil = async () => {
        try {
        const foto = await ImageService.takePhoto();
        if (foto) {
            setFotoUri(foto.uri);
            showToast("success", "¡Foto capturada!", "La imagen del rostro se tomó correctamente.");
        }
        } catch (error) {
        dispararAlertaError("Error de cámara", "No se pudo acceder a la cámara nativa del dispositivo.");
        }
    };

    // ESCÁNER DE DNI 
    const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
        if (scanned) return;
        setScanned(true);
        setShowScanner(false);

        try {
        if (data && data.includes('@')) {
            const datosDni = data.split('@');
            
            if (datosDni.length > 5) {
            const scannedApellido = datosDni[1] || '';
            const scannedNombre = datosDni[2] || '';
            const scannedDni = datosDni[4] || '';

            setApellidos(scannedApellido.trim());
            setNombres(scannedNombre.trim());
            setDni(scannedDni.trim());
            
            if (scannedDni.length === 8) {
                setCuil(`20${scannedDni}7`);
            }

            showToast("success", "DNI Escaneado", "La información de la tarjeta se cargó correctamente.");
            } else {
            dispararAlertaError("Lectura ilegible", "El formato del código escaneado no es válido.");
            }
        } else {
            dispararAlertaError("Código incorrecto", "Por favor, escanea el código de barras del reverso del DNI.");
        }
        } catch (err) {
        dispararAlertaError("Error al escanear", "No se pudieron procesar los datos de la tarjeta.");
        }
    };

    const iniciarEscaneo = async () => {
        if (!permission?.granted) {
        const res = await requestPermission();
        if (!res.granted) {
            dispararAlertaError("Permiso denegado", "Se requieren permisos de cámara para escanear el DNI.");
            return;
        }
        }
        setScanned(false);
        setShowScanner(true);
    };

    const handleRegistro = async () => {
        const emailRegex = /\S+@\S+\.\S+/;

        // VALIDACIONES 
        if (!nombres || !apellidos || !dni || !cuil || !email || !password) {
        dispararAlertaError("Campos incompletos", "Por favor, completa todos los campos del formulario.");
        return;
        }

        if (nombres.length > 20 || apellidos.length > 20) {
        dispararAlertaError("Límite excedido", "El nombre y el apellido no pueden superar los 20 caracteres.");
        return;
        }

        if (dni.length < 8) {
        dispararAlertaError("DNI Inválido", "Por favor, ingresa un número de DNI válido (mínimo 8 dígitos).");
        return;
        }

        if (cuil.length < 11) {
        dispararAlertaError("CUIL Inválido", "Por favor, ingresa un número de CUIL válido (debe tener 11 dígitos).");
        return;
        }

        if (!emailRegex.test(email)) {
        dispararAlertaError("Email inválido", "El formato del correo electrónico ingresado no es válido.");
        return;
        }

        if (!fotoUri) {
        dispararAlertaError("Foto obligatoria", "Debe tomarse una foto de perfil con la cámara para registrarse.");
        return;
        }

        if (password.length < 6) {
        dispararAlertaError("Contraseña corta", "La contraseña debe tener al menos 6 caracteres.");
        return;
        }

        setLoading(true);

        try {
        // SUBIDA DE IMAGEN 
        setLoadingText('Subiendo foto de perfil...');
        const resultadoSubida = await ImageService.uploadToSupabase(
            fotoUri,
            "avatares",
            "",
            `user_${dni.trim()}`
        );

        if (!resultadoSubida.success || !resultadoSubida.url) {
            setLoading(false);
            dispararAlertaError("Error de almacenamiento", "No se pudo guardar la foto de perfil en el servidor.");
            return;
        }

        // REGISTRO COMPLETO 
        setLoadingText('Creando tu cuenta en Ristodeli...');
        await AuthService.registrar(password, {
            email,
            nombres,
            apellidos,
            dni,
            cuil,
            perfil: 'cliente_pendiente', 
            foto_url: resultadoSubida.url,
        });

        setLoading(false);

        // Notificar a admins y supervisores sobre el nuevo cliente pendiente
        NotificationService.notificarNuevoClientePendiente(`${nombres} ${apellidos}`);

        await SoundService.reproducir('exito');
        showToast("success", "Registro enviado", "Cuenta creada. Aguarda la aprobación del Supervisor.");
        router.replace('/'); 

        } catch (error: any) {
        setLoading(false);
        if (error?.message?.includes('duplicate') || error?.code === '23505') {
            dispararAlertaError("Datos duplicados", "El DNI, CUIL o Email ya se encuentran registrados.");
        } else if (error?.message?.includes('Password')) {
            dispararAlertaError("Error de Autenticación", error.message);
        } else {
            dispararAlertaError("Error crítico", "Ocurrió un fallo imprevisto. Intenta nuevamente.");
        }
        }
    };

    // VISTA DEL MODO CÁMARA ACTIVO PARA EL ESCANER
    if (showScanner) {
        return (
        <View className="flex-1 bg-black justify-center items-center">
            <CameraView
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            facing="back"
            barcodeScannerSettings={{
                barcodeTypes: ["pdf417", "qr"], 
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            
            {/* Guia encuadrar la barra horizontal del DNI */}
            <View className="w-[85%] h-44 border-2 border-tertiary rounded-2xl mb-6 bg-transparent shadow-2xl" />
            
            <Text className="text-secondary font-bold text-center mb-8 px-6 bg-black/70 py-3 rounded-2xl mx-4 text-xs uppercase tracking-wider">
            Alineá la barra horizontal del reverso de tu DNI en el recuadro
            </Text>
            
            <TouchableOpacity 
            onPress={() => setShowScanner(false)} 
            className="bg-tertiary px-10 py-4 rounded-full border-b-4 border-orange active:opacity-90"
            >
            <Text className="text-primary font-bold uppercase text-base">Volver al Formulario</Text>
            </TouchableOpacity>
        </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <LoadingModal visible={loading} message={loadingText} />

        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-primary">
            <View className="flex-1 items-center justify-center px-8 pt-12 pb-8">
            
            <Text className="text-secondary font-bold text-3xl mb-1 uppercase tracking-wider text-center">
                Crear Cuenta
            </Text>
            
            {/* Botón para iniciar el Lector de DNI */}
            <TouchableOpacity 
                onPress={iniciarEscaneo}
                className="bg-tertiary flex-row items-center justify-center rounded-full px-6 py-2.5 mb-6 shadow-md border border-orange active:opacity-90"
            >
                <Ionicons name="qr-code-outline" size={16} color="#31603D" style={{ marginRight: 6 }} />
                <Text className="text-primary font-bold text-xs uppercase tracking-wider">Escanear Tarjeta DNI</Text>
            </TouchableOpacity>

            {/* Circulo de captura de Foto  */}
            <View className="items-center mb-6">
                <TouchableOpacity 
                onPress={tomarFotoPerfil}
                className="bg-secondary w-28 h-28 rounded-full items-center justify-center border-4 border-tertiary overflow-hidden shadow-md mb-[10px]"
                >
                {fotoUri ? (
                    <Image source={{ uri: fotoUri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <Ionicons name="camera-outline" size={42} color="#31603D" />
                )}
                </TouchableOpacity>
                <TouchableOpacity onPress={tomarFotoPerfil}>
                <Text className="text-tertiary font-bold text-xs uppercase tracking-tight">
                    {fotoUri ? "Cambiar foto" : "Sacar foto obligatoria ⚠️"}
                </Text>
                </TouchableOpacity>
            </View>

            {/* Campos del Formulario Autocompletables y Limitados */}
            <View className="w-full">
                <TextInput
                placeholder="Nombres"
                placeholderTextColor="#555"
                value={nombres}
                onChangeText={setNombres}
                maxLength={20}
                className="w-full bg-secondary rounded-full px-6 py-3 text-center text-base shadow-sm mb-4 text-primary font-semibold"
                />
                <TextInput
                placeholder="Apellidos"
                placeholderTextColor="#555"
                value={apellidos}
                onChangeText={setApellidos}
                maxLength={20}
                className="w-full bg-secondary rounded-full px-6 py-3 text-center text-base shadow-sm mb-4 text-primary font-semibold"
                />
                <TextInput
                placeholder="DNI (8 dígitos)"
                placeholderTextColor="#555"
                value={dni}
                onChangeText={setDni}
                maxLength={8}
                keyboardType="numeric"
                className="w-full bg-secondary rounded-full px-6 py-3 text-center text-base shadow-sm mb-4 text-primary font-semibold"
                />
                <TextInput
                placeholder="CUIL (11 dígitos)"
                placeholderTextColor="#555"
                value={cuil}
                onChangeText={setCuil}
                maxLength={11}
                keyboardType="numeric"
                className="w-full bg-secondary rounded-full px-6 py-3 text-center text-base shadow-sm mb-4 text-primary font-semibold"
                />
                <TextInput
                placeholder="Correo electrónico"
                placeholderTextColor="#555"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="w-full bg-secondary rounded-full px-6 py-3 text-center text-base shadow-sm mb-4 text-primary font-semibold"
                />
                <TextInput
                placeholder="Contraseña (Mínimo 6)"
                placeholderTextColor="#555"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                className="w-full bg-secondary rounded-full px-6 py-3 text-center text-base shadow-sm mb-6 text-primary font-semibold"
                />

                <TouchableOpacity
                onPress={handleRegistro}
                className="w-full bg-tertiary rounded-full py-4 shadow-lg border-b-4 border-orange active:opacity-90 mb-4"
                >
                <Text className="text-center font-bold text-primary text-lg uppercase">Confirmar Registro</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace('/')} className="w-full py-2">
                <Text className="text-center font-bold text-secondary text-sm underline">¿Ya tienes cuenta? Inicia sesión</Text>
                </TouchableOpacity>
            </View>

            </View>
        </ScrollView>
        </KeyboardAvoidingView>
    );
}