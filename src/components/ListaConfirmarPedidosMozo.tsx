import { useToast } from "@/src/context/ToastContext";
import { SoundService } from '@/src/services/soundService';
import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';

export default function ListaConfirmarPedidosMozo() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [pedidosAConfirmar, setPedidosAConfirmar] = useState<any[]>([]);
    const router = useRouter();
    
    useEffect(() => {
        fetchPedidosAConfirmar();
        
        const channel = supabase
        .channel('cambios_confirmaciones_mozo')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => fetchPedidosAConfirmar())
        .subscribe();

        return () => {
        supabase.removeChannel(channel);
        };
    }, []);

    const fetchPedidosAConfirmar = async () => {
        try {
        setLoading(true);
        const { data, error } = await supabase
            .from('pedidos')
            .select('*')
            .eq('estado', 'A Confirmar Mozo')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Agrupa por numero de mesa
        const grupos: { [key: number]: any } = {};
        data?.forEach((item) => {
            if (!grupos[item.mesa_numero]) {
            grupos[item.mesa_numero] = {
                mesa: item.mesa_numero,
                fecha: item.created_at,
                items: [],
            };
            }
            grupos[item.mesa_numero].items.push(item);
        });

        setPedidosAConfirmar(Object.values(grupos));
        } catch (error: any) {
        console.error("Error al cargar pedidos de mozo:", error.message);
        } finally {
        setLoading(false);
        }
    };

    // Pasa a 'Pendiente' (Habilita cocina/bar)
    const handleAprobarPedido = async (mesaNumero: number, items: any[]) => {
        try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const ids = items.map(i => i.id);

        const { error } = await supabase
            .from('pedidos')
            .update({ estado: 'Pendiente' })
            .in('id', ids);

        if (error) throw error;

        await SoundService.reproducir('exito');
        showToast("success", "Pedido Confirmado", `Mesa Nº ${mesaNumero} enviada a preparación.`);
        fetchPedidosAConfirmar();
        } catch (error: any) {
        Alert.alert("Error", error.message);
        }
    };

    // Pasa a 'Rechazado Mozo' (Habilita edición al cliente)
    const handleRechazarPedido = async (mesaNumero: number, items: any[]) => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const ids = items.map(i => i.id);
    
            const { error } = await supabase
                .from('pedidos')
                .update({ estado: 'Rechazado Mozo' })
                .in('id', ids);
    
            if (error) throw error;
    
            await SoundService.reproducir('error');
            showToast("error", "Pedido Rechazado", `Se notificó a la Mesa Nº ${mesaNumero}.`);
            
            fetchPedidosAConfirmar();
            
            router.push({
                pathname: "/(homes)/mozo/chatMozo" as any, 
                params: { numeroMesa: mesaNumero }
            });
    
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    if (loading && pedidosAConfirmar.length === 0) {
        return (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#F5C065" />
        </View>
        );
    }

    return (
        <FlatList
        data={pedidosAConfirmar}
        keyExtractor={(item) => item.mesa.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View className="bg-secondary p-8 rounded-3xl items-center mt-6">
            <Ionicons name="notifications-off-outline" size={42} color="#31603D" />
            <Text className="text-primary font-black text-center mt-3 uppercase text-xs tracking-wider">
                No hay pedidos pendientes de confirmación
            </Text>
            </View>
        }
        renderItem={({ item }) => {
            const hora = item.fecha 
            ? new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : '--:--';

            return (
            <View style={{ elevation: 3 }} className="bg-secondary rounded-[32px] p-6 mb-6 border border-tertiary/10 shadow-sm">
                
                <View className="flex-row justify-between items-center border-b border-primary/10 pb-3 mb-3">
                <Text className="text-primary font-black text-base uppercase">Mesa N° {item.mesa}</Text>
                <Text className="text-tertiary font-bold text-[10px] uppercase">Recibido: {hora}</Text>
                </View>

                <View className="mb-4">
                {item.items.map((prod: any) => (
                    <View key={prod.id} className="flex-row justify-between py-1.5 border-b border-primary/5">
                    <Text className="text-primary font-medium text-xs uppercase max-w-[80%]">{prod.producto_nombre}</Text>
                    <Text className="text-primary font-black text-xs">x{prod.cantidad}</Text>
                    </View>
                ))}
                </View>

                <View className="flex-row justify-between space-x-3 gap-2">
                <TouchableOpacity
                    onPress={() => handleRechazarPedido(item.mesa, item.items)}
                    className="flex-1 bg-red-500 rounded-full py-3 items-center justify-center border-b-4 border-red-700 active:mt-1 active:border-b-0"
                >
                    <Text className="text-white font-black text-[11px] uppercase tracking-wider">Rechazar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleAprobarPedido(item.mesa, item.items)}
                    className="flex-1 bg-tertiary rounded-full py-3 items-center justify-center border-b-4 border-orange active:mt-1 active:border-b-0"
                >
                    <Text className="text-primary font-black text-[11px] uppercase tracking-wider">Confirmar</Text>
                </TouchableOpacity>
                </View>

            </View>
            );
        }}
        />
    );
}