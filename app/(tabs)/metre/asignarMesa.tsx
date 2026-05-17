import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SoundService } from '@/src/services/soundService';

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
        
        // 1. Buscamos registros 'pendiente' en tu tabla real lista_espera
        const { data: esperaData, error: errEspera } = await supabase
            .from('lista_espera')
            .select('id, cliente_id, nombre, tipo, estado')
            .eq('estado', 'pendiente');

        if (errEspera) throw errEspera;

        if (!esperaData || esperaData.length === 0) {
            setEsperaList([]);
        } else {
            // Separamos clientes registrados para buscar sus apellidos reales si hiciera falta
            const idsRegistrados = esperaData.filter(e => e.tipo === 'registrado').map(e => e.cliente_id);
            
            let usuariosData: any[] = [];
            if (idsRegistrados.length > 0) {
            const { data: users } = await supabase
                .from('usuarios')
                .select('id, nombres, apellidos')
                .in('id', idsRegistrados);
            usuariosData = users || [];
            }

            // Armamos la lista unificada combinando los strings de tu DB
            const listaFormateada = esperaData.map(item => {
            if (item.tipo === 'registrado') {
                const u = usuariosData.find(user => user.id === item.cliente_id);
                return {
                ...item,
                nombreCompleto: u ? `${u.nombres} ${u.apellidos}` : item.nombre,
                };
            }
            return {
                ...item,
                nombreCompleto: `${item.nombre} (Anónimo)`,
            };
            });

            setEsperaList(listaFormateada);
        }

        // 2. Traer mesas con tu estado exacto 'Libre'
        const { data: mesas, error: errMesas } = await supabase
            .from('mesas')
            .select('id, numero, comensales, tipo')
            .eq('estado', 'Libre')
            .order('numero', { ascending: true });

        if (errMesas) throw errMesas;
        setMesasLibres(mesas || []);

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
        
        // 1. Modificar la mesa elegida a 'Ocupada'
        const { error: errorMesa } = await supabase
            .from('mesas')
            .update({ estado: 'Ocupada' })
            .eq('id', mesa.id);

        if (errorMesa) throw errorMesa;

        // 2. Modificar la lista de espera: pasa a 'asignado' e inyectamos el UUID de la mesa en mesa_asignada
        const { error: errorLista } = await supabase
            .from('lista_espera')
            .update({ 
            estado: 'asignado',
            mesa_asignada: mesa.id // Guardamos la vinculación por UUID
            })
            .eq('id', clienteSeleccionado.id);

        if (errorLista) throw errorLista;

        SoundService.reproducir('exito');
        Alert.alert("Mesa Asignada", `La mesa número ${mesa.numero} fue otorgada con éxito.`);
        
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

        {loading ? (
            <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#F5C065" />
            </View>
        ) : (
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