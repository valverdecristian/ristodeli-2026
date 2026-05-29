import { useToast } from "@/src/context/ToastContext";
import { AuthService } from '@/src/services/authService';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import LoadingModal from '@/src/components/LoadingModal';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEADER_HEIGHT = 75;
const SAFE_AREA_ESTIMATE = 60;
const VERTICAL_PADDING = 40;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - SAFE_AREA_ESTIMATE - VERTICAL_PADDING;

const CARD_HEIGHT = AVAILABLE_HEIGHT * 0.95;

interface ClientePendiente {
    id: string;
    nombres: string;
    apellidos: string;
    foto_url: string;
    email: string;
}

export default function AprobacionClientesScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const [clientes, setClientes] = useState<ClientePendiente[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [isFetching, setIsFetching] = useState(true);

    // CARGAR CLIENTES PENDIENTES
    const obtenerClientesPendientes = async () => {
        setIsFetching(true);
        try {
            const data = await AuthService.obtenerClientesPendientes();
            setClientes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    };
    useFocusEffect(
        useCallback(() => {
            obtenerClientesPendientes();
        }, [])
    );

    // CAMBIO DE PERFIL (APROBAR O RECHAZAR)
    const procesarCliente = async (cliente: ClientePendiente, decision: 'aprobar' | 'rechazar') => {
        setLoadingText(decision === 'aprobar' ? 'Aprobando cuenta...' : 'Rechazando cuenta...');
        setLoading(true);

        const nuevoPerfil = decision === 'aprobar' ? 'cliente_registrado' : 'cliente_rechazado';

        try {
            await AuthService.procesarAprobacion(cliente.id, decision);

            await SoundService.reproducir('exito');

            showToast(
                "success",
                decision === 'aprobar' ? "Cliente Aceptado" : "Cliente Rechazado",
                `${cliente.apellidos}, ${cliente.nombres} ahora tiene perfil de ${nuevoPerfil}.`
            );

            setClientes(prev => prev.filter(c => c.id !== cliente.id));

        } catch (error: any) {
            SoundService.reproducir('error');
            showToast("error", "Error de operación", error.message || "No se pudo actualizar el perfil.");
            console.error("Detalle del fallo:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderCliente = ({ item }: { item: ClientePendiente }) => (
        <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: SCREEN_WIDTH - 40, height: CARD_HEIGHT }} className="bg-secondary rounded-[30px] p-6 justify-between border border-tertiary/20 shadow-xl overflow-hidden">

                {/* ID Card Header */}
                <View className="flex-row items-center justify-between pb-3 border-b border-primary/10">
                    <View className="flex-row items-center">
                        <Image
                            source={require('@/assets/images/icon.png')}
                            className="w-10 h-10 rounded-lg mr-2"
                            resizeMode="contain"
                        />
                        <View>
                            <Text className="text-primary font-black text-xs uppercase tracking-widest">RistoDeli</Text>
                            <Text className="text-primary/60 font-bold text-[9px] uppercase tracking-wider">Petición de Acceso</Text>
                        </View>
                    </View>
                    <View className="bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                        <Text className="text-primary font-black text-[9px] uppercase tracking-widest">Pendiente</Text>
                    </View>
                </View>

                {/* Foto de Perfil Rectangular Grande con Marco */}
                <View className="items-center justify-center flex-1 my-4">
                    {item.foto_url ? (
                        <Image
                            source={{ uri: item.foto_url }}
                            className="w-60 h-60 rounded-3xl border-4 border-tertiary/40 shadow-2xl"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-60 h-60 rounded-3xl bg-primary/10 items-center justify-center border-4 border-tertiary/40 shadow-2xl">
                            <Ionicons name="person-outline" size={96} color="#31603D" style={{ opacity: 0.5 }} />
                        </View>
                    )}
                </View>

                {/* Detalles del Cliente */}
                <View className="items-center mb-5">
                    <Text className="text-primary font-black text-2xl uppercase tracking-tighter text-center" numberOfLines={1}>
                        {item.apellidos}, {item.nombres}
                    </Text>
                    <View className="flex-row items-center mt-2 bg-primary/5 px-4 py-1.5 rounded-full border border-primary/5">
                        <Ionicons name="mail-outline" size={14} color="#31603D" style={{ marginRight: 6 }} />
                        <Text className="text-primary/70 font-bold text-xs" numberOfLines={1}>
                            {item.email}
                        </Text>
                    </View>
                </View>

                {/* Botones de Acción */}
                <View className="flex-row justify-between gap-4">
                    <TouchableOpacity
                        onPress={() => procesarCliente(item, 'rechazar')}
                        className="flex-1 bg-red-500 py-4 rounded-2xl flex-row items-center justify-center border-b-4 border-red-700 active:opacity-80"
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
                        <Text className="text-white font-black text-xs uppercase tracking-wider">Rechazar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => procesarCliente(item, 'aprobar')}
                        className="flex-1 bg-tertiary py-4 rounded-2xl flex-row items-center justify-center border-b-4 border-orange active:opacity-80"
                    >
                        <Ionicons name="checkmark-circle-outline" size={20} color="#31603D" style={{ marginRight: 6 }} />
                        <Text className="text-primary font-black text-xs uppercase tracking-wider">Aprobar</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-primary">
            {/* MODAL DE ESPERA CON LOGO */}
            <LoadingModal visible={loading || isFetching} message={isFetching ? "Obteniendo solicitudes..." : loadingText} />

            {/* ENCABEZADO CON BOTÓN DE REGRESO */}
            <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center shadow-2xl mb-4">
                <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1 active:opacity-70">
                    <Ionicons name="arrow-back" size={30} color="#31603D" />
                </TouchableOpacity>
                <Text className="text-primary font-bold text-2xl uppercase tracking-tighter">
                    Clientes Pendientes
                </Text>
            </View>

            {!isFetching && clientes.length === 0 ? (
                <View className="flex-1 justify-center items-center px-6">
                    <Ionicons name="checkmark-circle-outline" size={64} color="#F8EECB" />
                    <Text className="text-secondary font-bold text-center mt-4 text-base uppercase">
                        No hay solicitudes pendientes
                    </Text>
                </View>
            ) : (
                <View className="flex-1">
                    <FlatList
                        data={clientes}
                        keyExtractor={(item) => item.id}
                        horizontal={true}
                        pagingEnabled={true}
                        showsHorizontalScrollIndicator={false}
                        renderItem={renderCliente}
                        decelerationRate="fast"
                    />
                </View>
            )}
        </SafeAreaView>
    );
}