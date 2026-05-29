import { useToast } from "@/src/context/ToastContext";
import { SoundService } from '@/src/services/soundService';
import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View, Image, Dimensions, ScrollView } from 'react-native';

export default function ListaEntregarPedidosMozo() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [pedidosALlevar, setPedidosALlevar] = useState<any[]>([]);

    useEffect(() => {
        fetchPedidosListos();

        const channel = supabase
            .channel('cambios_entregas_mozo')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => fetchPedidosListos())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchPedidosListos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .in('estado', ['Listo Cocina', 'Listo Bar'])
                .order('created_at', { ascending: true });

            if (error) throw error;

            const grupos: { [key: number]: any } = {};
            data?.forEach((item) => {
                if (!grupos[item.mesa_numero]) {
                    grupos[item.mesa_numero] = { mesa: item.mesa_numero, items: [] };
                }
                grupos[item.mesa_numero].items.push(item);
            });

            setPedidosALlevar(Object.values(grupos));
        } catch (error: any) {
            console.error("Error cargando listos:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarcarComoEntregado = async (mesaNumero: number, items: any[]) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            const ids = items.map(i => i.id);

            const { error } = await supabase.from('pedidos').update({ estado: 'Entregado' }).in('id', ids);
            if (error) throw error;

            await SoundService.reproducir('exito');
            showToast("success", "Pedido Servido", `Mesa Nº ${mesaNumero} entregada.`);
            fetchPedidosListos();
        } catch (error: any) { Alert.alert("Error", error.message); }
    };

    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
    const HEADER_HEIGHT = 80;
    const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - 120;

    if (loading && pedidosALlevar.length === 0) {
        return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#F5C065" /></View>;
    }

    return (
        <>
            <FlatList
                data={pedidosALlevar}
                keyExtractor={(item) => item.mesa.toString()}
                horizontal={true}
                pagingEnabled={true}
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                ListEmptyComponent={
                    <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT }} className="justify-center items-center px-6">
                        <View className="items-center mb-4">
                            <Image
                                source={require('@/assets/images/icon.png')}
                                className="w-48 h-48"
                                resizeMode="contain"
                            />
                        </View>
                        <Ionicons name="restaurant-outline" size={40} color="#31603D" style={{ opacity: 0.5 }} />
                        <Text className="text-primary font-black text-center mt-3 uppercase text-lg tracking-wider">No hay bandejas listas</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const CARD_WIDTH = SCREEN_WIDTH - 48;
                    const CARD_HEIGHT = AVAILABLE_HEIGHT - 40;

                    return (
                        <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT, paddingHorizontal: 24, justifyContent: 'center' }}>
                            <View
                                style={{ width: CARD_WIDTH, height: CARD_HEIGHT, elevation: 3 }}
                                className="bg-primary rounded-[32px] p-6 border border-tertiary/30 shadow-lg justify-between"
                            >
                                {/* Header de la mesa */}
                                <View className="flex-row justify-between items-center border-b border-tertiary/20 pb-3 mb-3">
                                    <Text className="text-white font-black text-lg uppercase">Mesa N° {item.mesa}</Text>
                                    <View className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                                        <Text className="text-emerald-400 font-bold text-[9px] uppercase tracking-wider">Listo para servir</Text>
                                    </View>
                                </View>

                                {/* Lista de productos scrollable */}
                                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 my-2">
                                    {item.items.map((prod: any) => (
                                        <View key={prod.id} className="flex-row justify-between items-center py-2 border-b border-tertiary/10">
                                            <View className="flex-1">
                                                <Text className="text-white/90 font-medium text-sm uppercase">{prod.producto_nombre}</Text>
                                                <Text className="text-tertiary font-bold text-[9px] uppercase mt-0.5">
                                                    {prod.categoria === 'bebida' ? '🍹 Bar' : '🍳 Cocina'}
                                                </Text>
                                            </View>
                                            <Text className="text-tertiary font-black text-sm">x{prod.cantidad}</Text>
                                        </View>
                                    ))}
                                </ScrollView>

                                {/* Botón de acción */}
                                <TouchableOpacity
                                    onPress={() => handleMarcarComoEntregado(item.mesa, item.items)}
                                    className="w-full bg-tertiary rounded-full py-4 items-center justify-center border-b-4 border-orange active:mt-1 active:border-b-0 mt-3"
                                >
                                    <Text className="text-primary font-black text-xs uppercase">Marcar como Entregado</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }}
            />

            {pedidosALlevar.length > 1 && (
                <View className="flex-row justify-center items-center pb-6 bg-secondary">
                    <Ionicons name="swap-horizontal" size={14} color="#31603D" style={{ marginRight: 6 }} />
                    <Text className="text-primary/75 font-bold text-[10px] uppercase tracking-widest">
                        Desliza para ver más ({pedidosALlevar.length} mesas listas)
                    </Text>
                </View>
            )}
        </>
    );
}