import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEADER_HEIGHT = 80;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - 120; // safe space calculation to avoid overflow/scroll

interface SesionActiva {
    sesion_id: string;
    mesa_id: string;
    numero_mesa: number;
    ultimo_mensaje: string;
    ultima_actividad: string;
    no_leidos: number;
}

export default function ConsultasClientesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [sesiones, setSesiones] = useState<SesionActiva[]>([]);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const cargarSesionesActivas = async () => {
        try {
            setLoading(true);

            // Buscamos directamente en la tabla de chats (consultas)
            // Traemos todos los mensajes ordenados del más nuevo al más viejo, e incluimos el número de mesa
            const { data: mensajesData, error: msgError } = await supabase
                .from('consultas')
                .select('sesion_id, mesa_id, mensaje, created_at, mesas(numero)')
                .order('created_at', { ascending: false });

            if (msgError) throw msgError;

            if (!mensajesData || mensajesData.length === 0) {
                setSesiones([]);
                return;
            }

            // AGRUPACION: ultimo mensaje por mesa + no leidos
            const mesasVistas = new Set();
            const sesionesAgrupadas: SesionActiva[] = [];
            for (const msg of mensajesData) {
                if (!mesasVistas.has(msg.mesa_id)) {
                    mesasVistas.add(msg.mesa_id);
                    const { count } = await supabase
                        .from('consultas')
                        .select('id', { count: 'exact', head: true })
                        .eq('sesion_id', msg.sesion_id || msg.mesa_id)
                        .eq('leido', false);
                    sesionesAgrupadas.push({
                        sesion_id: msg.sesion_id || msg.mesa_id,
                        mesa_id: msg.mesa_id,
                        numero_mesa: Array.isArray(msg.mesas) ? (msg.mesas[0]?.numero || 0) : ((msg.mesas as any)?.numero || 0),
                        ultimo_mensaje: msg.mensaje || '',
                        ultima_actividad: msg.created_at || '',
                        no_leidos: count ?? 0,
                    });
                }
            }
            setSesiones(sesionesAgrupadas);
        } catch (error) {
            console.error("Error al cargar sesiones activas:", error);
        } finally {
            setLoading(false);
        }
    };

    const marcarLeido = async (sesionId: string) => {
        await supabase
            .from('consultas')
            .update({ leido: true })
            .eq('sesion_id', sesionId)
            .eq('leido', false);
    };

    useEffect(() => {
        cargarSesionesActivas();

        const channelName = `realtime_consultas_${Date.now()}`;
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'consultas' }, () => {
                cargarSesionesActivas();
            })
            .subscribe();
        channelRef.current = channel;

        return () => { supabase.removeChannel(channel); };
    }, []);

    const formatearTimestamp = (ts: string) => {
        if (!ts) return '';
        const d = new Date(ts);
        const ahora = new Date();
        const diffMs = ahora.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Ahora';
        if (diffMin < 60) return `hace ${diffMin} min`;
        const diffHoras = Math.floor(diffMin / 60);
        if (diffHoras < 24) return `hace ${diffHoras}h`;
        return d.toLocaleDateString();
    };

    const navegarAChat = async (item: SesionActiva) => {
        await marcarLeido(item.sesion_id);
        router.push({
            pathname: "/(homes)/mozo/chatMozo",
            params: { mesaId: item.mesa_id, numeroMesa: item.numero_mesa, sesion_id: item.sesion_id }
        });
    };

    const handleRefreshVisual = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        cargarSesionesActivas();
    };

    const chunkArray = (arr: any[], size: number) => {
        const chunked = [];
        for (let i = 0; i < arr.length; i += size) {
            chunked.push(arr.slice(i, i + size));
        }
        return chunked;
    };

    const renderPaginaSesiones = ({ item: grupoSesiones }: { item: SesionActiva[] }) => {
        return (
            <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT, paddingHorizontal: 24, justifyContent: 'center' }}>
                {grupoSesiones.map((item) => {
                    const CARD_WIDTH = SCREEN_WIDTH - 48;
                    const CARD_HEIGHT = (AVAILABLE_HEIGHT - 32) / 2;

                    return (
                        <TouchableOpacity
                            key={item.sesion_id}
                            onPress={() => navegarAChat(item)}
                            activeOpacity={0.7}
                            style={{ width: CARD_WIDTH, height: CARD_HEIGHT, marginBottom: 16 }}
                            className="bg-primary rounded-[28px] border border-tertiary/30 p-5 justify-between shadow-lg"
                        >
                            {/* Header de la tarjeta */}
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <View className="bg-tertiary/20 w-12 h-12 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="chatbubble-ellipses" size={24} color="#F5C065" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-black text-lg uppercase tracking-tight">Mesa N° {item.numero_mesa}</Text>
                                        {item.no_leidos > 0 ? (
                                            <View className="bg-red-500 rounded-full px-2 py-0.5 mt-0.5 align-start self-start flex-row items-center">
                                                <View className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
                                                <Text className="text-white font-black text-[9px] uppercase">{item.no_leidos} sin leer</Text>
                                            </View>
                                        ) : (
                                            <Text className="text-tertiary/60 text-[10px] uppercase font-bold tracking-widest mt-0.5">Leído</Text>
                                        )}
                                    </View>
                                </View>
                                {item.ultima_actividad && (
                                    <View className="bg-secondary/15 px-3 py-1 rounded-full border border-tertiary/20">
                                        <Text className="text-tertiary font-bold text-[9px] uppercase tracking-wider">{formatearTimestamp(item.ultima_actividad)}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Mensaje */}
                            <View className="bg-black/25 p-4 rounded-[20px] flex-1 my-3 justify-center">
                                {item.ultimo_mensaje ? (
                                    <Text className="text-white/90 text-sm italic font-medium leading-5" numberOfLines={2}>
                                        "{item.ultimo_mensaje}"
                                    </Text>
                                ) : (
                                    <Text className="text-white/30 text-sm italic font-light">Sin mensajes en esta consulta</Text>
                                )}
                            </View>

                            {/* Botón de acción */}
                            <View className="flex-row justify-between items-center">
                                <Text className="text-tertiary font-bold text-xs uppercase tracking-widest">Responder consulta</Text>
                                <View className="bg-tertiary p-2 rounded-full">
                                    <Ionicons name="chevron-forward" size={16} color="#31603D" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {/* Relleno si hay un solo item para evitar saltos en la altura disponible */}
                {grupoSesiones.length === 1 && (
                    <View style={{ width: SCREEN_WIDTH - 48, height: (AVAILABLE_HEIGHT - 32) / 2, marginBottom: 16 }} />
                )}
            </View>
        );
    };

    const paginas = chunkArray(sesiones, 2);

    return (
        <SafeAreaView className="flex-1 bg-primary">
            {/* ENCABEZADO PREMIUM INTEGRADO */}
            <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center justify-between shadow-2xl">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1 active:opacity-75">
                        <Ionicons name="arrow-back" size={30} color="#31603D" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-primary font-black text-2xl uppercase tracking-tighter leading-none">Consultas</Text>
                        <Text className="text-primary/70 font-bold text-[9px] uppercase tracking-widest mt-1">Sesiones activas en salón</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleRefreshVisual}
                    className="bg-primary/10 p-2.5 rounded-full border border-primary/10 active:opacity-75"
                >
                    <Ionicons name="refresh" size={20} color="#31603D" />
                </TouchableOpacity>
            </View>

            {loading && sesiones.length === 0 ? (
                <View className="flex-1 justify-center items-center bg-secondary">
                    <ActivityIndicator size="large" color="#F5C065" />
                </View>
            ) : (
                <View className="flex-1 bg-secondary rounded-t-[32px] border-t border-tertiary/20 pt-6">
                    {sesiones.length === 0 ? (
                        <View style={{ height: AVAILABLE_HEIGHT }} className="justify-center items-center px-6">
                            <View className="bg-secondary p-8 rounded-full mb-4 border border-tertiary/20">
                                <Ionicons name="chatbubbles-outline" size={48} color="#31603D" style={{ opacity: 0.3 }} />
                            </View>
                            <Text className="text-primary/60 font-bold text-xs uppercase tracking-widest text-center">Sin consultas activas</Text>
                        </View>
                    ) : (
                        <>
                            <FlatList
                                data={paginas}
                                keyExtractor={(item, index) => index.toString()}
                                horizontal={true}
                                pagingEnabled={true}
                                showsHorizontalScrollIndicator={false}
                                renderItem={renderPaginaSesiones}
                                decelerationRate="fast"
                            />
                            {paginas.length > 1 && (
                                <View className="flex-row justify-center items-center pb-6">
                                    <Ionicons name="swap-horizontal" size={14} color="#31603D" style={{ marginRight: 6 }} />
                                    <Text className="text-primary/75 font-bold text-[10px] uppercase tracking-widest">
                                        Desliza para ver más ({paginas.length} páginas)
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

