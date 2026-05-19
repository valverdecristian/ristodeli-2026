import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

interface MesaDB {
    id: string;        
    numero: number;    
}

export default function ConsultasClientesScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [mesas, setMesas] = useState<MesaDB[]>([]);
    const [mesasConMensajes, setMesasConMensajes] = useState<string[]>([]); // Guarda UUIDs de mesas con actividad

    useEffect(() => {
        inicializarPantalla();

        const channel = supabase
            .channel('realtime_consultas_central')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultas' }, () => {
                obtenerMesasConActividad();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const inicializarPantalla = async () => {
        try {
            setLoading(true);
            // 1. Traemos la lista real de mesas de tu base de datos organizada por número
            const { data: dataMesas, error: errorMesas } = await supabase
                .from('mesas')
                .select('id, numero')
                .order('numero', { ascending: true });

            if (errorMesas) throw errorMesas;
            setMesas(dataMesas || []);

            // 2. Escaneamos la actividad de chats
            await obtenerMesasConActividad();
        } catch (error) {
            console.error("Error al cargar mesas de DB:", error);
        } finally {
            setLoading(false);
        }
    };

    const obtenerMesasConActividad = async () => {
        try {
            const { data, error } = await supabase
                .from('consultas')
                .select('mesa_id')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Almacenamos los UUIDs únicos de las mesas con historial de consultas
            const uuidsActivos = Array.from(new Set(data?.map(m => m.mesa_id).filter(Boolean))) as string[];
            setMesasConMensajes(uuidsActivos);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View className="flex-1 bg-primary pt-12 px-6">
            <View className="flex-row items-center mb-6">
                <TouchableOpacity onPress={() => router.back()} className="bg-secondary p-2.5 rounded-full mr-4">
                    <Ionicons name="arrow-back" size={18} color="#31603D" />
                </TouchableOpacity>
                <View>
                    <Text className="text-white text-xl font-black uppercase tracking-wider">Chats por Mesa</Text>
                    <Text className="text-tertiary text-[10px] uppercase font-bold tracking-widest">Consultas activas en salón</Text>
                </View>
            </View>

            <View className="flex-1 bg-secondary rounded-t-[32px] p-6 border-t border-tertiary/20">
                {loading && mesas.length === 0 ? (
                    <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#F5C065" /></View>
                ) : (
                    <FlatList
                        data={mesas}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                            const tieneMensajes = mesasConMensajes.includes(item.id);
                            return (
                                <TouchableOpacity
                                    onPress={() => router.push({
                                        pathname: "/(homes)/mozo/chatMozo" as any,
                                        params: { mesaId: item.id, numeroMesa: item.numero } // 🌟 Mandamos los dos identificadores
                                    })}
                                    style={{ elevation: 2 }}
                                    className={`w-[47%] p-6 rounded-[24px] mb-4 items-center justify-center border ${
                                        tieneMensajes ? 'bg-primary border-tertiary/40' : 'bg-secondary border-primary/10'
                                    }`}
                                >
                                    <View className={`p-3 rounded-full mb-2 ${tieneMensajes ? 'bg-tertiary/20' : 'bg-primary/5'}`}>
                                        <Ionicons 
                                            name={tieneMensajes ? "chatbubble-ellipses" : "restaurant-outline"} 
                                            size={24} 
                                            color={tieneMensajes ? "#F5C065" : "#31603D"} 
                                        />
                                    </View>
                                    <Text className={`font-black text-sm uppercase ${tieneMensajes ? 'text-white' : 'text-primary'}`}>
                                        Mesa N° {item.numero}
                                    </Text>
                                    {tieneMensajes && (
                                        <View className="bg-tertiary px-2 py-0.5 rounded-full mt-1">
                                            <Text className="text-primary font-bold text-[8px] uppercase">Activo</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}
            </View>
        </View>
    );
}