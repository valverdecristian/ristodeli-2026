import { useToast } from "@/src/context/ToastContext";
import { supabase } from '@/src/services/SupabaseClient';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegistroAnonimoScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const [nombre, setNombre] = useState('');
    const [foto, setFoto] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // 🌟 2. FUNCIÓN CORREGIDA PARA ABRIR LA CÁMARA REAL DEL DISPOSITIVO
    const tomarFotoPersonal = async () => {
        try {
            // Solicitamos permisos de hardware en caliente
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            
            if (status !== 'granted') {
                SoundService.reproducir('error');
                showToast("error", "Permiso Denegado", "Ristodeli necesita acceso a la cámara para el registro express.");
                return;
            }

            // Abrimos la cámara nativa de forma explícita
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images, // Solo fotos, no video
                allowsEditing: true,  // Permite al usuario recortar/centrar su cara
                aspect: [1, 1],       // Fuerza relación de aspecto cuadrada perfecta para el perfil
                quality: 0.5,         // Comprime un toque la foto para que no pese 10MB al subirla a Supabase
            });

            // Si el usuario no canceló la toma de la foto, guardamos la URI local en el estado
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
            SoundService.reproducir('error'); // Activa sonido + vibración por error
            showToast("error", "Campos incompletos", "Por favor, introduce tu nombre y tómate la fotografía obligatoria.");
            return;
        }

        setLoading(true);

        try {
            // 🌟 3. NOTA PARA EXPO GO / EMULADORES:
            // Para la entrega o testing veloz podés mandar la URI local ('foto') directo a la columna text de tu base de datos.
            // Si el Metre en el celular 1 necesita renderizarla desde otro dispositivo, recordá que idealmente
            // deberías subir primero este archivo al Storage de Supabase y guardar la URL pública acá.
            const { data, error } = await supabase
                .from('anonimos')
                .insert([{ 
                    nombre: nombre.trim(), 
                    foto: foto, // Setea la URI real capturada en el momento
                    push_token: null 
                }])
                .select()
                .single();

            if (error) throw error;

            await SoundService.reproducir('exito');
            showToast("success", "Acceso Concedido", `¡Hola ${data.nombre}! Perfil temporal creado.`);

            // 4. Viajamos al Home enviando los datos limpios para la lista de espera
            router.replace({
                pathname: "/(tabs)/homeAnonimo",
                params: { 
                    anonimoId: data.id,
                    anonimoNombre: data.nombre,
                    anonimoFoto: data.foto
                }
            });

        } catch (error: any) {
            SoundService.reproducir('error');
            showToast("error", "Error de base de datos", error.message || "No se pudo registrar el usuario anónimo.");
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
                            Generando credenciales temporales...
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