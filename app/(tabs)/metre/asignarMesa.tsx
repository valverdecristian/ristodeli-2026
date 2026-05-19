import LoadingModal from '@/src/components/LoadingModal';
import { supabase } from '@/src/services/SupabaseClient'; // necesario para Realtime
import { ListaEsperaService } from '@/src/services/listaEsperaService';
import { MesaService } from '@/src/services/mesaService';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';

export default function AsignarMesaScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [esperaList, setEsperaList] = useState<any[]>([]);
    const [mesasLibres, setMesasLibres] = useState<any[]>([]);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);

    useEffect(() => {
        fetchListaEspera();

        // Suscripción en tiempo real a tus tablas exactas
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
        
        setModalVisible(false);
        setClienteSeleccionado(null);
        fetchListaEspera();

        } catch (error: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error de asignación", error.message);
        }
    };

    return (
        <View className="flex-1 bg-primary px-6 pt-12">
        <TouchableOpacity 
            onPress={() => router.back()} 
            className="flex-row items-center mb-6 bg-secondary py-2 px-4 rounded-full self-start border border-tertiary/10"
        >
            <Ionicons name="arrow-back" size={18} color="#31603D" style={{ marginRight: 6 }} />
            <Text className="text-primary font-bold text-xs uppercase">Volver al Menú</Text>
        </TouchableOpacity>

        <Text className="text-white text-2xl font-black uppercase tracking-wider mb-2">Asignación de Mesas</Text>
        <Text className="text-tertiary text-xs uppercase font-bold mb-6 tracking-widest">Panel de Control - Metre</Text>

        <LoadingModal visible={loading} message="Cargando lista de espera..." />

        {!loading && (
            <FlatList
            data={esperaList}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
                <View className="bg-secondary p-8 rounded-3xl items-center border border-tertiary/10 mt-6">
                <Ionicons name="people-outline" size={40} color="#31603D" />
                <Text className="text-primary font-bold text-center mt-3 uppercase text-xs">No hay nadie en lista de espera</Text>
                </View>
            }
            renderItem={({ item }) => (
                <View className="bg-secondary p-5 rounded-[25px] flex-row items-center justify-between mb-4 shadow-sm border border-tertiary/5">
                <View className="flex-1 pr-3">
                    <Text className="text-primary font-black text-base">{item.nombreCompleto}</Text>
                    <Text className="text-tertiary font-bold text-[10px] uppercase tracking-wider mt-1"> Tipo: {item.tipo}</Text>
                </View>
                
                <TouchableOpacity
                    onPress={() => { setClienteSeleccionado(item); setModalVisible(true); }}
                    className="bg-primary px-4 py-3 rounded-2xl flex-row items-center shadow-md"
                >
                    <Text className="text-white font-bold text-xs uppercase mr-2">Asignar</Text>
                    <Ionicons name="restaurant-outline" size={14} color="white" />
                </TouchableOpacity>
                </View>
            )}
            />
        )}

        {/* MODAL DE SELECCIÓN */}
        <Modal visible={modalVisible} transparent animationType="slide">
            <View className="flex-1 justify-end bg-black/60">
            <View className="bg-primary rounded-t-[35px] p-6 h-[70%] border-t-2 border-tertiary/20">
                <View className="flex-row justify-between items-center mb-6">
                <Text className="text-white font-black text-lg uppercase">Mesas Libres ({mesasLibres.length})</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close-circle" size={30} color="#F5C065" />
                </TouchableOpacity>
                </View>

                <FlatList
                data={mesasLibres}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                ListEmptyComponent={
                    <View className="bg-secondary p-8 rounded-3xl items-center w-full mt-4">
                    <Ionicons name="alert-circle-outline" size={36} color="#E76F51" />
                    <Text className="text-primary font-bold text-center mt-2 uppercase text-[11px]">No hay mesas Libres en el salón</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                    onPress={() => handleAsignarMesa(item)}
                    className="bg-secondary w-[48%] mb-4 p-5 rounded-2xl items-center border border-tertiary/10 shadow-sm"
                    >
                    <View className="bg-primary/10 p-3 rounded-full mb-2">
                        <Ionicons name={item.tipo?.toLowerCase() === 'vip' ? 'star' : 'restaurant'} size={24} color="#31603D" />
                    </View>
                    <Text className="text-primary font-black text-lg">MESA {item.numero}</Text>
                    <Text className="text-tertiary font-bold text-[10px] uppercase tracking-widest mt-0.5">Capacidad: {item.comensales}</Text>
                    </TouchableOpacity>
                )}
                />
            </View>
            </View>
        </Modal>
        </View>
    );
}