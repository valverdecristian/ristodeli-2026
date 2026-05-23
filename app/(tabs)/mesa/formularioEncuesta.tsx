import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/src/context/ToastContext';
import { SoundService } from '@/src/services/soundService';
import { EncuestaService } from '@/src/services/encuestaService';
import { AuthService } from '@/src/services/authService';
import LoadingModal from '@/src/components/LoadingModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FormularioEncuestaScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { mesaId, numeroMesa, clienteId, sesion_id } = useLocalSearchParams();

    const [clienteNombre, setClienteNombre] = useState('');
    const [satisfaccion, setSatisfaccion] = useState<number | null>(null);
    const [recomienda, setRecomienda] = useState<boolean | null>(null);
    const [limpieza, setLimpieza] = useState<string | null>(null);
    const [atencion, setAtencion] = useState<number | null>(null);
    const [comida, setComida] = useState<number | null>(null);
    const [ambiente, setAmbiente] = useState<number | null>(null);
    const [comentarios, setComentarios] = useState('');

    const [loading, setLoading] = useState(false);
    const [fetchingProfile, setFetchingProfile] = useState(true);

    useEffect(() => {
        const cargarPerfil = async () => {
            try {
                setFetchingProfile(true);
                const perfil = await AuthService.obtenerPerfilActual();
                if (perfil) {
                    const nombreCompleto = `${perfil.nombres} ${perfil.apellidos || ''}`.trim();
                    setClienteNombre(nombreCompleto);
                } else if (clienteId) {
                    const perfilId = await AuthService.obtenerPerfil(clienteId as string);
                    if (perfilId) {
                        const nombreCompleto = `${perfilId.nombres} ${perfilId.apellidos || ''}`.trim();
                        setClienteNombre(nombreCompleto);
                    }
                }
            } catch (error) {
                console.log('[ENCUESTA] Error cargando perfil para encuesta:', error);
            } finally {
                setFetchingProfile(false);
            }
        };
        cargarPerfil();
    }, [clienteId]);

    const renderEstrellas = () => {
        return (
            <View className="flex-row justify-center py-2">
                {[1, 2, 3, 4, 5].map((num) => {
                    const activo = satisfaccion !== null && satisfaccion >= num;
                    return (
                        <TouchableOpacity
                            key={num}
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setSatisfaccion(num);
                            }}
                            className="mx-2"
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={activo ? 'star' : 'star-outline'}
                                size={38}
                                color={activo ? '#F5C065' : '#31603D'}
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const renderSelectorRecomienda = () => {
        return (
            <View className="flex-row justify-between mt-2">
                <TouchableOpacity
                    onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setRecomienda(true);
                    }}
                    activeOpacity={0.8}
                    className={`flex-1 py-3 mr-2 rounded-2xl items-center border ${recomienda === true
                        ? 'bg-primary border-primary'
                        : 'bg-secondary/40 border-primary/20'
                        }`}
                >
                    <Text className={`font-bold text-sm ${recomienda === true ? 'text-secondary' : 'text-primary/70'}`}>
                        SÍ, LO RECOMIENDO 👍
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setRecomienda(false);
                    }}
                    activeOpacity={0.8}
                    className={`flex-1 py-3 ml-2 rounded-2xl items-center border ${recomienda === false
                        ? 'bg-danger border-danger'
                        : 'bg-secondary/40 border-primary/20'
                        }`}
                >
                    <Text className={`font-bold text-sm ${recomienda === false ? 'text-white' : 'text-primary/70'}`}>
                        NO LO RECOMIENDO 👎
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderSelectorLimpieza = () => {
        const opciones = ['Excelente', 'Bueno', 'Regular'];
        return (
            <View className="flex-row justify-between mt-2">
                {opciones.map((opc, index) => {
                    const esSeleccionado = limpieza === opc;
                    let iconName: any = 'happy-outline';
                    if (opc === 'Excelente') iconName = 'sparkles-outline';
                    else if (opc === 'Bueno') iconName = 'thumbs-up-outline';
                    else if (opc === 'Regular') iconName = 'alert-circle-outline';

                    return (
                        <TouchableOpacity
                            key={opc}
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setLimpieza(opc);
                            }}
                            activeOpacity={0.8}
                            className={`flex-1 py-3 rounded-2xl items-center justify-center border flex-row ${index > 0 ? 'ml-2' : ''
                                } ${esSeleccionado
                                    ? 'bg-primary border-primary'
                                    : 'bg-secondary/40 border-primary/20'
                                }`}
                        >
                            <Ionicons
                                name={iconName}
                                size={16}
                                color={esSeleccionado ? '#F8EECB' : '#31603D'}
                                style={{ marginRight: 4 }}
                            />
                            <Text
                                className={`font-bold text-xs ${esSeleccionado ? 'text-secondary' : 'text-primary/70'
                                    }`}
                            >
                                {opc}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const renderSelector1a10 = (
        valorActual: number | null,
        onSelect: (valor: number) => void
    ) => {
        return (
            <View className="flex-row flex-wrap justify-between mt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const esSeleccionado = valorActual === num;
                    return (
                        <TouchableOpacity
                            key={num}
                            onPress={async () => {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                onSelect(num);
                            }}
                            activeOpacity={0.7}
                            className={`w-9 h-9 rounded-full items-center justify-center m-1 border ${esSeleccionado
                                ? 'bg-primary border-primary'
                                : 'bg-secondary/40 border-primary/20'
                                }`}
                        >
                            <Text
                                className={`font-bold text-xs ${esSeleccionado ? 'text-secondary' : 'text-primary/70'
                                    }`}
                            >
                                {num}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const enviarEncuesta = async () => {
        if (!clienteNombre.trim()) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await SoundService.reproducir('error');
            showToast('error', 'Falta tu nombre', 'Por favor, escribe tu nombre.');
            return;
        }
        if (satisfaccion === null) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await SoundService.reproducir('error');
            showToast('error', 'Falta calificación general', 'Por favor, selecciona las estrellas de satisfacción.');
            return;
        }
        if (recomienda === null) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await SoundService.reproducir('error');
            showToast('error', 'Falta recomendación', 'Por favor, selecciona si recomendarías el restaurante.');
            return;
        }
        if (limpieza === null) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await SoundService.reproducir('error');
            showToast('error', 'Falta limpieza', 'Por favor, selecciona el nivel de limpieza.');
            return;
        }
        if (atencion === null) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await SoundService.reproducir('error');
            showToast('error', 'Falta atención', 'Por favor, califica la atención recibida (1 al 10).');
            return;
        }
        if (comida === null) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await SoundService.reproducir('error');
            showToast('error', 'Falta comida', 'Por favor, califica la comida (1 al 10).');
            return;
        }
        if (ambiente === null) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await SoundService.reproducir('error');
            showToast('error', 'Falta ambiente', 'Por favor, califica el ambiente del local (1 al 10).');
            return;
        }

        try {
            setLoading(true);
            await EncuestaService.guardar({
                cliente_nombre: clienteNombre.trim(),
                satisfaccion,
                recomienda,
                limpieza,
                comentarios: comentarios.trim() || null,
                atencion,
                comida,
                ambiente
            });

            const keyEncuesta = sesion_id ? `encuesta_completada_${sesion_id}` : `encuesta_completada_mesa_${mesaId}`;
            await AsyncStorage.setItem(keyEncuesta, 'true');

            await SoundService.reproducir('exito');
            showToast('success', '¡Enviado!', 'Muchas gracias por tus comentarios.');
            router.back();
        } catch (error: any) {
            console.error('[ENCUESTA] Error guardando encuesta:', error);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await SoundService.reproducir('error');
            showToast('error', 'Error al enviar', 'Ocurrió un error al guardar tu encuesta. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-primary">
            <LoadingModal visible={loading} message="Enviando Encuesta..." />

            <View className="px-6 pt-4 flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={async () => {
                        await SoundService.reproducir('exito');
                        router.back();
                    }}
                    className="flex-row items-center bg-secondary/20 py-2 px-4 rounded-full border border-tertiary/20"
                >
                    <Ionicons name="arrow-back" size={16} color="#F5C065" style={{ marginRight: 6 }} />
                    <Text className="text-secondary font-bold text-xs uppercase">Volver</Text>
                </TouchableOpacity>

                <View className="bg-secondary/15 px-4 py-1.5 rounded-full border border-tertiary/10">
                    <Text className="text-tertiary font-bold text-xs uppercase">Mesa {numeroMesa || mesaId}</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 mt-4" showsVerticalScrollIndicator={false}>
                <View className="mb-6">
                    <Text className="text-secondary font-black text-2xl uppercase text-center mb-1">
                        Tu Experiencia
                    </Text>
                    <Text className="text-tertiary font-medium text-xs text-center uppercase tracking-widest">
                        Ayúdanos a mejorar nuestro servicio
                    </Text>
                </View>

                <View className="bg-secondary p-6 rounded-3xl border border-tertiary/15 shadow-sm mb-12 space-y-6">
                    {/* Nombre */}
                    <View>
                        <Text className="text-primary font-bold text-sm uppercase mb-2">1. Tu Nombre o Apodo</Text>
                        <TextInput
                            value={clienteNombre}
                            onChangeText={setClienteNombre}
                            placeholder="Escribe tu nombre..."
                            placeholderTextColor="rgba(49, 96, 61, 0.4)"
                            className="bg-secondary/40 border border-primary/20 rounded-2xl py-3.5 px-4 text-primary font-semibold text-sm"
                            editable={!fetchingProfile}
                        />
                    </View>

                    {/* Satisfaccion */}
                    <View className="border-t border-primary/10 pt-4">
                        <Text className="text-primary font-bold text-sm uppercase text-center mb-2">
                            2. ¿Qué tan satisfecho estás con tu visita?
                        </Text>
                        {renderEstrellas()}
                    </View>

                    {/* Recomienda */}
                    <View className="border-t border-primary/10 pt-4">
                        <Text className="text-primary font-bold text-sm uppercase mb-2">
                            3. ¿Recomendarías este restaurante a un amigo?
                        </Text>
                        {renderSelectorRecomienda()}
                    </View>

                    {/* Limpieza */}
                    <View className="border-t border-primary/10 pt-4">
                        <Text className="text-primary font-bold text-sm uppercase mb-2">
                            4. Estado de Limpieza y Orden
                        </Text>
                        {renderSelectorLimpieza()}
                    </View>

                    {/* Atencion (1-10) */}
                    <View className="border-t border-primary/10 pt-4">
                        <Text className="text-primary font-bold text-sm uppercase mb-1">
                            5. Calificación de la Atención
                        </Text>
                        <Text className="text-primary/50 text-[10px] uppercase font-semibold mb-2">
                            Valora la amabilidad y rapidez del Mozo / Metre
                        </Text>
                        {renderSelector1a10(atencion, setAtencion)}
                    </View>

                    {/* Comida (1-10) */}
                    <View className="border-t border-primary/10 pt-4">
                        <Text className="text-primary font-bold text-sm uppercase mb-1">
                            6. Calificación de la Comida
                        </Text>
                        <Text className="text-primary/50 text-[10px] uppercase font-semibold mb-2">
                            Valora el sabor, presentación y temperatura
                        </Text>
                        {renderSelector1a10(comida, setComida)}
                    </View>

                    {/* Ambiente (1-10) */}
                    <View className="border-t border-primary/10 pt-4">
                        <Text className="text-primary font-bold text-sm uppercase mb-1">
                            7. Calificación del Ambiente
                        </Text>
                        <Text className="text-primary/50 text-[10px] uppercase font-semibold mb-2">
                            Valora la música, iluminación y temperatura del local
                        </Text>
                        {renderSelector1a10(ambiente, setAmbiente)}
                    </View>

                    {/* Comentarios */}
                    <View className="border-t border-primary/10 pt-4">
                        <Text className="text-primary font-bold text-sm uppercase mb-2">
                            8. Comentarios / Sugerencias adicionales
                        </Text>
                        <TextInput
                            value={comentarios}
                            onChangeText={setComentarios}
                            placeholder="Escribe aquí tu opinión (opcional)..."
                            placeholderTextColor="rgba(49, 96, 61, 0.4)"
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="bg-secondary/40 border border-primary/20 rounded-2xl p-4 text-primary font-medium text-sm h-24"
                        />
                    </View>

                    {/* Boton enviar */}
                    <TouchableOpacity
                        onPress={enviarEncuesta}
                        activeOpacity={0.9}
                        className="w-full bg-primary py-4.5 rounded-[22px] items-center justify-center border-b-4 border-[#1E3D25] shadow-lg mt-6"
                    >
                        <Text className="text-secondary font-black uppercase text-sm tracking-wider">
                            Enviar Encuesta
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
