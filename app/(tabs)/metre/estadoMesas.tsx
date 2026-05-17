import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function EstadoMesasScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [mesas, setMesas] = useState<any[]>([]);

    useEffect(() => {
        fetchEstadoMesas();

        // ⚡ Suscripción en tiempo real para reflejar al instante cuando una mesa cambie de estado
        const channel = supabase
        .channel('cambios_estado_mesas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, () => fetchEstadoMesas())
        .subscribe();

        return () => {
        supabase.removeChannel(channel);
        };
    }, []);

    const fetchEstadoMesas = async () => {
        try {
          setLoading(true);
          
          // 🌟 Consulta de diagnóstico: Traemos TODO sin ordenar ni filtrar
          const { data, error } = await supabase
            .from('mesas')
            .select('*');
    
          if (error) {
            console.error("❌ ERROR DIRECTO DE SUPABASE:", error);
            throw error;
          }
          
          console.log("📊 MESAS ENCONTRADAS:", data);
          setMesas(data || []);
        } catch (error: any) {
          console.error("Error al cargar los estados de las mesas:", error.message);
        } finally {
          setLoading(false);
        }
      };

    const handleRefreshVisual = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        fetchEstadoMesas();
    };

    return (
        <View className="flex-1 bg-primary px-6 pt-12">
        {/* Cabecera / Botón Volver */}
        <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity 
            onPress={() => router.back()} 
            className="flex-row items-center bg-secondary py-2 px-4 rounded-full border border-tertiary/10"
            >
            <Ionicons name="arrow-back" size={18} color="#31603D" style={{ marginRight: 6 }} />
            <Text className="text-primary font-bold text-xs uppercase">Volver</Text>
            </TouchableOpacity>

            <TouchableOpacity 
            onPress={handleRefreshVisual}
            className="bg-secondary p-2 rounded-full border border-tertiary/10"
            >
            <Ionicons name="refresh" size={18} color="#31603D" />
            </TouchableOpacity>
        </View>

        <Text className="text-white text-2xl font-black uppercase tracking-wider mb-2">Estado del Salón</Text>
        <Text className="text-tertiary text-xs uppercase font-bold mb-6 tracking-widest">Monitoreo de Ocupación</Text>

        {loading && mesas.length === 0 ? (
            <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#F5C065" />
            </View>
        ) : (
            <FlatList
            data={mesas}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View className="bg-secondary p-8 rounded-3xl items-center mt-6 w-full">
                <Ionicons name="grid-outline" size={40} color="#31603D" />
                <Text className="text-primary font-bold text-center mt-3 uppercase text-xs">No hay mesas dadas de alta</Text>
                </View>
            }
            renderItem={({ item }) => {
                const estaLibre = item.estado?.toLowerCase() === 'libre';

                return (
                <View 
                    style={{ elevation: 2 }}
                    className={`bg-secondary w-[48%] mb-5 rounded-[28px] overflow-hidden border-2 shadow-sm ${
                    estaLibre ? 'border-emerald-500/30' : 'border-red-500/30'
                    }`}
                >
                    {/* Contenedor de la Foto de la Mesa */}
                    <View className="w-full h-28 bg-primary/10 relative">
                    {item.foto ? (
                        <Image 
                        source={{ uri: item.foto }} 
                        className="w-full h-full"
                        resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full justify-center items-center bg-tertiary/10">
                        <Ionicons name="camera-outline" size={32} color="#31603D/40" />
                        </View>
                    )}

                    {/* Badge de Estado Absoluto sobre la foto */}
                    <View className={`absolute top-2 right-2 px-2 py-1 rounded-full border ${
                        estaLibre ? 'bg-emerald-100 border-emerald-400' : 'bg-red-100 border-red-400'
                    }`}>
                        <Text className={`text-[9px] font-black uppercase tracking-wider ${
                        estaLibre ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                        {item.estado}
                        </Text>
                    </View>
                    </View>

                    {/* Detalles de la Mesa */}
                    <View className="p-4 bg-secondary">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-primary font-black text-base uppercase">Mesa {item.numero}</Text>
                        {item.tipo?.toLowerCase() === 'vip' && (
                        <Ionicons name="star" size={14} color="#F5C065" />
                        )}
                    </View>
                    
                    <View className="flex-row items-center mt-0.5">
                        <Ionicons name="people" size={12} color="#6E433D" style={{ marginRight: 4 }} />
                        <Text className="text-tertiary text-[11px] font-bold uppercase">
                        Capacidad: {item.comensales}
                        </Text>
                    </View>

                    <Text className="text-primary text-[9px] font-bold uppercase mt-2 tracking-widest bg-primary/5 align-middle py-1 text-center rounded-lg">
                        Tipo: {item.tipo}
                    </Text>
                    </View>
                </View>
                );
            }}
            />
        )}
        </View>
    );
}