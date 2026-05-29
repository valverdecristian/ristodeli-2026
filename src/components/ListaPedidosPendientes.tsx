import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions, ScrollView, Image, ActivityIndicator } from 'react-native';
import { supabase } from '@/src/services/SupabaseClient'; // necesario para Realtime
import { PedidoService } from '@/src/services/pedidoService';
import LoadingModal from '@/src/components/LoadingModal';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SoundService } from '@/src/services/soundService';
import { NotificationService } from '@/src/services/notificationService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 80;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - 120;

interface ListaPedidosProps {
    sector: 'cocina' | 'bar';
}

export default function ListaPedidosPendientes({ sector }: ListaPedidosProps) {
    const [loading, setLoading] = useState(true);
    const [pedidosAgrupados, setPedidosAgrupados] = useState<any[]>([]);

    useEffect(() => {
        fetchPedidosPendientes();

        const channel = supabase
            .channel(`cambios_pedidos_${sector}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => fetchPedidosPendientes())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchPedidosPendientes = async () => {
        try {
            setLoading(true);
            const data = await PedidoService.obtenerPendientesPorSector(sector);

            // AGRUPACION POR MESA 
            const grupos: { [key: number]: any } = {};
            data.forEach((item) => {
                if (!grupos[item.mesa_numero]) {
                    grupos[item.mesa_numero] = {
                        mesa: item.mesa_numero,
                        fecha: item.created_at,
                        items: [],
                    };
                }
                grupos[item.mesa_numero].items.push(item);
            });

            const dbValues = Object.values(grupos);
            setPedidosAgrupados(dbValues);
        } catch (error: any) {
            console.error("Error al recuperar comandas pendientes:", error.message);
        } finally {
            setLoading(false);
        }
    };

    // Comenzar preparacion
    const handleComenzarMesa = async (mesaNumero: number, items: any[]) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            if (items.length > 0) {
                const idsAModificar = items.map(i => i.id);
                await PedidoService.actualizarEstado(idsAModificar, 'En Preparación');
            }

            await SoundService.reproducir('exito');
            fetchPedidosPendientes();
        } catch (error: any) {
            SoundService.reproducir('error');
            console.error("No se pudo iniciar la preparación:", error.message);
        }
    };

    // Avisar pedido listo
    const handleTerminarMesa = async (mesaNumero: number, items: any[]) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            if (items.length > 0) {
                const idsAModificar = items.map(i => i.id);
                const nuevoEstado = sector === 'cocina' ? 'Listo Cocina' : 'Listo Bar';
                await PedidoService.actualizarEstado(idsAModificar, nuevoEstado);
                NotificationService.notificarPedidoListoParaEntregar(mesaNumero, sector);
            }

            await SoundService.reproducir('exito');
            fetchPedidosPendientes();
        } catch (error: any) {
            SoundService.reproducir('error');
            console.error("No se pudo cambiar el estado del pedido:", error.message);
        }
    };

    if (loading && pedidosAgrupados.length === 0) {
        return (
            <View className="flex-1 justify-center items-center bg-secondary">
                <ActivityIndicator size="large" color="#F5C065" />
            </View>
        );
    }

    return (
        <>
            <LoadingModal visible={loading && pedidosAgrupados.length === 0} message="Cargando comandas..." />
            <FlatList
                data={pedidosAgrupados}
                keyExtractor={(item) => item.mesa.toString()}
                horizontal={true}
                pagingEnabled={true}
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                ListEmptyComponent={
                    <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT }} className="justify-center items-center px-6 bg-secondary">
                        <View className="items-center mb-4">
                            <Image
                                source={require("@/assets/images/icon.png")}
                                className="w-48 h-48"
                                resizeMode="contain"
                            />
                        </View>
                        <Ionicons name="checkmark-circle-outline" size={40} color="#31603D" style={{ opacity: 0.5 }} />
                        <Text className="text-primary font-black text-center mt-3 uppercase text-lg tracking-wider">
                            No hay comandas pendientes
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const horaFormateada = item.fecha
                        ? new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--:--';

                    const tieneItemsPendientes = item.items.some((i: any) => i.estado === 'Pendiente');
                    const CARD_WIDTH = SCREEN_WIDTH - 48;
                    const CARD_HEIGHT = AVAILABLE_HEIGHT - 40;

                    return (
                        <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT, paddingHorizontal: 24, justifyContent: 'center' }}>
                            <View
                                style={{ width: CARD_WIDTH, height: CARD_HEIGHT, elevation: 3 }}
                                className="bg-primary rounded-[32px] p-6 border border-tertiary/30 shadow-lg justify-between"
                            >
                                {/* Encabezado de la Tarjeta */}
                                <View className="flex-row justify-between items-center border-b border-tertiary/20 pb-3 mb-3">
                                    <View className="flex-row items-center">
                                        <View className="bg-tertiary/20 p-2 rounded-full mr-3">
                                            <Ionicons name="restaurant" size={16} color="#F5C065" />
                                        </View>
                                        <Text className="text-white font-black text-lg uppercase">Mesa {item.mesa}</Text>
                                    </View>

                                    <View className="flex-row items-center bg-secondary/15 px-3 py-1 rounded-full border border-tertiary/20">
                                        <Ionicons name="time-outline" size={12} color="#F5C065" style={{ marginRight: 4 }} />
                                        <Text className="text-tertiary font-bold text-[9px] uppercase">Pedida: {horaFormateada}</Text>
                                    </View>
                                </View>

                                {/* Listado de Items scrollable */}
                                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 my-2">
                                    {item.items.map((prod: any) => (
                                        <View key={prod.id} className="flex-row justify-between items-center py-2 border-b border-tertiary/10">
                                            <View className="flex-1 pr-2">
                                                <Text className="text-white font-bold text-sm uppercase">
                                                    {prod.producto_nombre}
                                                </Text>
                                                <Text className={`font-semibold text-[10px] uppercase mt-0.5 ${prod.estado === 'En Preparación' ? 'text-amber-400' : 'text-white/50'}`}>
                                                    Estado: {prod.estado}
                                                </Text>
                                            </View>
                                            <View className="bg-tertiary/20 px-3 py-1 rounded-xl border border-tertiary/30">
                                                <Text className="text-tertiary font-black text-xs">x{prod.cantidad}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>

                                {/* Accion Principal de Despacho */}
                                <View className="mt-3">
                                    {tieneItemsPendientes ? (
                                        <TouchableOpacity
                                            onPress={() => handleComenzarMesa(item.mesa, item.items)}
                                            className="w-full bg-tertiary rounded-full py-4 flex-row justify-center items-center border-b-4 border-orange active:mt-1 active:border-b-0"
                                        >
                                            <Ionicons name="play-circle" size={20} color="#31603D" style={{ marginRight: 6 }} />
                                            <Text className="text-primary font-black text-xs uppercase tracking-wider">
                                                Comenzar Preparación
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => handleTerminarMesa(item.mesa, item.items)}
                                            className="w-full bg-emerald-600 rounded-full py-4 flex-row justify-center items-center border-b-4 border-emerald-800 active:mt-1 active:border-b-0"
                                        >
                                            <Ionicons name="checkmark-done-circle" size={20} color="white" style={{ marginRight: 6 }} />
                                            <Text className="text-white font-black text-xs uppercase tracking-wider">
                                                {sector === 'cocina' ? 'Terminar Cocción' : 'Bebidas Listas'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                }}
            />

            {pedidosAgrupados.length > 1 && (
                <View className="flex-row justify-center items-center pb-6 bg-secondary">
                    <Ionicons name="swap-horizontal" size={14} color="#31603D" style={{ marginRight: 6 }} />
                    <Text className="text-primary/75 font-bold text-[10px] uppercase tracking-widest">
                        Desliza para ver más ({pedidosAgrupados.length} comandas)
                    </Text>
                </View>
            )}
        </>
    );
}