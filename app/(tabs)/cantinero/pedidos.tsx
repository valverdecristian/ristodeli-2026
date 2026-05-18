import React from 'react';
import { View, Text } from 'react-native';
import ListaPedidosPendientes from '@/src/components/ListaPedidosPendientes';

export default function PedidosCantineroScreen() {
    return (
        <View className="flex-1 bg-primary px-6 pt-12">
        <Text className="text-white text-2xl font-black uppercase tracking-wider mb-1">Sector Barra</Text>
        <Text className="text-tertiary text-xs uppercase font-bold mb-6 tracking-widest">Control de Bebidas</Text>
        
        <ListaPedidosPendientes sector="bar" /> 
        </View>
    );
}