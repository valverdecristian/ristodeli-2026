// app/(tabs)/mesa/chatMozo.tsx
import { useToast } from "@/src/context/ToastContext";
import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    
    // Recibimos los UUIDs reales desde los parámetros de navegación
    const { mesaId, numeroMesa, clienteId, tipoCliente } = useLocalSearchParams<{ 
        mesaId: string; 
        numeroMesa: string;
        clienteId?: string; // UUID de la tabla anonimos o usuarios
        tipoCliente?: 'anonimo' | 'registrado'
    }>();

    const [mensajes, setMensajes] = useState<Consulta[]>([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!mesaId) return;

        fetchMensajes();

        // ⚡ TIEMPO REAL: Escuchamos inserts en tu tabla consultas para esta mesa
        const channel = supabase
            .channel(`chat_mesa_${mesaId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'consultas', filter: `mesa_id=eq.${mesaId}` },
                (payload) => {
                    const msg = payload.new as Consulta;
                    setMensajes((prev) => [...prev, msg]);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [mesaId]);

    const fetchMensajes = async () => {
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
        if (!nuevoMensaje.trim() || !mesaId) return;

        try {
            const textoAEnviar = nuevoMensaje.trim();
            setNuevoMensaje('');

            // Armamos el registro dinámico respetando tus claves foráneas
            const registroInsert: any = {
                mesa_id: mesaId,
                mensaje: textoAEnviar,
                id_anonimo: tipoCliente === 'anonimo' ? clienteId : null,
                id_registrado: tipoCliente === 'registrado' ? clienteId : null
            };

            const { error } = await supabase.from('consultas').insert(registroInsert);
            if (error) throw error;
        } catch (error: any) {
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
                <FlatList
                    ref={flatListRef}
                    data={mensajes}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    renderItem={({ item }) => {
                        // Es cliente si alguno de los campos de ID tiene datos
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