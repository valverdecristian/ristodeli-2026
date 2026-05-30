import { SoundService } from '@/src/services/soundService';
import { EncuestaService } from '@/src/services/encuestaService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EncuestasPreviasScreen() {
    const router = useRouter();
    const [cantEncuestas, setCantEncuestas] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCant = async () => {
            try {
                const data = await EncuestaService.obtenerTodas();
                setCantEncuestas(data.length);
            } catch (e) {
                console.error("Error al cargar encuestas para conteo:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchCant();
    }, []);

    const irAGrafico = async (tipoGrafico: string) => {
        await SoundService.reproducir('exito');
        router.push({
            pathname: "/(tabs)/graficoDetalle",
            params: { tipo: tipoGrafico }
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-primary">
            {/* Cabecera / Botón Volver */}
            <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center justify-between shadow-2xl">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={async () => {
                            await SoundService.reproducir('exito');
                            router.back();
                        }}
                        className="mr-3"
                    >
                        <Ionicons name="arrow-back" size={30} color="#31603D" />
                    </TouchableOpacity>
                    <Text className="text-primary font-bold text-2xl uppercase tracking-tighter">Estadísticas</Text>
                </View>
                <Ionicons name="bar-chart-outline" size={28} color="#31603D" />
            </View>

            <ScrollView className="flex-1 px-6 mt-4" showsVerticalScrollIndicator={false}>
                {/* Banner de Bienvenida y Conteo */}
                <View className="bg-secondary rounded-[30px] p-6 border border-tertiary/15 shadow-xl mb-6 relative overflow-hidden">
                    <View className="flex-row justify-between items-center z-10">
                        <View className="flex-1 pr-4">
                            <Text className="text-primary font-black text-xl uppercase tracking-tight">RistoDeli Analítica</Text>
                            <Text className="text-primary/70 text-xs mt-1 uppercase font-bold tracking-wider">Métricas de Satisfacción y Calidad</Text>

                            <View className="flex-row items-center mt-4">
                                {loading ? (
                                    <ActivityIndicator size="small" color="#31603D" />
                                ) : (
                                    <View className="bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/15">
                                        <Text className="text-primary font-black text-xs uppercase">
                                            {cantEncuestas} Encuestas Registradas
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <Ionicons name="stats-chart" size={72} color="#31603D" style={{ opacity: 0.1, position: 'absolute', right: -10, bottom: -10 }} />
                    </View>
                </View>

                {/* Listado de Gráficos */}
                <View className="space-y-4 pb-10">
                    {/* SATISFACCIÓN */}
                    <TouchableOpacity
                        onPress={() => irAGrafico('satisfaccion')}
                        className="w-full bg-secondary p-5 rounded-[24px] border border-tertiary/20 flex-row items-center justify-between shadow-md mb-4"
                    >
                        <View className="flex-row items-center">
                            <View className="bg-amber-100 p-3 rounded-2xl mr-4">
                                <Ionicons name="happy-outline" size={28} color="#F5C065" />
                            </View>
                            <View>
                                <Text className="text-primary font-bold text-base uppercase">Nivel de Satisfacción</Text>
                                <Text className="text-primary/50 text-xs font-semibold">Calificación general de la visita</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#31603D" />
                    </TouchableOpacity>

                    {/* RECOMENDACIÓN */}
                    <TouchableOpacity
                        onPress={() => irAGrafico('recomendacion')}
                        className="w-full bg-secondary p-5 rounded-[24px] border border-tertiary/20 flex-row items-center justify-between shadow-md mb-4"
                    >
                        <View className="flex-row items-center">
                            <View className="bg-red-100 p-3 rounded-2xl mr-4">
                                <Ionicons name="heart-outline" size={28} color="#E76F51" />
                            </View>
                            <View>
                                <Text className="text-primary font-bold text-base uppercase">Índice de Recomendación</Text>
                                <Text className="text-primary/50 text-xs font-semibold">Tasa de promoción del local (Sí / No)</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#31603D" />
                    </TouchableOpacity>

                    {/* LIMPIEZA */}
                    <TouchableOpacity
                        onPress={() => irAGrafico('limpieza')}
                        className="w-full bg-secondary p-5 rounded-[24px] border border-tertiary/20 flex-row items-center justify-between shadow-md mb-4"
                    >
                        <View className="flex-row items-center">
                            <View className="bg-emerald-100 p-3 rounded-2xl mr-4">
                                <Ionicons name="sparkles-outline" size={28} color="#10B981" />
                            </View>
                            <View>
                                <Text className="text-primary font-bold text-base uppercase">Estado de Limpieza</Text>
                                <Text className="text-primary/50 text-xs font-semibold">Evaluación de higiene y orden</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#31603D" />
                    </TouchableOpacity>

                    {/* PILARES DE SERVICIO */}
                    <TouchableOpacity
                        onPress={() => irAGrafico('pilares')}
                        className="w-full bg-secondary p-5 rounded-[24px] border border-tertiary/20 flex-row items-center justify-between shadow-md mb-4"
                    >
                        <View className="flex-row items-center">
                            <View className="bg-blue-100 p-3 rounded-2xl mr-4">
                                <Ionicons name="construct-outline" size={28} color="#3B82F6" />
                            </View>
                            <View>
                                <Text className="text-primary font-bold text-base uppercase">Servicio, Comida y Ambiente</Text>
                                <Text className="text-primary/50 text-xs font-semibold">Desempeño detallado de pilares</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#31603D" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}