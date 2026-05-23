import LoadingModal from '@/src/components/LoadingModal';
import { useToast } from "@/src/context/ToastContext";
import { supabase } from '@/src/services/SupabaseClient';
import { SoundService } from '@/src/services/soundService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type EstadoPedidoCliente = 'inicial' | 'en_preparacion' | 'Rechazado Mozo' | 'pedido_listo' | 'comido';

export default function PanelMesaClienteScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { mesaId, clienteId, tipoCliente, numeroMesa, sesion_id } = useLocalSearchParams();

    const [estado, setEstado] = useState<EstadoPedidoCliente>('inicial');
    const [loading, setLoading] = useState(true);
    const [yaHizoEncuesta, setYaHizoEncuesta] = useState(false);

    // Unificamos el número de mesa asegurándonos de que sea un número válido
    const nroMesaInt = (numeroMesa && !isNaN(parseInt(numeroMesa as string, 10))) 
        ? parseInt(numeroMesa as string, 10) 
        : parseInt(mesaId as string, 10) || 21;

    useEffect(() => {
        fetchEstadoActual();
    
        const nombreCanal = `cambios_estadia_${Date.now()}`;
        const channel = supabase
            .channel(nombreCanal)
            .on(
                'postgres_changes', 
                { event: '*', schema: 'public', table: 'pedidos' }, 
                (payload: { [key: string]: any }) => { 
                    // Filtramos internamente para evitar el bug de Replica Identity
                    const mesaPayload = payload.new?.mesa_numero;
                    if (mesaPayload && parseInt(mesaPayload, 10) === nroMesaInt) {
                        if (payload.new?.estado) {
                            console.log('[PANEL_MESA] Cambio detectado por el Mozo/Cocina:', payload.new.estado);
                            adaptarEstadoFlujo(payload.new.estado);
                        }
                    }
                }
            )
            .subscribe();
    
        return () => { 
            supabase.removeChannel(channel); 
        };
    }, [mesaId, nroMesaInt]);

    // 🌟 1. BUSCAMOS LA VERDAD EN LA BASE DE DATOS
    const fetchEstadoActual = async () => { 
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pedidos')
                .select('estado')
                .eq('mesa_numero', nroMesaInt)
                .order('created_at', { ascending: false }) // Traemos el pedido más reciente de esta mesa
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (data && data.estado) {
                console.log('[PANEL_MESA] Estado inicial de la mesa cargado:', data.estado);
                adaptarEstadoFlujo(data.estado);
            } else {
                setEstado('inicial'); // Si no hay pedidos, es una mesa virgen
            }
        } catch (err) {
            console.log("[PANEL_MESA] Error al cargar estado:", err);
            setEstado('inicial');
        } finally {
            setLoading(false);
        }
    };

    // 🌟 2. MAPEO AUTOMÁTICO DE ESTADOS
    const adaptarEstadoFlujo = (estadoDB: string) => { 
        const e = estadoDB.toLowerCase();

        if (e.includes('rechazado') || e.includes('cancelado')) {
            setEstado('Rechazado Mozo');
        } else if (e === 'pendiente' || e.includes('preparando')) {
            setEstado('en_preparacion');
        } else if (e.includes('listo')) {
            setEstado('pedido_listo');
        } else if (e === 'entregado') {
            // 🌟 CAMBIO: Si el mozo marcó 'entregado', forzamos a 'comido' 
            // para que aparezcan los botones de cuenta y encuesta automáticamente
            setEstado('comido'); 
        } else if (e === 'comido' || e === 'pagado') {
            setEstado('comido');
        } else {
            setEstado('inicial'); 
        }
    };

    if (loading) {
        return <LoadingModal visible={true} message="Cargando tu mesa..." />;
    }

    return (
        // 🌟 1. El SafeAreaView abraza toda la pantalla y maneja el color de fondo
        <SafeAreaView className="flex-1 bg-primary">
        <ScrollView className="flex-1 bg-primary px-6 pt-6">
        <View className="bg-secondary p-4 rounded-3xl mb-6 items-center">
            <Text className="text-primary font-black uppercase">Mesa Nº {numeroMesa || mesaId}</Text>
        </View>

        {/* ────────── RENDEREADO CONDICIONAL DE BOTONES ────────── */}
        
        {/* Inicial o Pedido Rechazado por el Mozo */}
        {(estado === 'inicial' || estado === 'Rechazado Mozo') && (
            <View className="space-y-4">
            {estado === 'Rechazado Mozo' && (
                <Text className="text-red-500 font-bold text-center uppercase mb-2">
                ⚠️ El pedido fue rechazado. Por favor modifícalo.
                </Text>
            )}
            <TouchableOpacity 
                onPress={() => router.push({ 
                    pathname: "/(tabs)/mesa/menuProductos" as any, 
                    params: { mesaId: mesaId, numeroMesa: numeroMesa || mesaId, clienteId: clienteId }})}
                className="w-full bg-secondary py-5 rounded-[25px] items-center border border-tertiary/20 mb-4"
            >
                <Text className="text-primary font-bold uppercase">Realizar / Modificar Pedido</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => router.push({ 
                    pathname: "/(tabs)/mesa/chatMozo" as any,
                    params: { mesaId, numeroMesa, id_usuario: clienteId, clienteId, sesion_id, tipoCliente }
                })}
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
                onPress={() => router.push("/(tabs)/mesa/estadoPedido" as any)}
                className="w-full bg-secondary py-5 rounded-[25px] items-center border border-tertiary/20 mb-4"
            >
                <Text className="text-primary font-bold uppercase">Ver Estado del Pedido</Text>
            </TouchableOpacity>

            {/* Juegos bloqueados si es anónimo */}
            <TouchableOpacity 
                disabled={tipoCliente === 'anonimo'}
                onPress={() => router.push("/(juegos)/" as any)}
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
                onPress={() => router.push("/(tabs)/mesa/formularioEncuesta" as any)}
                className="w-full bg-secondary py-5 rounded-[25px] items-center border border-tertiary/20 mb-4"
                >
                <Text className="text-primary font-bold uppercase">Encuesta de Satisfacción</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity 
                onPress={() => router.push({ pathname: "/(tabs)/mesa/pedirCuenta" as any, params: { mesaId } })}
                className="w-full bg-tertiary py-5 rounded-[25px] items-center border-b-4 border-orange"
            >
                <Text className="text-primary font-bold uppercase">Pedir la Cuenta</Text>
            </TouchableOpacity>
            </View>
        )}

        </ScrollView>
        </SafeAreaView>
    );
}