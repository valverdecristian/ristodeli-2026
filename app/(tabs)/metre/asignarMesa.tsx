import LoadingModal from '@/src/components/LoadingModal';
import { supabase } from '@/src/services/SupabaseClient';
import { ListaEsperaService } from '@/src/services/listaEsperaService';
import { MesaService } from '@/src/services/mesaService';
import { SoundService } from '@/src/services/soundService';
import { NotificationService } from '@/src/services/notificationService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useToast } from '@/src/context/ToastContext';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Text, TouchableOpacity, View, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEADER_HEIGHT = 75;
const SAFE_AREA_ESTIMATE = 60;
const VERTICAL_PADDING = 40;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - SAFE_AREA_ESTIMATE - VERTICAL_PADDING;

const CARD_HEIGHT = AVAILABLE_HEIGHT * 0.95;

export default function AsignarMesaScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [esperaList, setEsperaList] = useState<any[]>([]);
    const [mesasLibres, setMesasLibres] = useState<any[]>([]);

    const [modalVisible, setModalVisible] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);

    useEffect(() => {
        fetchListaEspera();

        const channel = supabase
            .channel('cambios_salon_metre')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lista_espera' }, () => fetchListaEspera())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, () => fetchListaEspera())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchListaEspera = async () => {
        try {
            setLoading(true);
            const listaFormateada = await ListaEsperaService.obtenerPendientes();
            setEsperaList(listaFormateada);

            const mesas = await MesaService.obtenerLibres();
            setMesasLibres(mesas);
        } catch (error: any) {
            console.error("Error cargando datos del salón:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAsignarMesa = async (mesa: any) => {
        if (!clienteSeleccionado) return;

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            await MesaService.actualizarEstado(mesa.id, 'Ocupada');
            await ListaEsperaService.asignarMesa(clienteSeleccionado.id, mesa.id);

            SoundService.reproducir('exito');
            showToast('success', 'Mesa asignada', `Mesa N°${mesa.numero} asignada correctamente.`);

            NotificationService.notificarMesaAsignada(clienteSeleccionado.cliente_id, mesa.numero);

            setModalVisible(false);
            setClienteSeleccionado(null);
            fetchListaEspera();

        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Error de asignación", error.message);
        }
    };

    const chunkArray = (arr: any[], size: number) => {
        const chunked = [];
        for (let i = 0; i < arr.length; i += size) {
            chunked.push(arr.slice(i, i + size));
        }
        return chunked;
    };

    const renderPaginaClientes = ({ item: parClientes }: { item: any[] }) => {
        return (
            <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 }}>
                {parClientes.map((cliente) => (
                    <View
                        key={cliente.id}
                        style={{ width: SCREEN_WIDTH - 40, height: (AVAILABLE_HEIGHT - 60) / 2 }}
                        className="bg-secondary rounded-[30px] flex-row overflow-hidden border border-tertiary/15 shadow-xl mb-4"
                    >
                        {/* LADO IZQUIERDO: Logo, Nombre, Tipo de cliente */}
                        <View className="flex-1 p-5 justify-between">
                            {/* Header del Ticket con el logo del local */}
                            <View className="flex-row items-center">
                                <Image
                                    source={require('@/assets/images/icon.png')}
                                    className="w-12 h-12 rounded-xl mr-3 border border-primary/10 bg-primary/5"
                                    resizeMode="contain"
                                />
                                <View className="flex-1">
                                    <Text className="text-primary font-black text-[9px] uppercase tracking-widest">RistoDeli Metre</Text>
                                    <Text className="text-primary/70 font-black text-lg uppercase tracking-tighter" numberOfLines={1}>
                                        {cliente.nombreCompleto}
                                    </Text>
                                </View>
                            </View>

                            {/* Badge de tipo de cliente */}
                            <View className="flex-row items-center mt-2">
                                <View className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                    <Text className="text-primary font-black text-[9px] uppercase tracking-widest">{cliente.tipo}</Text>
                                </View>
                                <Text className="text-primary/40 text-[9px] uppercase font-bold tracking-wider ml-2">En espera</Text>
                            </View>
                        </View>

                        {/* DIVISOR DE TICKET */}
                        <View className="w-px h-full border-r border-dashed border-primary/25" />

                        {/* LADO DERECHO: Botón de Asignar (Cupón) */}
                        <TouchableOpacity
                            onPress={() => { setClienteSeleccionado(cliente); setModalVisible(true); }}
                            className="bg-primary justify-center items-center px-6 active:opacity-90 flex-col"
                            style={{ minWidth: 100 }}
                        >
                            <Ionicons name="restaurant-outline" size={24} color="#F8EECB" />
                            <Text className="text-secondary font-black text-[9px] uppercase tracking-widest mt-2 text-center leading-tight">Asignar Mesa</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        );
    };

    const renderMesaLibre = ({ item }: { item: any }) => (
        <View style={{ width: SCREEN_WIDTH - 80, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 }}>
            <View className="bg-secondary w-full p-6 rounded-[28px] border border-tertiary/20 shadow-xl items-center justify-between h-[300px]">
                {/* Icon based on Type */}
                <View className="bg-primary/10 p-5 rounded-full mb-2 mt-2">
                    <Ionicons name={item.tipo?.toLowerCase() === 'vip' ? 'star' : 'restaurant'} size={48} color="#31603D" />
                </View>

                {/* Table Info */}
                <View className="items-center mb-4">
                    <Text className="text-primary font-black text-2xl uppercase tracking-tight">Mesa {item.numero}</Text>
                    <View className="bg-primary/10 px-4 py-1.5 rounded-full mt-2 border border-primary/20">
                        <Text className="text-primary font-bold text-[10px] uppercase tracking-wider">{item.tipo} - {item.comensales} pax</Text>
                    </View>
                </View>

                {/* Select Button */}
                <TouchableOpacity
                    onPress={() => handleAsignarMesa(item)}
                    className="w-full bg-primary py-3.5 rounded-2xl items-center justify-center border-b-4 border-[#1E3D25] active:opacity-85"
                >
                    <Text className="text-white font-black text-xs uppercase tracking-wider">Asignar a esta Mesa</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const paginasEspera = chunkArray(esperaList, 2);

    return (
        <SafeAreaView className="flex-1 bg-primary">
            {/* Header / Cabecera */}
            <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center justify-between shadow-2xl">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={30} color="#31603D" />
                    </TouchableOpacity>
                    <Text className="text-primary font-bold text-2xl uppercase tracking-tighter">Asignación</Text>
                </View>
                <Ionicons name="people-outline" size={28} color="#31603D" />
            </View>

            <LoadingModal visible={loading} message="Cargando lista de espera..." />

            {!loading && (
                <View className="flex-1">
                    {esperaList.length === 0 ? (
                        <View style={{ height: AVAILABLE_HEIGHT }} className="justify-center items-center px-6">
                            <View className="bg-secondary p-8 rounded-[30px] items-center border border-tertiary/10 w-full max-w-xs shadow-xl">
                                <Ionicons name="people-outline" size={48} color="#31603D" />
                                <Text className="text-primary font-black text-center mt-3 uppercase text-xs tracking-wider">Sin espera</Text>
                                <Text className="text-primary/60 text-center mt-1 text-[10px] uppercase font-bold tracking-widest">No hay clientes pendientes</Text>
                            </View>
                        </View>
                    ) : (
                        <FlatList
                            data={paginasEspera}
                            keyExtractor={(item, index) => index.toString()}
                            horizontal={true}
                            pagingEnabled={true}
                            showsHorizontalScrollIndicator={false}
                            renderItem={renderPaginaClientes}
                            decelerationRate="fast"
                        />
                    )}
                </View>
            )}

            {/* MODAL DE SELECCION */}
            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View className="flex-1 justify-center items-center bg-black/60">
                    <View style={{ width: SCREEN_WIDTH - 40, height: 460 }} className="bg-primary rounded-[35px] p-6 border border-tertiary/20 shadow-2xl justify-between">
                        {/* Header */}
                        <View className="flex-row justify-between items-center pb-4 border-b border-secondary/10">
                            <View className="flex-1 pr-2">
                                <Text className="text-white font-black text-lg uppercase tracking-tight" numberOfLines={1}>Mesas Libres ({mesasLibres.length})</Text>
                                <Text className="text-secondary/70 font-bold text-[10px] uppercase tracking-wider mt-0.5" numberOfLines={1}>Para: {clienteSeleccionado?.nombreCompleto}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-1">
                                <Ionicons name="close-circle" size={32} color="#F5C065" />
                            </TouchableOpacity>
                        </View>

                        {/* Horizontal List of Tables */}
                        <View className="flex-1 justify-center my-4 items-center">
                            {mesasLibres.length === 0 ? (
                                <View className="bg-secondary p-8 rounded-3xl items-center w-full max-w-[280px]">
                                    <Ionicons name="alert-circle-outline" size={48} color="#E76F51" />
                                    <Text className="text-primary font-bold text-center mt-3 uppercase text-xs">No hay mesas libres</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={mesasLibres}
                                    keyExtractor={(item) => item.id.toString()}
                                    horizontal={true}
                                    showsHorizontalScrollIndicator={false}
                                    renderItem={renderMesaLibre}
                                    snapToInterval={SCREEN_WIDTH - 80}
                                    decelerationRate="fast"
                                    snapToAlignment="center"
                                />
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}