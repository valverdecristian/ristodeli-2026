import { useToast } from "@/src/context/ToastContext";
import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

    const params = useLocalSearchParams<{
        mesaId?: string;
        numeroMesa?: string;
        sesion_id?: string;
    }>();

    const [mesaId, setMesaId] = useState<string | null>(params.mesaId || null);
    const [numeroMesa, setNumeroMesa] = useState<string | null>(params.numeroMesa || null);
    const [sesionId, setSesionId] = useState<string | null>(params.sesion_id || null);

    const formatearHora = (ts: string) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };

    const [mensajes, setMensajes] = useState<Consulta[]>([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [loading, setLoading] = useState(true);
    const [miId, setMiId] = useState<string | null>(null);
    const [miNombre, setMiNombre] = useState<string>('Mozo');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const inicializar = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;
            setMiId(userId);

            if (userId) {
                const { data: userData } = await supabase
                    .from('usuarios')
                    .select('nombres')
                    .eq('id', userId)
                    .single();
                if (userData?.nombres) setMiNombre(userData.nombres);
            }

            let resolvedSesionId = params.sesion_id || null;
            const resolvedMesaId = params.mesaId || null;
            const resolvedNumeroMesa = params.numeroMesa || null;

            if (!resolvedSesionId && resolvedMesaId) {
                const { data: leData } = await supabase
                    .from('lista_espera')
                    .select('sesion_id')
                    .eq('mesa_asignada', resolvedMesaId)
                    .eq('estado', 'asignado')
                    .eq('qr_mesa_escaneado', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (leData?.sesion_id) resolvedSesionId = leData.sesion_id;
            }

            if (resolvedMesaId) setMesaId(resolvedMesaId);
            if (resolvedNumeroMesa) setNumeroMesa(resolvedNumeroMesa);
            if (resolvedSesionId) setSesionId(resolvedSesionId);
        };

        inicializar();
    }, [params]);

    const marcarLeido = async () => {
        if (!sesionId) return;
        await supabase
            .from('consultas')
            .update({ leido: true })
            .eq('sesion_id', sesionId)
            .eq('leido', false);
    };

    useEffect(() => {
        if (!sesionId) return;

        fetchMensajes();
        marcarLeido();

        const channel = supabase
            .channel(`chat_sesion_mozo_${sesionId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'consultas', filter: `sesion_id=eq.${sesionId}` },
                (payload) => {
                    const msg = payload.new as Consulta;
                    setMensajes((prev) => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [sesionId]);

    const fetchMensajes = async () => {
        if (!sesionId) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('consultas')
                .select('*')
                .eq('sesion_id', sesionId)
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
        if (!nuevoMensaje.trim() || !sesionId || !mesaId || !miId) return;

        const textoAEnviar = nuevoMensaje.trim();
        setNuevoMensaje('');

        try {
            const { error } = await supabase.from('consultas').insert({
                sesion_id: sesionId,
                mesa_id: mesaId,
                mensaje: textoAEnviar,
                id_usuario: miId,
                nombre_remitente: miNombre,
            });

            if (error) {
                showToast("error", "Error", "No se pudo enviar el mensaje.");
                return;
            }

        } catch (error: any) {
            showToast("error", "Error", "No se pudo enviar el mensaje.");
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
                        <Text className="text-white text-xl font-black uppercase tracking-wider">Chat Mesa</Text>
                        <Text className="text-tertiary text-[10px] uppercase font-bold tracking-widest">Mesa N° {numeroMesa || '--'}</Text>
                    </View>
                </View>
            </View>

            <SafeAreaView edges={['bottom']} className="flex-1 bg-secondary rounded-t-[32px] px-6 pt-6 pb-4 border-t border-tertiary/20">
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
                )}

                <View className="flex-row items-center pt-3 border-t border-primary/5">
                    <TextInput
                        value={nuevoMensaje}
                        onChangeText={setNuevoMensaje}
                        placeholder="Escribe tu respuesta..."
                        placeholderTextColor="#a0aec0"
                        className="flex-1 bg-primary/5 text-primary rounded-full px-5 py-3 text-sm font-medium mr-3"
                    />
                    <TouchableOpacity onPress={handleEnviarMensaje} className="bg-tertiary w-12 h-12 rounded-full items-center justify-center border-b-2 border-orange">
                        <Ionicons name="send" size={16} color="#31603D" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}
