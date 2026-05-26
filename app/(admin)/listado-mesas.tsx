import { supabase } from "@/src/services/SupabaseClient";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, Modal, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingModal from "@/src/components/LoadingModal";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculamos la altura disponible de forma exacta:
// SCREEN_HEIGHT - Header (~75) - SafeArea/StatusBar (~60)
// Dividido por 2 para que entren exactamente dos filas verticales sin superposición ni cortes.
const HEADER_HEIGHT = 75;
const SAFE_AREA_ESTIMATE = 60;
const TOTAL_PADDING = 32; // paddingVertical (20) + contenedor (12)
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - SAFE_AREA_ESTIMATE - TOTAL_PADDING;

const CARD_HEIGHT = AVAILABLE_HEIGHT / 2;
const VERTICAL_MARGIN = 20; // Margen simétrico para dar separación
const SNAP_INTERVAL = CARD_HEIGHT + (VERTICAL_MARGIN * 2);

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
    <View style={{ width: '100%', height: CARD_HEIGHT - (VERTICAL_MARGIN * 2), marginTop: VERTICAL_MARGIN, marginBottom: VERTICAL_MARGIN }} className="bg-secondary rounded-[30px] overflow-hidden shadow-xl">

      {/* Foto de la Mesa (Ocupa la parte superior a ancho completo) */}
      <View className="relative w-full h-[60%] bg-primary/20">
        {item.foto ? (
          <Image source={{ uri: item.foto }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="image-outline" size={48} color="#31603D" style={{ opacity: 0.3 }} />
          </View>
        )}

        <TouchableOpacity
          className="absolute top-4 right-4 bg-tertiary p-3 rounded-full shadow-lg"
          style={{ elevation: 5 }}
          onPress={() => setMesaQR(item)}
        >
          <Ionicons name="qr-code" size={20} color="#31603D" />
        </TouchableOpacity>
      </View>

      {/* Información de la Mesa (Abajo) */}
      <View className="p-4 flex-1 justify-between flex-row items-center">
        <View>
          <Text className="text-primary font-black text-2xl uppercase tracking-tighter">Mesa {item.numero}</Text>

          <View className="flex-row items-center mt-1">
            <Ionicons name={item.tipo === 'vip' ? 'star' : 'restaurant'} size={14} color="#31603D" />
            <Text className="text-primary/70 font-bold uppercase text-xs ml-2">
              {item.tipo}
            </Text>
          </View>
        </View>

        <View className="bg-primary/10 px-4 py-2 rounded-full items-center">
          <Text className="text-primary font-bold text-xs uppercase">
            {item.comensales} Pax
          </Text>
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

      {/* LISTA DE 1 COLUMNA (2 FILAS POR PANTALLA) CON SCROLL SNAP */}
      <View className="flex-1 px-5">
        <LoadingModal visible={loading} message="Cargando mesas..." />
        <FlatList
          data={mesas}
          keyExtractor={(item) => item.id.toString()}
          numColumns={1}
          key={1}
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={renderMesa}
          showsVerticalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL} 
          decelerationRate="fast"
          snapToAlignment="start"
          ListEmptyComponent={
            !loading ? (
              <Text className="text-secondary font-bold text-center mt-10">No hay mesas registradas.</Text>
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