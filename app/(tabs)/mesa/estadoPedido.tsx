import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PedidoItem {
    id: number;
    producto_nombre: string;
    cantidad: number;
    estado: string;
    categoria: string;
    created_at: string;
}

export default function EstadoPedidoScreen() {
    const router = useRouter();
    const { mesaId, numeroMesa, sesion_id } = useLocalSearchParams<{ mesaId?: string; numeroMesa?: string; sesion_id?: string }>();

    const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [descuentoInfo, setDescuentoInfo] = useState<{ descuento: number; juego: string } | null>(null);

    // Unificamos el número de mesa para asegurar la consulta
    const nroMesaInt = (numeroMesa && !isNaN(parseInt(numeroMesa as string, 10)))
        ? parseInt(numeroMesa as string, 10)
        : parseInt(mesaId as string, 10) || 21;

    useEffect(() => {
        fetchPedidosEnCurso();
        cargarDescuentoDeJuego();

        // 🌟 CANAL DINÁMICO: Inmune a errores de caché
        const nombreCanal = `monitoreo_cocina_mesa_${nroMesaInt}_${Date.now()}`;
        const channel = supabase
            .channel(nombreCanal)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'pedidos' },
                (payload: any) => {
                    const mesaPayload = payload.new?.mesa_numero;
                    // Si el cambio es de nuestra mesa, recargamos la lista silenciosamente
                    if (mesaPayload && parseInt(mesaPayload, 10) === nroMesaInt) {
                        fetchPedidosEnCurso();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [nroMesaInt]);

    const fetchPedidosEnCurso = async () => {
        try {
            // Quitamos el .in() restrictivo y traemos todo para filtrar manualmente con .toLowerCase()
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .eq('mesa_numero', nroMesaInt)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Filtramos en memoria para asegurar que capturamos todas las variantes
            const filtrados = (data || []).filter(p =>
                ['pendiente', 'en preparación', 'en preparacion', 'listo cocina', 'listo bar', 'entregado'].includes(p.estado.toLowerCase())
            );

            setPedidos(filtrados);
        } catch (error) {
            console.error("[ESTADO_PEDIDO] Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const cargarDescuentoDeJuego = async () => {
        if (!sesion_id) return;
        try {
            const key = `ristodeli_juegos_sesion_${sesion_id}`;
            const json = await AsyncStorage.getItem(key);
            if (json) {
                const state = JSON.parse(json);
                if (state.descuentoGanado > 0 && state.juegoGanador) {
                    const nombresJuegos: { [key: string]: string } = {
                        tateti: "Tateti",
                        adivinanza: "Adivinanza",
                        memoria: "Memoria"
                    };
                    const nombreBonito = nombresJuegos[state.juegoGanador] || state.juegoGanador;
                    setDescuentoInfo({
                        descuento: state.descuentoGanado,
                        juego: nombreBonito
                    });
                }
            }
        } catch (err) {
            console.error("[ESTADO_PEDIDO] Error al cargar descuento:", err);
        }
    };

    // 🎨 DICCIONARIO VISUAL: Mapea el estado aburrido de la BD a un diseño atractivo
    const obtenerEstiloEstado = (estadoDB: string) => {
        const e = estadoDB.toLowerCase();

        if (e === 'pendiente' || e.includes('preparacion') || e.includes('preparación')) {
            return {
                bg: 'bg-orange-500/20',
                borde: 'border-orange-500/50',
                texto: 'text-orange-600',
                icono: 'flame',
                label: 'Preparando en Cocina/Bar'
            };
        }
        if (e.includes('listo')) {
            return {
                bg: 'bg-emerald-500/20',
                borde: 'border-emerald-500/50',
                texto: 'text-emerald-700',
                icono: 'checkmark-done-circle',
                label: '¡Listo! Yendo a tu mesa'
            };
        }
        if (e === 'entregado') {
            return {
                bg: 'bg-blue-500/20',
                borde: 'border-blue-500/50',
                texto: 'text-blue-700',
                icono: 'restaurant',
                label: 'Entregado en mesa'
            };
        }

        // Fallback genérico
        return {
            bg: 'bg-gray-500/20',
            borde: 'border-gray-500/50',
            texto: 'text-gray-600',
            icono: 'ellipsis-horizontal-circle',
            label: estadoDB
        };
    };

    return (
        <View className="flex-1 bg-primary px-6 pt-12">
            {/* ────────── ENCABEZADO ────────── */}
            <View className="flex-row items-center mb-6">
                <TouchableOpacity onPress={() => router.back()} className="bg-secondary p-2.5 rounded-full mr-4">
                    <Ionicons name="arrow-back" size={18} color="#31603D" />
                </TouchableOpacity>
                <View>
                    <Text className="text-white text-xl font-black uppercase tracking-wider">Estado del Pedido</Text>
                    <Text className="text-tertiary text-[10px] uppercase font-bold tracking-widest">Mesa N° {nroMesaInt}</Text>
                </View>
            </View>

            {/* ────────── CONTENIDO ────────── */}
            <View className="flex-1 bg-secondary rounded-t-[32px] pt-6 px-4 border-t border-tertiary/20">
                {descuentoInfo && (
                    <View className="bg-green-600/10 border border-green-600/30 rounded-2xl p-4 mb-4 flex-row items-center">
                        <View className="bg-green-600/20 p-2 rounded-full mr-3">
                            <Ionicons name="gift-outline" size={20} color="#16a34a" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-green-800 font-extrabold text-xs uppercase tracking-wide">
                                Descuento de Juegos Aplicado
                            </Text>
                            <Text className="text-green-700 text-xs font-semibold mt-0.5">
                                ¡Felicidades! Se aplicará un {descuentoInfo.descuento}% de descuento en tu cuenta por ganar en {descuentoInfo.juego}.
                            </Text>
                        </View>
                    </View>
                )}
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#31603D" />
                        <Text className="text-primary/60 font-bold mt-4 uppercase text-xs">Consultando cocina...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={pedidos}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        ListEmptyComponent={
                            <View className="flex-1 justify-center items-center pt-20">
                                <Ionicons name="fast-food-outline" size={60} color="#31603D" style={{ opacity: 0.2 }} />
                                <Text className="text-primary/40 font-black text-center mt-4 uppercase tracking-widest">
                                    No hay pedidos en curso
                                </Text>
                            </View>
                        }
                        renderItem={({ item }) => {
                            const estilo = obtenerEstiloEstado(item.estado);

                            return (
                                <View style={{ elevation: 2 }} className="bg-white rounded-3xl p-5 mb-4 border border-primary/10 shadow-sm">
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View className="flex-1 pr-4">
                                            <Text className="text-primary font-black text-base uppercase leading-5">
                                                {item.producto_nombre}
                                            </Text>
                                            <Text className="text-primary/50 font-bold text-[10px] uppercase mt-1">
                                                Categoría: {item.categoria}
                                            </Text>
                                        </View>
                                        <View className="bg-primary px-3 py-1.5 rounded-xl">
                                            <Text className="text-tertiary font-black text-sm">x{item.cantidad}</Text>
                                        </View>
                                    </View>

                                    {/* 🌟 CHIP DINÁMICO DE ESTADO */}
                                    <View className={`flex-row items-center self-start px-3 py-1.5 rounded-full border ${estilo.bg} ${estilo.borde}`}>
                                        <Ionicons name={estilo.icono as any} size={14} color={estilo.texto.replace('text-', '')} className="mr-1.5" />
                                        <Text className={`font-black text-[10px] uppercase ml-1 ${estilo.texto}`}>
                                            {estilo.label}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                    />
                )}
            </View>
        </View>
    );
}