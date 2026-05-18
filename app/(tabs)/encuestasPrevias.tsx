import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function EncuestasPreviasScreen() {
    const router = useRouter();

    const irAGrafico = async (tipoGrafico: string) => {
        await SoundService.reproducir('exito');
        router.push({
        pathname: "/(tabs)/graficoDetalle",
        params: { tipo: tipoGrafico }
        });
    };

    return (
        <ScrollView className="flex-1 bg-primary px-6 pt-12">
        <Text className="text-secondary font-black text-2xl uppercase text-center mb-2 tracking-tight">
            Estadísticas del Local
        </Text>
        <Text className="text-primary/60 text-xs text-center uppercase font-bold tracking-widest mb-10">
            Métricas de Satisfacción y Calidad
        </Text>

        <View className="space-y-4 flex-1">
            {/* BOTÓN 1: SATISFACCIÓN */}
            <TouchableOpacity 
            onPress={() => irAGrafico('satisfaccion')}
            className="w-full bg-secondary p-5 rounded-[24px] border border-tertiary/20 flex-row items-center justify-between shadow-md mb-4"
            >
            <View className="flex-row items-center">
                <View className="bg-tertiary/10 p-3 rounded-2xl mr-4">
                <Ionicons name="happy-outline" size={28} color="#F5C065" />
                </View>
                <View>
                <Text className="text-primary font-bold text-base uppercase">Nivel de Satisfacción</Text>
                <Text className="text-primary/50 text-xs font-semibold">Gráfico de barras generales</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#31603D" />
            </TouchableOpacity>

            {/* BOTÓN 2: RECOMENDACIÓN */}
            <TouchableOpacity 
            onPress={() => irAGrafico('recomendacion')}
            className="w-full bg-secondary p-5 rounded-[24px] border border-tertiary/20 flex-row items-center justify-between shadow-md mb-4"
            >
            <View className="flex-row items-center">
                <View className="bg-tertiary/10 p-3 rounded-2xl mr-4">
                <Ionicons name="heart-outline" size={28} color="#F5C065" />
                </View>
                <View>
                <Text className="text-primary font-bold text-base uppercase">Índice de Recomendación</Text>
                <Text className="text-primary/50 text-xs font-semibold">Gráfico de torta (Sí / No)</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#31603D" />
            </TouchableOpacity>

            {/* BOTÓN 3: LIMPIEZA */}
            <TouchableOpacity 
            onPress={() => irAGrafico('limpieza')}
            className="w-full bg-secondary p-5 rounded-[24px] border border-tertiary/20 flex-row items-center justify-between shadow-md mb-4"
            >
            <View className="flex-row items-center">
                <View className="bg-tertiary/10 p-3 rounded-2xl mr-4">
                <Ionicons name="sparkles-outline" size={28} color="#F5C065" />
                </View>
                <View>
                <Text className="text-primary font-bold text-base uppercase">Estado de Limpieza</Text>
                <Text className="text-primary/50 text-xs font-semibold">Frecuencia de orden del salón</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#31603D" />
            </TouchableOpacity>

            {/* BOTÓN 4: PILARES DE SERVICIO */}
            <TouchableOpacity 
            onPress={() => irAGrafico('pilares')}
            className="w-full bg-secondary p-5 rounded-[24px] border border-tertiary/20 flex-row items-center justify-between shadow-md mb-6"
            >
            <View className="flex-row items-center">
                <View className="bg-tertiary/10 p-3 rounded-2xl mr-4">
                <Ionicons name="restaurant-outline" size={28} color="#F5C065" />
                </View>
                <View>
                <Text className="text-primary font-bold text-base uppercase">Atención, Comida y Ambiente</Text>
                <Text className="text-primary/50 text-xs font-semibold">Gráfico de líneas comparativo</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#31603D" />
            </TouchableOpacity>
        </View>
        </ScrollView>
    );
}