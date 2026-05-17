import { Ionicons } from '@expo/vector-icons';
import React, { ComponentProps } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface HomeClienteBaseProps {
    nombre: string;
    fotoUrl: string;
    tipoCliente: 'registrado' | 'anonimo';
    enListaEspera: boolean;
    onEscanearEntrada: () => void;
    onEscanearMesa: () => void;
    onVerEncuestas: () => void;
    onAccionAdicional?: () => void;
    textoAccionAdicional?: string;
    iconoAccionAdicional?: ComponentProps<typeof Ionicons>['name']; 
}

export default function HomeClienteBase({
    nombre,
    fotoUrl,
    tipoCliente,
    enListaEspera,
    onEscanearEntrada,
    onEscanearMesa,
    onVerEncuestas,
    onAccionAdicional,
    textoAccionAdicional,
    iconoAccionAdicional,
}: HomeClienteBaseProps) {
    return (
        <View className="flex-1 bg-primary px-6 justify-center items-center w-full">
        
        <View className="bg-secondary rounded-[30px] p-5 w-full items-center mb-8 border border-tertiary/20 shadow-md flex-row">
            <View className="w-16 h-16 rounded-full border-2 border-tertiary overflow-hidden mr-4 bg-primary justify-center items-center">
            {fotoUrl ? (
                <Image source={{ uri: fotoUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
                <Ionicons name="person-outline" size={28} color="#31603D" />
            )}
            </View>
            <View className="flex-1">
            <Text className="text-primary font-extrabold text-lg uppercase tracking-tight" numberOfLines={1}>
                {nombre || 'Cliente'}
            </Text>
            <View className="bg-tertiary/20 self-start px-2.5 py-0.5 rounded-full mt-1">
                <Text className="text-primary font-bold text-[10px] uppercase tracking-wider">
                Perfil {tipoCliente}
                </Text>
            </View>
            </View>
        </View>

        <View className="w-full space-y-4">
            
            <TouchableOpacity 
            onPress={onEscanearMesa}
            className={`w-full py-5 rounded-[25px] flex-row items-center justify-center border shadow-md mb-4 ${enListaEspera ? 'bg-secondary border-tertiary/20 active:opacity-90' : 'bg-gray-400 border-gray-500 active:opacity-100'}`}
            >
            <Ionicons name="restaurant-outline" size={24} color={enListaEspera ? "#31603D" : "#777"} style={{ marginRight: 12 }} />
            <Text className={`font-bold uppercase text-sm tracking-wide ${enListaEspera ? 'text-primary' : 'text-gray-600'}`}>
                Escanear QR de Mesa
            </Text>
            </TouchableOpacity>

            <TouchableOpacity 
            onPress={onVerEncuestas}
            className="w-full bg-secondary py-5 rounded-[25px] flex-row items-center justify-center border border-tertiary/20 shadow-md active:opacity-90 mb-4"
            >
            <Ionicons name="bar-chart-outline" size={24} color="#31603D" style={{ marginRight: 12 }} />
            <Text className="text-primary font-bold uppercase text-sm tracking-wide">
                Resultados de Encuestas
            </Text>
            </TouchableOpacity>

            {tipoCliente === 'registrado' && onAccionAdicional && (
            <TouchableOpacity 
                onPress={onAccionAdicional}
                className="w-full bg-tertiary py-5 rounded-[25px] flex-row items-center justify-center border-b-4 border-orange active:opacity-90"
            >
                <Ionicons name={(iconoAccionAdicional as any) || "star-outline"} size={24} color="#31603D" style={{ marginRight: 12 }} />
                <Text className="text-primary font-bold uppercase text-sm tracking-wide">
                {textoAccionAdicional || 'Acción Adicional'}
                </Text>
            </TouchableOpacity>
            )}

        </View>
        </View>
    );
}