import VisorProductos from '@/src/components/VisorProductos';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MenuCocineroScreen() {
    const router = useRouter();
    const [categoriaActual, setCategoriaActual] = useState<'plato' | 'postre'>('plato');

    return (
        <SafeAreaView className="flex-1 bg-primary px-6 pt-4">
        {/* 🌟 CORREGIDO: View nativa en vez de div */}
        <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back-outline" size={28} color="#31603D" />
            </TouchableOpacity>
            <Text className="text-secondary font-bold text-2xl uppercase tracking-tight">
            Catálogo Cocina
            </Text>
        </View>

        {/* 🌟 CORREGIDO: View nativa en vez de div */}
        <View className="flex-row justify-between mb-6">
            <TouchableOpacity
            onPress={() => setCategoriaActual('plato')}
            className={`w-[48%] py-3 rounded-full border-b-4 ${categoriaActual === 'plato' ? 'bg-tertiary border-orange' : 'bg-secondary border-gray-400'} active:opacity-90`}
            >
            <Text className={`text-center font-bold uppercase text-xs ${categoriaActual === 'plato' ? 'text-primary' : 'text-secondary'}`}>
                Ver Platos
            </Text>
            </TouchableOpacity>

            <TouchableOpacity
            onPress={() => setCategoriaActual('postre')}
            className={`w-[48%] py-3 rounded-full border-b-4 ${categoriaActual === 'postre' ? 'bg-tertiary border-orange' : 'bg-secondary border-gray-400'} active:opacity-90`}
            >
            <Text className={`text-center font-bold uppercase text-xs ${categoriaActual === 'postre' ? 'text-primary' : 'text-secondary'}`}>
                Ver Postres
            </Text>
            </TouchableOpacity>
        </View>

        <VisorProductos categoriasFiltradas={[categoriaActual]} />
        </SafeAreaView>
    );
}