import FormularioProducto from '@/src/components/FormularioProducto';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AltaProductoCocinero() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-primary px-6 pt-4">
        <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back-outline" size={28} color="#31603D" />
            </TouchableOpacity>
            <Text className="text-secondary font-bold text-2xl uppercase tracking-tight">
            Alta Cocina
            </Text>
        </View>

        {/* El cocinero solo maneja platos y postres */}
        <FormularioProducto 
            tiposPermitidos={['plato', 'postre']} 
            onExito={() => router.replace('/(homes)/cocinero')} 
        />
        </SafeAreaView>
    );
}