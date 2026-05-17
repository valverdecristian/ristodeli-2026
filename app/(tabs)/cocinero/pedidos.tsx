import React from 'react';
import { View, Text } from 'react-native';
import ListaPedidosPendientes from '@/src/components/ListaPedidosPendientes';

export default function PedidosCocineroScreen() {
    return (
        <View className="flex-1 bg-primary px-6 pt-12">
        <Text className="text-white text-2xl font-black uppercase tracking-wider mb-1">Sector Cocina</Text>
        <Text className="text-tertiary text-xs uppercase font-bold mb-6 tracking-widest">Platos y Postres Pendientes</Text>
        
        <ListaPedidosPendientes sector="cocina" /> 
        </View>
    );
}