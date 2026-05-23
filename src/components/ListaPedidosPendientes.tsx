import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { supabase } from '@/src/services/SupabaseClient'; // necesario para Realtime
import { PedidoService } from '@/src/services/pedidoService';
import LoadingModal from '@/src/components/LoadingModal';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SoundService } from '@/src/services/soundService';

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
            setPedidosAgrupados(Object.values(grupos));
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
            const idsAModificar = items.map(i => i.id);
            await PedidoService.actualizarEstado(idsAModificar, 'En Preparación');
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
            const idsAModificar = items.map(i => i.id);
            const nuevoEstado = sector === 'cocina' ? 'Listo Cocina' : 'Listo Bar';
            await PedidoService.actualizarEstado(idsAModificar, nuevoEstado);
            await SoundService.reproducir('exito');
            fetchPedidosPendientes();
        } catch (error: any) {
            SoundService.reproducir('error');
            console.error("No se pudo cambiar el estado del pedido:", error.message);
        }
    };

    return (
        <>
            <LoadingModal visible={loading && pedidosAgrupados.length === 0} message="Cargando comandas..." />
            <FlatList
                data={pedidosAgrupados}
                keyExtractor={(item) => item.mesa.toString()}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View className="bg-secondary p-8 rounded-3xl items-center mt-6">
                        <Ionicons name="checkmark-circle-outline" size={42} color="#31603D" />
                        <Text className="text-primary font-black text-center mt-3 uppercase text-xs tracking-wider">
                            No hay comandas pendientes
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const horaFormateada = item.fecha
                        ? new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--:--';

                    const tieneItemsPendientes = item.items.some((i: any) => i.estado === 'Pendiente');

                    return (
                        <View style={{ elevation: 3 }} className="bg-secondary rounded-[32px] p-6 mb-6 border border-tertiary/10 shadow-sm">

                            {/* Encabezado de la Tarjeta */}
                            <View className="flex-row justify-between items-center border-b border-primary/10 pb-3 mb-4">
                                <View className="flex-row items-center">
                                    <View className="bg-primary/10 p-2 rounded-full mr-3">
                                        <Ionicons name="restaurant" size={16} color="#31603D" />
                                    </View>
                                    <Text className="text-primary font-black text-lg uppercase">Mesa {item.mesa}</Text>
                                </View>

                                <View className="flex-row items-center bg-primary/5 px-3 py-1 rounded-full">
                                    <Ionicons name="time-outline" size={12} color="#6E433D" style={{ marginRight: 4 }} />
                                    <Text className="text-tertiary font-bold text-[10px] uppercase">Pedida: {horaFormateada}</Text>
                                </View>
                            </View>

                            {/* Listado de Items pertenecientes a este sector */}
                            <View className="mb-5">
                                {item.items.map((prod: any) => (
                                    <View key={prod.id} className="flex-row justify-between items-center py-2 border-b border-primary/5">
                                        <View className="flex-1 pr-2">
                                            <Text className="text-primary font-bold text-sm uppercase max-w-[80%]">
                                                {prod.producto_nombre}
                                            </Text>
                                            <Text className={`font-semibold text-[10px] uppercase mt-0.5 ${prod.estado === 'En Preparación' ? 'text-orange-600' : 'text-primary/50'}`}>
                                                Estado: {prod.estado}
                                            </Text>
                                        </View>
                                        <View className="bg-primary px-3 py-1 rounded-xl">
                                            <Text className="text-white font-black text-xs">x{prod.cantidad}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* Accion Principal de Despacho */}
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
                    );
                }}
            />
        </>
    );
}