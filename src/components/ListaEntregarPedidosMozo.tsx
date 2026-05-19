import { useToast } from "@/src/context/ToastContext";
import { SoundService } from '@/src/services/soundService';
import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';

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

    if (loading && pedidosALlevar.length === 0) {
        return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#F5C065" /></View>;
    }

    return (
        <FlatList
        data={pedidosALlevar}
        keyExtractor={(item) => item.mesa.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View className="bg-secondary p-8 rounded-3xl items-center mt-6">
            <Ionicons name="restaurant-outline" size={42} color="#31603D" />
            <Text className="text-primary font-black text-center mt-3 uppercase text-xs tracking-wider">No hay bandejas listas</Text>
            </View>
        }
        renderItem={({ item }) => (
            <View style={{ elevation: 3 }} className="bg-secondary rounded-[32px] p-6 mb-6 border border-tertiary/10">
            <View className="flex-row justify-between items-center border-b border-primary/10 pb-3 mb-3">
                <Text className="text-primary font-black text-base uppercase">Mesa N° {item.mesa}</Text>
                <View className="bg-green-100 px-3 py-1 rounded-full"><Text className="text-green-800 font-bold text-[10px] uppercase">Listo para servir</Text></View>
            </View>
            <View className="mb-5">
                {item.items.map((prod: any) => (
                <View key={prod.id} className="flex-row justify-between items-center py-1.5 border-b border-primary/5">
                    <Text className="text-primary font-medium text-xs uppercase max-w-[75%]">{prod.producto_nombre}</Text>
                    <View className="flex-row items-center space-x-2 gap-2">
                    <Text className="text-primary/60 font-bold text-[10px] uppercase">
                        {prod.categoria === 'bebida' ? '🍹 Bar' : '🍳 Cocina'}
                    </Text>
                    <Text className="text-primary font-black text-xs">x{prod.cantidad}</Text>
                    </View>
                </View>
                ))}
            </View>
            <TouchableOpacity onPress={() => handleMarcarComoEntregado(item.mesa, item.items)} className="w-full bg-tertiary rounded-full py-4 items-center border-b-4 border-orange active:mt-1 active:border-b-0">
                <Text className="text-primary font-black text-xs uppercase">Marcar como Entregado</Text>
            </TouchableOpacity>
            </View>
        )}
        />
    );
}