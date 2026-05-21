import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface SesionActiva {
    sesion_id: string;
    mesa_id: string;
    numero_mesa: number;
    ultimo_mensaje: string;
    ultima_actividad: string;
}

export default function ConsultasClientesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [sesiones, setSesiones] = useState<SesionActiva[]>([]);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const cargarSesionesActivas = async () => {
        try {
            setLoading(true);

            // 🌟 NUEVO ENFOQUE: Buscamos directamente en la tabla de chats (consultas)
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

            // 🌟 AGRUPACIÓN INTELIGENTE: Filtramos para mostrar solo el ÚLTIMO mensaje de cada mesa
            const mesasVistas = new Set();
            const sesionesAgrupadas: SesionActiva[] = [];

            mensajesData.forEach((msg: any) => {
                // Si todavía no agregamos esta mesa a la lista, la metemos (como están ordenados, este será el último mensaje)
                if (!mesasVistas.has(msg.mesa_id)) {
                    mesasVistas.add(msg.mesa_id);
                    sesionesAgrupadas.push({
                        sesion_id: msg.sesion_id || msg.mesa_id, // Usamos el ID de mesa como respaldo
                        mesa_id: msg.mesa_id,
                        numero_mesa: msg.mesas?.numero || 0,
                        ultimo_mensaje: msg.mensaje || '',
                        ultima_actividad: msg.created_at || '',
                    });
                }
            });

            setSesiones(sesionesAgrupadas);
        } catch (error) {
            console.error("Error al cargar sesiones activas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarSesionesActivas();

        const channelName = `realtime_consultas_${Date.now()}`;
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultas' }, () => {
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

    const cantidad = sesiones.length;

    const navegarAChat = (item: SesionActiva) => {
        router.push({
            pathname: "/(homes)/mozo/chatMozo",
            params: { mesaId: item.mesa_id, numeroMesa: item.numero_mesa, sesion_id: item.sesion_id }
        });
    };

    const renderContenido = () => {
        if (cantidad === 0) {
            return (
                <View className="flex-1 justify-center items-center">
                    <View className="bg-secondary/30 p-6 rounded-full mb-4">
                        <Ionicons name="chatbubbles-outline" size={48} color="#31603D" style={{ opacity: 0.3 }} />
                    </View>
                    <Text className="text-primary/40 font-bold text-sm uppercase">Sin consultas activas</Text>
                </View>
            );
        }

        if (cantidad <= 2) {
            return (
                <View className="px-2">
                    {sesiones.map((item) => (
                        <TouchableOpacity
                            key={item.sesion_id}
                            onPress={() => navegarAChat(item)}
                            className="bg-primary border border-tertiary/30 p-5 rounded-[24px] mb-4"
                        >
                            <View className="flex-row items-center mb-2">
                                <View className="bg-tertiary/20 p-3 rounded-full mr-3">
                                    <Ionicons name="chatbubble-ellipses" size={20} color="#F5C065" />
                                </View>
                                <Text className="text-white font-black text-base uppercase">Mesa N° {item.numero_mesa}</Text>
                            </View>
                            {item.ultimo_mensaje ? (
                                <Text className="text-white/60 text-xs ml-2" numberOfLines={2}>{item.ultimo_mensaje}</Text>
                            ) : (
                                <Text className="text-white/30 text-xs ml-2 italic">Sin mensajes aún</Text>
                            )}
                            {item.ultima_actividad && (
                                <Text className="text-tertiary/60 text-[9px] mt-1 ml-2 uppercase font-bold">{formatearTimestamp(item.ultima_actividad)}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }

        if (cantidad <= 6) {
            return (
                <View className="flex-row flex-wrap justify-between px-1">
                    {sesiones.map((item) => (
                        <TouchableOpacity
                            key={item.sesion_id}
                            onPress={() => navegarAChat(item)}
                            className="w-[48%] bg-primary border border-tertiary/30 p-4 rounded-[24px] mb-4 items-center"
                        >
                            <View className="bg-tertiary/20 p-3 rounded-full mb-2">
                                <Ionicons name="chatbubble-ellipses" size={22} color="#F5C065" />
                            </View>
                            <Text className="text-white font-black text-sm uppercase mb-1">Mesa N° {item.numero_mesa}</Text>
                            <View className="bg-tertiary px-2 py-0.5 rounded-full">
                                <Text className="text-primary font-bold text-[8px] uppercase">Activo</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }

        return (
            <View className="px-1">
                {sesiones.map((item) => (
                    <TouchableOpacity
                        key={item.sesion_id}
                        onPress={() => navegarAChat(item)}
                        className="flex-row items-center bg-primary border border-tertiary/20 p-4 rounded-[20px] mb-3"
                    >
                        <View className="w-10 h-10 bg-tertiary/20 rounded-full items-center justify-center mr-3">
                            <Text className="text-tertiary font-black text-sm">{item.numero_mesa}</Text>
                        </View>
                        <View className="flex-1">
                            {item.ultimo_mensaje ? (
                                <Text className="text-white font-medium text-xs" numberOfLines={1}>{item.ultimo_mensaje}</Text>
                            ) : (
                                <Text className="text-white/30 text-xs italic">Sin mensajes aún</Text>
                            )}
                        </View>
                        {item.ultima_actividad && (
                            <Text className="text-tertiary/60 text-[9px] uppercase font-bold ml-2">{formatearTimestamp(item.ultima_actividad)}</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-primary pt-12 px-6">
            <View className="flex-row items-center mb-6">
                <TouchableOpacity onPress={() => router.back()} className="bg-secondary p-2.5 rounded-full mr-4">
                    <Ionicons name="arrow-back" size={18} color="#31603D" />
                </TouchableOpacity>
                <View>
                    <Text className="text-white text-xl font-black uppercase tracking-wider">Consultas</Text>
                    <Text className="text-tertiary text-[10px] uppercase font-bold tracking-widest">Sesiones activas en salón</Text>
                </View>
            </View>

            <View className="flex-1 bg-secondary rounded-t-[32px] p-6 border-t border-tertiary/20">
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#F5C065" />
                    </View>
                ) : (
                    renderContenido()
                )}
            </View>
        </View>
    );
}
