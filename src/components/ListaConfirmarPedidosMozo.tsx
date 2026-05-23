import { useToast } from "@/src/context/ToastContext";
import { SoundService } from '@/src/services/soundService';
import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ListaConfirmarPedidosMozo() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [pedidosAConfirmar, setPedidosAConfirmar] = useState<any[]>([]);
    const router = useRouter();

    const [modalRechazoVisible, setModalRechazoVisible] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [mesaSeleccionada, setMesaSeleccionada] = useState<number | null>(null);
    const [pedidosSeleccionados, setPedidosSeleccionados] = useState<any[]>([]);

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

    const iniciarRechazo = (mesaNumero: number, items: any[]) => {
        setMesaSeleccionada(mesaNumero);
        setPedidosSeleccionados(items);
        setMotivoRechazo('');
        setModalRechazoVisible(true);
    };

    const confirmarRechazo = async () => {
        if (!motivoRechazo.trim()) {
            showToast("error", "Motivo requerido", "Debes escribir por qué rechazas el pedido.");
            return;
        }

        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const ids = pedidosSeleccionados.map(i => i.id);

            const estadoFinal = `Rechazado: ${motivoRechazo.trim()}`;

            const { error } = await supabase
                .from('pedidos')
                .update({ estado: estadoFinal })
                .in('id', ids);

            if (error) throw error;

            await SoundService.reproducir('error');
            showToast("error", "Pedido Rechazado", `Se notificó a la Mesa Nº ${mesaSeleccionada}.`);

            setModalRechazoVisible(false);
            fetchPedidosAConfirmar();


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
        <>
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
                                    onPress={() => iniciarRechazo(item.mesa, item.items)}
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

            <Modal visible={modalRechazoVisible} transparent animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/60 px-6">
                    <View className="bg-secondary p-6 rounded-[24px] w-full border border-tertiary/20">
                        <Text className="text-primary font-black uppercase mb-2">Motivo del rechazo</Text>
                        <Text className="text-primary/60 text-xs mb-4">El cliente verá este mensaje en su pantalla.</Text>

                        <TextInput
                            className="bg-primary/5 text-primary p-4 rounded-xl mb-4 text-sm font-medium"
                            placeholder="Ej: No queda stock de este plato..."
                            placeholderTextColor="#9ca3af"
                            value={motivoRechazo}
                            onChangeText={setMotivoRechazo}
                            multiline
                        />

                        <View className="flex-row justify-end gap-3">
                            <TouchableOpacity
                                className="px-4 py-3 rounded-lg bg-primary/10"
                                onPress={() => setModalRechazoVisible(false)}
                            >
                                <Text className="text-primary font-bold text-xs uppercase">Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="px-4 py-3 rounded-lg bg-red-600 border-b-2 border-red-800 active:mt-0.5 active:border-b-0"
                                onPress={confirmarRechazo}
                            >
                                <Text className="text-white font-black tracking-wider text-xs uppercase">Confirmar Rechazo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}