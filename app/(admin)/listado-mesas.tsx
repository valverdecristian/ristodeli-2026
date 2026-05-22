import { supabase } from "@/src/services/SupabaseClient";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
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
    <View style={{ width: '47%', marginBottom: 20 }} className="bg-secondary rounded-[25px] overflow-hidden shadow-lg">

      {/* 1. Foto de la Mesa con Botón QR Flotante */}
      <View className="relative w-full h-32 bg-primary/20">
        {item.foto ? (
          <Image source={{ uri: item.foto }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="image-outline" size={32} color="#31603D" style={{ opacity: 0.3 }} />
          </View>
        )}

        <TouchableOpacity
          className="absolute top-2 right-2 bg-tertiary p-2 rounded-full shadow-lg"
          style={{ elevation: 5 }}
          onPress={() => setMesaQR(item)}
        >
          <Ionicons name="qr-code" size={18} color="#31603D" />
        </TouchableOpacity>
      </View>

      {/* 2. Información de la Mesa */}
      <View className="p-4 items-center">
        <Text className="text-primary font-black text-xl uppercase tracking-tighter">Mesa {item.numero}</Text>

        <View className="flex-row items-center mt-1">
          <Ionicons name={item.tipo === 'vip' ? 'star' : 'restaurant'} size={12} color="#31603D" />
          <Text className="text-primary/70 font-bold uppercase text-[10px] ml-1">
            {item.tipo}
          </Text>
        </View>

        <View className="bg-primary/10 px-3 py-1 rounded-full mt-2 w-full items-center">
          <Text className="text-primary font-bold text-xs uppercase">
            {item.comensales} Pax
          </Text>
        </View>
      </View>

    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary">

      {/* HEADER CORREGIDO: pt-4 y pb-5 para igualar a alta-mesa */}
      <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center justify-between shadow-2xl">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={30} color="#31603D" />
          </TouchableOpacity>
          <Text className="text-primary font-bold text-2xl uppercase tracking-tighter">Listado Mesas</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(admin)/alta-mesa')}>
          <Ionicons name="add-circle" size={34} color="#31603D" />
        </TouchableOpacity>
      </View>

      {/* LISTA GRILLA DE 2 COLUMNAS */}
      <View className="flex-1">
        <FlatList
          data={mesas}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          key={2} /* Ayuda a que React Native no se rompa al pasar de 1 a 2 columnas en desarrollo */
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingVertical: 24 }}
          renderItem={renderMesa}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text className="text-secondary font-bold text-center mt-10">No hay mesas registradas.</Text>}
        />
      </View>

      {/* MODAL DEL QR */}
      <Modal visible={!!mesaQR} transparent animationType="fade" onRequestClose={() => setMesaQR(null)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-primary p-8 rounded-3xl items-center w-[85%] max-w-sm">
            <TouchableOpacity className="absolute top-4 right-4 z-10" onPress={() => setMesaQR(null)}>
              <Ionicons name="close-circle" size={32} color="#F5C065" />
            </TouchableOpacity>
            {mesaQR && (
              <>
                <View className="bg-secondary p-4 rounded-2xl mb-4">
                  <QRCode value={mesaQR.qr_data} size={200} color="#31603D" backgroundColor="#F8EECB" />
                </View>
                <Text className="text-secondary font-black text-3xl mt-2 uppercase tracking-tighter">Mesa {mesaQR.numero}</Text>
                <Text className="text-secondary/70 font-bold uppercase text-sm mt-1">
                  {mesaQR.comensales} pax - {mesaQR.tipo}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}