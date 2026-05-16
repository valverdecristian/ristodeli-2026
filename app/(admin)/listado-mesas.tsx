import { supabase } from "@/src/services/SupabaseClient";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function ListadoMesas() {
  const router = useRouter();
  const [mesas, setMesas] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("mesas").select("*").order("numero", { ascending: true }).then(({ data, error }) => {
      if (!error && data) setMesas(data);
    });
  }, []);
  const renderMesa = ({ item }: { item: any }) => (
    <View className="bg-secondary mb-4 rounded-[25px] p-5 flex-row items-center justify-between shadow-md">
      <View className="flex-row items-center">
        <View className="bg-primary/10 p-3 rounded-full mr-4">
          <Ionicons name={item.tipo === 'vip' ? 'star' : 'restaurant'} size={24} color="#31603D" />
        </View>
        <View>
          <Text className="text-primary font-bold text-xl">Mesa {item.numero}</Text>
          <Text className="text-primary/60 font-semibold uppercase text-xs">{item.comensales} Comensales - {item.tipo}</Text>
        </View>
      </View>
      <TouchableOpacity className="bg-tertiary p-3 rounded-full">
        <Ionicons name="qr-code" size={20} color="#31603D" />
      </TouchableOpacity>
    </View>
  );
  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="bg-tertiary px-6 pt-12 pb-4 flex-row items-center justify-between shadow-md">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={28} color="#31603D" />
          </TouchableOpacity>
          <Text className="text-primary font-bold text-2xl uppercase">Listado Mesas</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(admin)/alta-mesa')}>
          <Ionicons name="add-circle" size={32} color="#31603D" />
        </TouchableOpacity>
      </View>
      <View className="flex-1 px-6 pt-6">
        <FlatList
          data={mesas}
          keyExtractor={(item) => item.id}
          renderItem={renderMesa}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text className="text-secondary text-center mt-10">No hay mesas registradas.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}