import { supabase } from "@/src/services/SupabaseClient";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, Modal, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingModal from "@/src/components/LoadingModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculamos la altura disponible de forma exacta:
// SCREEN_HEIGHT - Header (~75) - SafeArea/StatusBar (~60)
const HEADER_HEIGHT = 75;
const SAFE_AREA_ESTIMATE = 60;
const VERTICAL_PADDING = 40;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - SAFE_AREA_ESTIMATE - VERTICAL_PADDING;

const CARD_HEIGHT = AVAILABLE_HEIGHT * 0.95;

export default function ListadoMesas() {
  const router = useRouter();
  const [mesas, setMesas] = useState<any[]>([]);
  const [mesaQR, setMesaQR] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("mesas").select("*").order("numero", { ascending: true }).then(({ data, error }) => {
      if (!error && data) setMesas(data);
      setLoading(false);
    });
  }, []);

  const renderMesa = ({ item }: { item: any }) => (
    <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: SCREEN_WIDTH - 40, height: CARD_HEIGHT }} className="bg-secondary rounded-[30px] overflow-hidden shadow-xl">

        {/* Foto de la Mesa (Ocupa la parte superior a ancho completo) */}
        <View className="relative w-full h-[65%] bg-primary/20">
          {item.foto ? (
            <Image source={{ uri: item.foto }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="image-outline" size={64} color="#31603D" style={{ opacity: 0.3 }} />
            </View>
          )}

          <TouchableOpacity
            className="absolute top-4 right-4 bg-tertiary p-3 rounded-full shadow-lg"
            style={{ elevation: 5 }}
            onPress={() => setMesaQR(item)}
          >
            <Ionicons name="qr-code" size={24} color="#31603D" />
          </TouchableOpacity>
        </View>

        {/* Información de la Mesa (Abajo) */}
        <View className="p-6 flex-1 justify-between flex-row items-center">
          <View>
            <Text className="text-primary font-black text-3xl uppercase tracking-tighter">Mesa {item.numero}</Text>

            <View className="flex-row items-center mt-2">
              <Ionicons name={item.tipo === 'vip' ? 'star' : 'restaurant'} size={18} color="#31603D" />
              <Text className="text-primary/70 font-bold uppercase text-sm ml-2">
                {item.tipo}
              </Text>
            </View>
          </View>

          <View className="bg-primary/10 px-5 py-3 rounded-full items-center">
            <Text className="text-primary font-bold text-sm uppercase">
              {item.comensales} Pax
            </Text>
          </View>
        </View>

      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary">

      {/* HEADER */}
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

      {/* LISTADO HORIZONTAL DE MESAS CON DESPLAZAMIENTO LATERAL */}
      <View className="flex-1">
        <LoadingModal visible={loading} message="Cargando mesas..." />
        <FlatList
          data={mesas}
          keyExtractor={(item) => item.id.toString()}
          horizontal={true}
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          renderItem={renderMesa}
          decelerationRate="fast"
          ListEmptyComponent={
            !loading ? (
              <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                <Text className="text-secondary font-bold text-center">No hay mesas registradas.</Text>
              </View>
            ) : null
          }
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