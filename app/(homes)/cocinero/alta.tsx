import FormularioProducto from '@/src/components/FormularioProducto';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AltaProductoCocinero() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-primary">
            {/* ENCABEZADO PREMIUM INTEGRADO */}
            <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center justify-between shadow-2xl">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1 active:opacity-75">
                        <Ionicons name="arrow-back" size={30} color="#31603D" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-primary font-black text-2xl uppercase tracking-tighter leading-none">Alta Cocina</Text>
                        <Text className="text-primary/70 font-bold text-[9px] uppercase tracking-widest mt-1">Registrar plato o postre en la carta</Text>
                    </View>
                </View>
            </View>

            {/* Contenedor del formulario */}
            <View className="flex-1 bg-secondary rounded-t-[32px] border-t border-tertiary/20 px-6 pt-2">
                <FormularioProducto
                    tiposPermitidos={['plato', 'postre']}
                    onExito={() => router.replace('/(homes)/cocinero')}
                />
            </View>
        </SafeAreaView>
    );
}