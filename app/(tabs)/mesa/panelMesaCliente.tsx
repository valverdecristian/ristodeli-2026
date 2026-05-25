import LoadingModal from '@/src/components/LoadingModal';
import { useToast } from "@/src/context/ToastContext";
import { PedidoService } from '@/src/services/pedidoService';
import { supabase } from '@/src/services/SupabaseClient';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type EstadoPedidoCliente = 'inicial' | 'en_preparacion' | 'Rechazado Mozo' | 'pedido_listo' | 'pendiente_confirmacion' | 'comido' | 'pidiendo_cuenta';

export default function PanelMesaClienteScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { mesaId, clienteId, tipoCliente, numeroMesa, sesion_id } = useLocalSearchParams();

    const [estado, setEstado] = useState<EstadoPedidoCliente>('inicial');
    const [loading, setLoading] = useState(true);
    const [yaHizoEncuesta, setYaHizoEncuesta] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const verificarEncuesta = async () => {
                const keyEncuesta = sesion_id ? `encuesta_completada_${sesion_id}` : `encuesta_completada_mesa_${mesaId}`;
                const completada = await AsyncStorage.getItem(keyEncuesta);
                setYaHizoEncuesta(completada === 'true');
            };
            verificarEncuesta();
        }, [sesion_id, mesaId])
    );

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

        const channelMesa = supabase
            .channel(`cambios_mesa_${Date.now()}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'mesas' },
                (payload: { [key: string]: any }) => {
                    if (payload.new && payload.new.id === mesaId) {
                        console.log('[PANEL_MESA] Cambio detectado en mesa:', payload.new.estado);
                        if (payload.new.estado === 'Pidiendo Cuenta') {
                            setEstado('pidiendo_cuenta');
                        } else if (payload.new.estado === 'Libre') {
                            SoundService.reproducir('exito');
                            showToast('success', '¡Gracias por visitarnos!', 'Vuelve pronto.');
                            router.replace('/(tabs)/home' as any);
                        } else {
                            fetchEstadoActual();
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(channelMesa);
        };
    }, [mesaId, nroMesaInt]);

    const fetchEstadoActual = async () => {
        try {
            setLoading(true);

            if (mesaId) {
                const { data: mesaObj, error: mesaErr } = await supabase
                    .from('mesas')
                    .select('estado')
                    .eq('id', mesaId)
                    .maybeSingle();

                if (!mesaErr && mesaObj) {
                    if (mesaObj.estado === 'Pidiendo Cuenta') {
                        setEstado('pidiendo_cuenta');
                        return;
                    } else if (mesaObj.estado === 'Libre') {
                        router.replace('/(tabs)/home' as any);
                        return;
                    }
                }
            }

            const { data, error } = await supabase
                .from('pedidos')
                .select('estado')
                .eq('mesa_numero', nroMesaInt)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (data && data.estado) {
                console.log('[PANEL_MESA] Estado inicial de la mesa cargado:', data.estado);
                adaptarEstadoFlujo(data.estado);
            } else {
                setEstado('inicial');
            }
        } catch (err) {
            console.log("[PANEL_MESA] Error al cargar estado:", err);
            setEstado('inicial');
        } finally {
            setLoading(false);
        }
    };

    const adaptarEstadoFlujo = (estadoDB: string) => {
        const e = estadoDB.toLowerCase();

        if (e.includes('rechazado') || e.includes('cancelado')) {
            setEstado('Rechazado Mozo');
        } else if (e === 'pendiente' || e.includes('preparando') || e.includes('preparacion') || e.includes('preparación')) {
            setEstado('en_preparacion');
        } else if (e.includes('listo')) {
            setEstado('pedido_listo');
        } else if (e === 'entregado') {
            setEstado('pendiente_confirmacion');
        } else if (e === 'recibido') {
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
                                params: { mesaId: mesaId, numeroMesa: numeroMesa || mesaId, clienteId: clienteId }
                            })}
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

                {/* En preparacion (Mozo acepto y esta en cocina/bar) */}
                {estado === 'en_preparacion' && (
                    <View className="space-y-4">
                        <TouchableOpacity
                            onPress={() => router.push({
                                pathname: "/(tabs)/mesa/estadoPedido" as any,
                                params: { mesaId, numeroMesa, sesion_id }
                            })}
                            className="w-full bg-secondary py-5 rounded-[25px] items-center border border-tertiary/20 mb-4"
                        >
                            <Text className="text-primary font-bold uppercase">Ver Estado del Pedido</Text>
                        </TouchableOpacity>

                        {/* Juegos bloqueados si es anonimo */}
                        <TouchableOpacity
                            disabled={tipoCliente === 'anonimo'}
                            onPress={() => router.push({
                                pathname: "/(juegos)/" as any,
                                params: { mesaId, sesion_id }
                            })}
                            className={`w-full py-5 rounded-[25px] items-center border ${tipoCliente === 'anonimo' ? 'bg-gray-400 border-gray-500' : 'bg-tertiary border-orange'}`}
                        >
                            <Text className={`font-bold uppercase ${tipoCliente === 'anonimo' ? 'text-gray-600' : 'text-primary'}`}>
                                {tipoCliente === 'anonimo' ? 'Juegos (Solo Registrados)' : 'Sección de Juegos'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* El pedido esta listo, el mozo lo esta llevando */}
                {estado === 'pedido_listo' && (
                    <View className="bg-secondary p-8 rounded-3xl border border-tertiary/20 items-center justify-center space-y-4 shadow-sm mb-6">
                        <View className="bg-primary/10 p-4 rounded-full mb-2">
                            <Ionicons name="walk-outline" size={48} color="#31603D" />
                        </View>
                        <Text className="text-primary font-black uppercase text-center text-lg tracking-wider">Pedido en Camino</Text>
                        <Text className="text-primary/70 text-center text-sm font-semibold leading-5 px-2">
                            Tu pedido está listo y el mozo lo está llevando a tu mesa. Confirma la recepción cuando lo tengas.
                        </Text>
                    </View>
                )}

                {/* El mozo entrego, el cliente debe confirmar recepcion */}
                {estado === 'pendiente_confirmacion' && (
                    <TouchableOpacity
                        onPress={async () => {
                            try {
                                await PedidoService.confirmarRecepcionCliente(nroMesaInt);
                                await SoundService.reproducir('exito');
                                setEstado('comido');
                                showToast("success", "¡Buen provecho!", "Confirmaste la recepción. Disfruta tu comida.");
                            } catch (err) {
                                showToast("error", "Error", "No se pudo confirmar la recepción.");
                            }
                        }}
                        className="w-full bg-tertiary py-6 rounded-[25px] items-center border-b-4 border-orange"
                    >
                        <Text className="text-primary font-black uppercase">Confirmar Recepción del Pedido</Text>
                    </TouchableOpacity>
                )}

                {/* Ya comieron y confirmaron recepcion */}
                {estado === 'comido' && (
                    <View className="space-y-4">
                        {!yaHizoEncuesta && (
                            <TouchableOpacity
                                onPress={async () => {
                                    await SoundService.reproducir('exito');
                                    router.push({
                                        pathname: "/(tabs)/mesa/formularioEncuesta" as any,
                                        params: { mesaId, numeroMesa, clienteId, sesion_id }
                                    });
                                }}
                                className="w-full bg-secondary py-5 rounded-[25px] items-center border border-tertiary/20 mb-4"
                            >
                                <Text className="text-primary font-bold uppercase">Encuesta de Satisfacción</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={() => router.push({
                                pathname: "/(tabs)/mesa/pedirCuenta" as any,
                                params: { mesaId, numeroMesa, clienteId, sesion_id }
                            })}
                            className="w-full bg-tertiary py-5 rounded-[25px] items-center border-b-4 border-orange"
                        >
                            <Text className="text-primary font-bold uppercase">Pedir la Cuenta</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Solicita la cuenta y esta esperando cobro del mozo */}
                {estado === 'pidiendo_cuenta' && (
                    <View className="bg-secondary p-8 rounded-3xl border border-tertiary/20 items-center justify-center space-y-4 shadow-sm mb-6">
                        <View className="bg-primary/10 p-4 rounded-full mb-2">
                            <Ionicons name="receipt-outline" size={48} color="#31603D" />
                        </View>
                        <Text className="text-primary font-black uppercase text-center text-lg tracking-wider">Cuenta Solicitada</Text>
                        <Text className="text-primary/70 text-center text-sm font-semibold leading-5 px-2">
                            Hemos recibido tu solicitud de cuenta. Por favor, aguarda en tu mesa a que el Mozo se acerque para procesar el cobro.
                        </Text>
                        <View className="h-[1px] bg-primary/10 w-full my-2" />
                        <Text className="text-tertiary text-xs uppercase font-bold tracking-widest text-center">
                            ¡Muchas gracias por tu visita!
                        </Text>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}