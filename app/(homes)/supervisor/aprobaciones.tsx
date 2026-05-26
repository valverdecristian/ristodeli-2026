import { useToast } from "@/src/context/ToastContext";
import { AuthService } from '@/src/services/authService';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router'; 
import React, { useCallback, useState } from 'react'; 
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import LoadingModal from '@/src/components/LoadingModal';
import { SafeAreaView } from 'react-native-safe-area-context';


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
            <FlatList
            data={clientes}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 10 }}
            renderItem={({ item }) => (
                <View className="bg-secondary rounded-[30px] p-6 flex-row items-center justify-between mb-5 border border-tertiary/20 shadow-xl">
                
                <Image 
                    source={{ uri: item.foto_url }} 
                    className="w-24 h-24 rounded-2xl border-2 border-tertiary"
                    resizeMode="cover"
                />

                <View className="flex-1 mx-5">
                    <Text className="text-primary font-black text-lg uppercase leading-tight" numberOfLines={1}>
                        {item.apellidos}
                    </Text>
                    <Text className="text-primary font-bold text-base uppercase mt-0.5" numberOfLines={1}>
                        {item.nombres}
                    </Text>
                    <Text className="text-dark text-xs font-bold mt-2" numberOfLines={1}>
                        {item.email}
                    </Text>
                </View>

                <View className="flex-col justify-between h-24">
                    <TouchableOpacity
                    onPress={() => procesarCliente(item, 'aprobar')} 
                    className="bg-tertiary p-3 rounded-xl border-b-2 border-orange items-center justify-center active:opacity-80 mb-2"
                    >
                    <Ionicons name="checkmark-outline" size={22} color="#31603D" />
                    </TouchableOpacity>

                    <TouchableOpacity
                    onPress={() => procesarCliente(item, 'rechazar')}
                    className="bg-red-500 p-3 rounded-xl border-b-2 border-red-700 items-center justify-center active:opacity-80"
                    >
                    <Ionicons name="close-outline" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>

                </View>
            )}
            />
        )}
        </SafeAreaView>
    );
}