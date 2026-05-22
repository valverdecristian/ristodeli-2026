import { useToast } from "@/src/context/ToastContext";
import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
interface Consulta {
    id: number;
    created_at: string;
    id_usuario: string;
    mesa_id: string;
    mensaje: string;
    nombre_remitente: string;
}
export default function ChatMozoScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { mesaId, numeroMesa, id_usuario, clienteId, sesion_id, tipoCliente } = useLocalSearchParams<{
        mesaId: string;
        numeroMesa: string;
        id_usuario?: string;
        clienteId?: string;
        sesion_id?: string;
        tipoCliente?: 'anonimo' | 'registrado';
    }>();
    const [mensajes, setMensajes] = useState<Consulta[]>([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [loading, setLoading] = useState(true);
    const [miNombre, setMiNombre] = useState<string>('Cliente');
    const flatListRef = useRef<FlatList>(null);
    const miId = id_usuario || clienteId;
    const formatearHora = (ts: string) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };
    useEffect(() => {
        const idCanal = sesion_id || mesaId;
        if (!idCanal) return;
        (async () => {
            if (miId && miNombre === 'Cliente') {
                const { data: userData } = await supabase
                    .from('usuarios')
                    .select('nombres, apellidos')
                    .eq('id', miId)
                    .single();
                if (userData) {
                    const nombre = `${userData.nombres} ${userData.apellidos || ''}`.trim();
                    setMiNombre(nombre);
                }
            }
        })();
        fetchMensajes();
        const channel = supabase
            .channel(`chat_sesion_${idCanal}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'consultas',
                    filter: sesion_id ? `sesion_id=eq.${sesion_id}` : `mesa_id=eq.${mesaId}`
                },
                (payload) => {
                    const msg = payload.new as Consulta;
                    setMensajes((prev) => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [sesion_id, mesaId]);
    const fetchMensajes = async () => {
        try {
            setLoading(true);
            let query = supabase.from('consultas').select('*').order('created_at', { ascending: true });
            if (sesion_id) {
                query = query.eq('sesion_id', sesion_id);
            } else if (mesaId) {
                query = query.eq('mesa_id', mesaId);
            } else {
                return;
            }
            const { data, error } = await query;
            if (error) throw error;
            setMensajes(data || []);
        } catch (error: any) {
            console.error("Error al cargar chat:", error.message);
        } finally {
            setLoading(false);
        }
    };
    const handleEnviarMensaje = async () => {
        if (!nuevoMensaje.trim() || !mesaId || !miId) return;
        const textoAEnviar = nuevoMensaje.trim();
        setNuevoMensaje('');
        let sesionActiva = sesion_id;
        if (!sesionActiva) {
            sesionActiva = mesaId;
        }
        let nombreRemitente = miNombre;
        if (tipoCliente === 'anonimo') {
            nombreRemitente = 'Cliente (Express)';
        }
        const msgOptimista: Consulta = {
            id: Date.now(),
            created_at: new Date().toISOString(),
            id_usuario: miId,
            mesa_id: mesaId,
            mensaje: textoAEnviar,
            nombre_remitente: nombreRemitente,
        };
        setMensajes(prev => [...prev, msgOptimista]);
        try {
            const { error } = await supabase.from('consultas').insert({
                sesion_id: sesionActiva,
                mesa_id: mesaId,
                mensaje: textoAEnviar,
                id_usuario: miId,
                nombre_remitente: nombreRemitente,
            });
            if (error) {
                showToast("error", "Error", "No se pudo enviar el mensaje.");
                setMensajes(prev => prev.filter(m => m.id !== msgOptimista.id));
            }
        } catch (error: any) {
            showToast("error", "Error", "No se pudo enviar el mensaje.");
            setMensajes(prev => prev.filter(m => m.id !== msgOptimista.id));
        }
    };
    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-primary pt-12">
            <View className="flex-row items-center px-6 mb-4 justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
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
                        const esMio = item.id_usuario === miId;
                        return (
                            <View className={`flex-row ${esMio ? 'justify-end' : 'justify-start'} mb-4`}>
                                <View className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${esMio ? 'bg-primary rounded-tr-none' : 'bg-tertiary/20 rounded-tl-none border border-tertiary/30'
                                    }`}>
                                    <Text className={`text-[10px] uppercase font-black mb-1 ${esMio ? 'text-tertiary' : 'text-primary'}`}>
                                        {esMio ? 'Tú' : item.nombre_remitente}
                                    </Text>
                                    <Text className={`text-sm font-medium ${esMio ? 'text-white' : 'text-primary'}`}>
                                        {item.mensaje}
                                    </Text>
                                    <Text className={`text-[9px] mt-1 ${esMio ? 'text-white/40 text-right' : 'text-primary/40'}`}>
                                        {formatearHora(item.created_at)}
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