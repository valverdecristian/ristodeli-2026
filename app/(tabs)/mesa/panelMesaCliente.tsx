import { useToast } from "@/src/context/ToastContext";
import { supabase } from '@/src/services/SupabaseClient';
import { SoundService } from '@/src/services/soundService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LoadingModal from '@/src/components/LoadingModal';

type EstadoEstadia = 'inicial' | 'en_preparacion' | 'pedido_rechazado' | 'pedido_listo' | 'comido';

export default function PanelMesaClienteScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { mesaId, clienteId, tipoCliente } = useLocalSearchParams();

    const [estado, setEstado] = useState<EstadoEstadia>('inicial');
    const [loading, setLoading] = useState(true);
    const [yaHizoEncuesta, setYaHizoEncuesta] = useState(false);

    useEffect(() => {
            fetchEstadoActual();
        
            const channel = supabase
            .channel('cambios_estadia')
            .on(
                'postgres_changes', 
                { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'pedidos', 
                filter: `mesa_id=eq.${mesaId}` 
                }, 
                (payload: { [key: string]: any }) => { 
                if (payload.new && payload.new.estado) {
                    adaptarEstadoFlujo(payload.new.estado);
                }
                }
            )
            .subscribe();
        
            return () => { 
            supabase.removeChannel(channel); 
            };
    }, [mesaId]);

    const fetchEstadoActual = async () => { setLoading(false); };
    const adaptarEstadoFlujo = (estadoDB: string) => { /* ... mapeo de lógica ... */ };

    if (loading) {
        return <LoadingModal visible={true} message="Cargando tu mesa..." />;
    }

    return (
        <ScrollView className="flex-1 bg-primary px-6 pt-6">
        <View className="bg-secondary p-4 rounded-3xl mb-6 items-center">
            <Text className="text-primary font-black uppercase">Mesa Nº {mesaId}</Text>
        </View>

        {/* ────────── RENDEREADO CONDICIONAL DE BOTONES ────────── */}
        
        {/* Inicial o Pedido Rechazado por el Mozo */}
        {(estado === 'inicial' || estado === 'pedido_rechazado') && (
            <View className="space-y-4">
            {estado === 'pedido_rechazado' && (
                <Text className="text-red-500 font-bold text-center uppercase mb-2">
                ⚠️ El pedido fue rechazado. Por favor modifícalo.
                </Text>
            )}
            <TouchableOpacity 
                onPress={() => router.push({ pathname: "/(tabs)/mesa/menuProductos", params: { mesaId } })}
                className="w-full bg-secondary py-5 rounded-[25px] items-center border border-tertiary/20 mb-4"
            >
                <Text className="text-primary font-bold uppercase">Realizar / Modificar Pedido</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => router.push("/(tabs)/mesa/chatMozo")}
                className="w-full bg-secondary py-5 rounded-[25px] items-center border border-tertiary/20"
            >
                <Text className="text-primary font-bold uppercase">Consultar al Mozo (Chat)</Text>
            </TouchableOpacity>
            </View>
        )}

        {/* En preparación (Mozo aceptó y está en cocina/bar) */}
        {estado === 'en_preparacion' && (
            <View className="space-y-4">
            <TouchableOpacity 
                onPress={() => router.push("/(tabs)/mesa/estadoPedido")}
                className="w-full bg-secondary py-5 rounded-[25px] items-center border border-tertiary/20 mb-4"
            >
                <Text className="text-primary font-bold uppercase">Ver Estado del Pedido</Text>
            </TouchableOpacity>

            {/* Juegos bloqueados si es anónimo */}
            <TouchableOpacity 
                disabled={tipoCliente === 'anonimo'}
                onPress={() => router.push("/(tabs)/mesa/juegos")}
                className={`w-full py-5 rounded-[25px] items-center border ${tipoCliente === 'anonimo' ? 'bg-gray-400 border-gray-500' : 'bg-tertiary border-orange'}`}
            >
                <Text className={`font-bold uppercase ${tipoCliente === 'anonimo' ? 'text-gray-600' : 'text-primary'}`}>
                {tipoCliente === 'anonimo' ? 'Juegos (Solo Registrados)' : 'Sección de Juegos'}
                </Text>
            </TouchableOpacity>
            </View>
        )}

        {/* El pedido llegó completo a la mesa (Cocinero/Cantinero terminaron) */}
        {estado === 'pedido_listo' && (
            <TouchableOpacity 
            onPress={async () => {
                await SoundService.reproducir('exito');
                setEstado('comido');
                showToast("success", "¡Buen provecho!", "Confirmaste la recepción. Disfruta tu comida.");
            }}
            className="w-full bg-tertiary py-6 rounded-[25px] items-center border-b-4 border-orange"
            >
            <Text className="text-primary font-black uppercase">Confirmar Recepción del Pedido</Text>
            </TouchableOpacity>
        )}

        {/* Fin de la estadía (Ya comieron y confirmaron recepcion) */}
        {estado === 'comido' && (
            <View className="space-y-4">
            {!yaHizoEncuesta && (
                <TouchableOpacity 
                onPress={() => router.push("/(tabs)/mesa/formularioEncuesta")}
                className="w-full bg-secondary py-5 rounded-[25px] items-center border border-tertiary/20 mb-4"
                >
                <Text className="text-primary font-bold uppercase">Encuesta de Satisfacción</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity 
                onPress={() => router.push({ pathname: "/(tabs)/mesa/pedirCuenta", params: { mesaId } })}
                className="w-full bg-tertiary py-5 rounded-[25px] items-center border-b-4 border-orange"
            >
                <Text className="text-primary font-bold uppercase">Pedir la Cuenta</Text>
            </TouchableOpacity>
            </View>
        )}

        </ScrollView>
    );
}