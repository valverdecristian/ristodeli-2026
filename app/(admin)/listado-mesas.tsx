import { supabase } from "@/src/services/SupabaseClient";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function ListadoMesas() {
  const router = useRouter();
  const [mesas, setMesas] = useState<any[]>([]);
  const [mesaQR, setMesaQR] = useState<any>(null);
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
      <TouchableOpacity className="bg-tertiary p-3 rounded-full" onPress={() => setMesaQR(item)}>
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
      <Modal visible={!!mesaQR} transparent animationType="fade" onRequestClose={() => setMesaQR(null)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-primary p-8 rounded-3xl items-center w-[85%] max-w-sm">
            <TouchableOpacity className="absolute top-4 right-4 z-10" onPress={() => setMesaQR(null)}>
              <Ionicons name="close-circle" size={32} color="#F5C065" />
            </TouchableOpacity>
            {mesaQR && (
              <>
                <QRCode value={mesaQR.qr_data} size={200} color="#31603D" backgroundColor="#F5F5DC" />
                <Text className="text-secondary font-bold text-xl mt-6 uppercase">Mesa {mesaQR.numero}</Text>
                <Text className="text-secondary/70 font-semibold text-sm mt-1">
                  {mesaQR.comensales} comensales - {mesaQR.tipo}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}