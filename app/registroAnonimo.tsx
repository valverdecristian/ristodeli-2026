import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import { AuthService } from '@/src/services/authService';
import { ImageService } from '@/src/services/imageService';
import { SoundService } from '@/src/services/soundService';
import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LoadingModal from '@/src/components/LoadingModal';

export default function RegistroAnonimoScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { refrescarPerfil, resolverRutaPorPerfil } = useAuth();
    const [nombre, setNombre] = useState('');
    const [foto, setFoto] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');

    const tomarFotoPersonal = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                SoundService.reproducir('error');
                showToast("error", "Permiso Denegado", "Ristodeli necesita acceso a la cámara para el registro express.");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setFoto(result.assets[0].uri);
            }
        } catch (err) {
            SoundService.reproducir('error');
            showToast("error", "Error de Cámara", "No se pudo inicializar el hardware de captura.");
        }
    };

    const handleRegistroAnonimo = async () => {
        if (!nombre.trim() || !foto) {
            SoundService.reproducir('error');
            showToast("error", "Campos incompletos", "Por favor, introduce tu nombre y tómate la fotografía obligatoria.");
            return;
        }

        setLoading(true);
        setLoadingText('Subiendo foto...');

        try {
            console.log('[REG_ANON] 1. Subiendo foto a Supabase Storage...');
            const resultadoSubida = await ImageService.uploadToSupabase(
                foto,
                "avatares",
                "",
                `anon_${Date.now()}`
            );

            console.log('[REG_ANON] Resultado subida:', JSON.stringify(resultadoSubida));

            if (!resultadoSubida.success || !resultadoSubida.url) {
                SoundService.reproducir('error');
                showToast("error", "Error de almacenamiento", resultadoSubida.message || "No se pudo guardar la foto en el servidor.");
                setLoading(false);
                return;
            }

            setLoadingText('Creando sesión anónima...');
            console.log('[REG_ANON] 2. Llamando a registrarAnonimo...');
            const authResult = await AuthService.registrarAnonimo(nombre.trim(), resultadoSubida.url);
            console.log('[REG_ANON] registrarAnonimo OK, user:', authResult.user?.id);

            setLoadingText('Cargando perfil...');
            console.log('[REG_ANON] 3. Refrescando perfil...');
            await refrescarPerfil();
            console.log('[REG_ANON] refrescarPerfil OK');

            await SoundService.reproducir('exito');
            showToast("success", "Acceso Concedido", `¡Hola ${nombre.trim()}! Perfil temporal creado.`);

            const ruta = resolverRutaPorPerfil('cliente_anonimo');
            console.log('[REG_ANON] 4. Redirigiendo a:', ruta);
            router.replace(ruta);

        } catch (error: any) {
            console.log('[REG_ANON] ERROR:', error);
            console.log('[REG_ANON] Error code:', error?.code);
            console.log('[REG_ANON] Error message:', error?.message);
            console.log('[REG_ANON] Error details:', error?.details);
            console.log('[REG_ANON] Error hint:', error?.hint);

            // Mostrar info detallada en el toast
            let mensaje = error?.message || "Error desconocido";
            if (error?.code) mensaje += ` (código: ${error.code})`;
            if (error?.hint) mensaje += `\nHint: ${error.hint}`;

            SoundService.reproducir('error');
            showToast("error", `Error: ${error?.code || 'desconocido'}`, mensaje);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-primary px-8 justify-center items-center">
            <Modal transparent visible={loading} animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/60">
                    <View className="bg-primary p-10 rounded-3xl items-center border-2 border-tertiary shadow-2xl">
                        <View className="bg-secondary rounded-full p-2 mb-4 border border-tertiary">
                            <Image source={require("@/assets/images/icon.png")} className="w-12 h-12" resizeMode="contain" />
                        </View>
                        <ActivityIndicator size="large" color="#F5C065" />
                        <Text className="text-secondary font-bold mt-4 text-center uppercase text-sm">
                            {loadingText || 'Registrando...'}
                        </Text>
                    </View>
                </View>
            </Modal>

            <Text className="text-secondary font-bold text-2xl uppercase mb-8 tracking-tight text-center">
                Registro Anónimo
            </Text>

            <TouchableOpacity
                onPress={tomarFotoPersonal}
                className="w-44 h-44 bg-secondary rounded-[30px] mb-8 border-2 border-tertiary justify-center items-center overflow-hidden shadow-lg"
            >
                {foto ? (
                    <Image source={{ uri: foto }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="items-center p-4">
                        <Ionicons name="camera-outline" size={44} color="#31603D" />
                        <Text className="text-primary font-bold text-[10px] uppercase text-center mt-2">
                            Capturar Foto Personal
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            <TextInput
                placeholder="Escribe tu nombre"
                placeholderTextColor="#555"
                value={nombre}
                onChangeText={setNombre}
                className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg shadow-md mb-8 text-primary font-semibold"
            />

            <TouchableOpacity
                onPress={handleRegistroAnonimo}
                className="w-full bg-tertiary rounded-full py-4 shadow-lg border-b-4 border-orange active:opacity-90"
            >
                <Text className="text-center font-bold text-primary text-lg uppercase tracking-wider">
                    Ingresar al local
                </Text>
            </TouchableOpacity>
        </View>
    );
}