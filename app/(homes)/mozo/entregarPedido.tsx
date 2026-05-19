import ListaEntregarPedidosMozo from '@/src/components/ListaEntregarPedidosMozo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function EntregarPedidoMozoScreen() {
    const router = useRouter();
    return (
        <View className="flex-1 bg-primary px-6 pt-12">
        <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="bg-secondary p-2.5 rounded-full mr-4"><Ionicons name="arrow-back" size={18} color="#31603D" /></TouchableOpacity>
            <View>
            <Text className="text-white text-xl font-black uppercase tracking-wider">Pedidos Listos</Text>
            <Text className="text-tertiary text-[10px] uppercase font-bold tracking-widest">Despacho de Cocina y Barra</Text>
            </View>
        </View>
        <View className="flex-1 mt-2"><ListaEntregarPedidosMozo /></View>
        </View>
    );
}