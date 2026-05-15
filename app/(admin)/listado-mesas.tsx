import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Datos de prueba (Luego vendrán de tu base de datos)
const MESAS_DATA = [
  { id: '1', numero: '01', comensales: 4, tipo: 'estandar' },
  { id: '2', numero: '02', comensales: 2, tipo: 'vip' },
  { id: '3', numero: '03', comensales: 6, tipo: 'discapacidad' },
  { id: '4', numero: '04', comensales: 4, tipo: 'estandar' },
];

export default function ListadoMesas() {
  const router = useRouter();

  const renderMesa = ({ item }: { item: typeof MESAS_DATA[0] }) => (
    <View className="bg-secondary mb-4 rounded-[25px] p-5 flex-row items-center justify-between shadow-md">
      <View className="flex-row items-center">
        {/* Icono representativo de la mesa */}
        <View className="bg-primary/10 p-3 rounded-full mr-4">
          <Ionicons 
            name={item.tipo === 'vip' ? 'star' : 'restaurant'} 
            size={24} 
            color="#31603D" 
          />
        </View>
        <View>
          <Text className="text-primary font-bold text-xl">Mesa {item.numero}</Text>
          <Text className="text-primary/60 font-semibold uppercase text-xs">
            {item.comensales} Comensales - {item.tipo}
          </Text>
        </View>
      </View>

      {/* Botón para ver el QR generado de esa mesa */}
      <TouchableOpacity className="bg-tertiary p-3 rounded-full">
        <Ionicons name="qr-code" size={20} color="#31603D" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary">
        
      <View className="bg-tertiary px-6 pt-12 pb-4 flex-row items-center justify-between shadow-md">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.replace('/(homes)/duenio')} className="mr-4">
            <Ionicons name="arrow-back" size={28} color="#31603D" />
          </TouchableOpacity>
          <Text className="text-primary font-bold text-2xl uppercase">Listado Mesas</Text>
        </View>
        
        {/* Botón rápido para agregar otra mesa */}
        <TouchableOpacity onPress={() => router.push('/(admin)/alta-mesa')}>
          <Ionicons name="add-circle" size={32} color="#31603D" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6 pt-6">
        <FlatList
          data={MESAS_DATA}
          keyExtractor={(item) => item.id}
          renderItem={renderMesa}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="text-secondary text-center mt-10">No hay mesas registradas.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}