import FormularioProducto from '@/src/components/FormularioProducto';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AltaProductoCantinero() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-primary px-6 pt-4">
        <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back-outline" size={28} color="#31603D" />
            </TouchableOpacity>
            <Text className="text-secondary font-bold text-2xl uppercase tracking-tight">
            Alta Barra
            </Text>
        </View>

        {/* El cantinero esta restringido a bebidas */}
        <FormularioProducto 
            tiposPermitidos={['bebida']} 
            onExito={() => router.replace('/(homes)/cantinero')} 
        />
        </SafeAreaView>
    );
}