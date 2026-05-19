// app/(tabs)/mesa/chatMozo.tsx
import { useToast } from "@/src/context/ToastContext";
import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Consulta {
    id: number;
    created_at: string;
    id_anonimo: string | null;
    id_registrado: string | null;
    mesa_id: string;
    mensaje: string;
}

export default function ChatMozoScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    
    // Recibimos los parámetros
    const params = useLocalSearchParams<{ 
        mesaId?: string; 
        numeroMesa?: string;
        clienteId?: string; 
        tipoCliente?: 'anonimo' | 'registrado'
    }>();

    // Estados locales dinámicos con respaldo por si la navegación vino vacía
    const [mesaId, setMesaId] = useState<string | null>(params.mesaId || null);
    const [numeroMesa, setNumeroMesa] = useState<string | null>(params.numeroMesa || null);
    const [clienteId, setClienteId] = useState<string | null>(params.clienteId || null);
    const [tipoCliente, setTipoCliente] = useState<'anonimo' | 'registrado'>(params.tipoCliente || 'anonimo');

    const [mensajes, setMensajes] = useState<Consulta[]>([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    // 🌟 EFECTO 1: Auto-recuperación de parámetros si se perdieron en el replace
    useEffect(() => {
        const recuperarDatosFaltantes = async () => {
            try {
                // Si ya tenemos mesaId por parámetro, lo asignamos de una
                if (params.mesaId) {
                    setMesaId(params.mesaId);
                    setNumeroMesa(params.numeroMesa || null);
                    setClienteId(params.clienteId || null);
                    setTipoCliente(params.tipoCliente || 'anonimo');
                    return;
                }

                console.log('[CHAT_MOZO] Parámetros ausentes. Activando auto-recuperación...');
                
                // 1. Recuperamos la sesión clásica por si es usuario registrado
                const { data: { session } } = await supabase.auth.getSession();
                let idUsuario = session?.user?.id || null;
                let tipo = session?.user?.id ? 'registrado' : 'anonimo';

                // 2. Si no hay sesión de Auth, buscamos el último anónimo en lista de espera
                if (!idUsuario) {
                    const { data: lista, error: errLista } = await supabase
                        .from('lista_espera')
                        .select('cliente_id, nombre')
                        .eq('estado', 'pendiente')
                        .eq('tipo', 'anonimo')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (!errLista && lista) {
                        idUsuario = lista.cliente_id;
                        tipo = 'anonimo';
                    }
                }

                // 3. Con el ID del usuario, deducimos qué mesa tiene asignada activamente
                if (idUsuario) {
                    setClienteId(idUsuario);
                    setTipoCliente(tipo as any);

                    const { data: asignacion } = await supabase
                        .from('lista_espera')
                        .select('mesa_asignada')
                        .eq('cliente_id', idUsuario)
                        .maybeSingle();

                    if (asignacion?.mesa_asignada) {
                        setMesaId(asignacion.mesa_asignada);
                        
                        // Buscamos el número estético de la mesa para la interfaz
                        const { data: mesa } = await supabase
                            .from('mesas')
                            .select('numero')
                            .eq('id', asignacion.mesa_asignada)
                            .maybeSingle();
                        
                        if (mesa) setNumeroMesa(mesa.numero.toString());
                    }
                }
            } catch (err) {
                console.error('[CHAT_MOZO] Fallo al autorecuperar contexto:', err);
            }
        };

        recuperarDatosFaltantes();
    }, [params]);

    // 🌟 EFECTO 2: Control del canal en tiempo real en base al estado seguro de mesaId
    useEffect(() => {
        if (!mesaId) return;

        fetchMensajes();

        console.log('[CHAT_MOZO] Escuchando mensajes en Realtime para mesa:', mesaId);
        const channel = supabase
            .channel(`chat_mesa_${mesaId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'consultas', filter: `mesa_id=eq.${mesaId}` },
                (payload) => {
                    const msg = payload.new as Consulta;
                    // Evitamos duplicar en interfaz si fuimos nosotros los que insertamos
                    setMensajes((prev) => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [mesaId]);

    const fetchMensajes = async () => {
        if (!mesaId) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('consultas')
                .select('*')
                .eq('mesa_id', mesaId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMensajes(data || []);
        } catch (error: any) {
            console.error("Error al cargar chat:", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEnviarMensaje = async () => {
        if (!nuevoMensaje.trim()) return;

        // Si la auto-recuperación falló por completo, avisamos al alumno antes de romper
        if (!mesaId) {
            showToast("error", "Error de Contexto", "No se detectó a qué mesa asociar este mensaje.");
            return;
        }

        try {
            const textoAEnviar = nuevoMensaje.trim();
            setNuevoMensaje('');

            const registroInsert: any = {
                mesa_id: mesaId,
                mensaje: textoAEnviar,
                id_anonimo: tipoCliente === 'anonimo' ? clienteId : null,
                id_registrado: tipoCliente === 'registrado' ? clienteId : null
            };

            console.log('[CHAT_MOZO] Insertando consulta:', registroInsert);
            const { error } = await supabase.from('consultas').insert(registroInsert);
            
            if (error) throw error;
            
            // Refresco local optimista inmediato para mejorar la respuesta visual
            fetchMensajes();
        } catch (error: any) {
            console.error('[CHAT_MOZO] Fallo al insertar mensaje:', error.message);
            showToast("error", "Error", "No se pudo enviar el mensaje.");
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-primary pt-12">
            <View className="flex-row items-center px-6 mb-4 justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity 
                        onPress={() => router.replace("/(tabs)/mesa/panelMesaCliente")} 
                        className="bg-secondary p-2.5 rounded-full mr-4"
                    >
                        <Ionicons name="arrow-back" size={18} color="#31603D" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white text-xl font-black uppercase tracking-wider">Consultar Mozo</Text>
                        <Text className="text-tertiary text-[10px] uppercase font-bold tracking-widest">Mesa N° {numeroMesa || '--'}</Text>
                    </View>
                </View>
            </View>

            <View className="flex-1 bg-secondary rounded-t-[32px] p-6 border-t border-tertiary/20">
                {loading && mensajes.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#31603D" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={mensajes}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        ListEmptyComponent={
                            <View className="flex-1 justify-center items-center pt-20">
                                <Ionicons name="chatbubbles-outline" size={48} color="#31603D" style={{ opacity: 0.3 }} />
                                <Text className="text-primary/40 font-semibold text-xs mt-2 uppercase">Sin mensajes previos</Text>
                            </View>
                        }
                        renderItem={({ item }) => {
                            const esCliente = item.id_anonimo !== null || item.id_registrado !== null;
                            return (
                                <View className={`flex-row ${esCliente ? 'justify-end' : 'justify-start'} mb-4`}>
                                    <View className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                                        esCliente ? 'bg-primary rounded-tr-none' : 'bg-tertiary/20 rounded-tl-none border border-tertiary/30'
                                    }`}>
                                        <Text className={`text-[10px] uppercase font-black mb-1 ${esCliente ? 'text-tertiary' : 'text-primary'}`}>
                                            {esCliente ? 'Tú' : 'Mozo'}
                                        </Text>
                                        <Text className={`text-sm font-medium ${esCliente ? 'text-white' : 'text-primary'}`}>
                                            {item.mensaje}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                    />
                )}

                <View className="flex-row items-center pt-3 border-t border-primary/5">
                    <TextInput
                        value={nuevoMensaje}
                        onChangeText={setNuevoMensaje}
                        placeholder="Escribe tu consulta aquí..."
                        placeholderTextColor="#a0aec0"
                        className="flex-1 bg-primary/5 text-primary rounded-full px-5 py-3 text-sm font-medium mr-3"
                    />
                    <TouchableOpacity onPress={handleEnviarMensaje} className="bg-tertiary w-12 h-12 rounded-full items-center justify-center border-b-2 border-orange">
                        <Ionicons name="send" size={16} color="#31603D" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}