import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Modal, Switch, ActivityIndicator, Dimensions } from 'react-native';
import { supabase } from '@/src/services/SupabaseClient';
import { MesaService } from '@/src/services/mesaService';
import LoadingModal from '@/src/components/LoadingModal';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEADER_HEIGHT = 80;
const TITLE_SECTION_HEIGHT = 100;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - TITLE_SECTION_HEIGHT - 60;

export default function EstadoMesasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mesas, setMesas] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [mesaModal, setMesaModal] = useState<any>(null);
  const [clienteInfo, setClienteInfo] = useState<any>(null);
  const [nuevoEstado, setNuevoEstado] = useState<string>('Libre');
  const [cargandoCliente, setCargandoCliente] = useState(false);

  useEffect(() => {
    fetchEstadoMesas();

    const channel = supabase
      .channel('cambios_estado_mesas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, () => fetchEstadoMesas())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEstadoMesas = async () => {
    try {
      setLoading(true);
      const data = await MesaService.obtenerTodas();
      setMesas(data);
    } catch (error: any) {
      console.error("Error al cargar los estados de las mesas:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModal = async (mesa: any) => {
    setMesaModal(mesa);
    setNuevoEstado(mesa.estado);
    setClienteInfo(null);
    setModalVisible(true);

    if (mesa.estado === 'Ocupada') {
      setCargandoCliente(true);
      const info = await MesaService.obtenerClienteDeMesa(mesa.id);
      setClienteInfo(info);
      setCargandoCliente(false);
    }
  };

  const handleAceptar = async () => {
    if (nuevoEstado === mesaModal.estado) {
      setModalVisible(false);
      return;
    }

    if (nuevoEstado === 'Libre' && mesaModal.estado === 'Ocupada') {
      const { data: asignacion } = await supabase
        .from('lista_espera')
        .select('sesion_id')
        .eq('mesa_asignada', mesaModal.id)
        .eq('estado', 'asignado')
        .maybeSingle();

      if (asignacion?.sesion_id) {
        await supabase
          .from('lista_espera')
          .delete()
          .eq('sesion_id', asignacion.sesion_id);
        await supabase
          .from('consultas')
          .delete()
          .eq('sesion_id', asignacion.sesion_id);
      }

      await MesaService.actualizarEstado(mesaModal.id, 'Libre');
    }

    setModalVisible(false);
    fetchEstadoMesas();
  };

  const handleRefreshVisual = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchEstadoMesas();
  };

  const chunkArray = (arr: any[], size: number) => {
    const chunked = [];
    for (let i = 0; i < arr.length; i += size) {
      chunked.push(arr.slice(i, i + size));
    }
    return chunked;
  };

  const renderPaginaMesas = ({ item: grupoMesas }: { item: any[] }) => {
    return (
      <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT, paddingHorizontal: 24, justifyContent: 'center' }}>
        <View className="flex-row flex-wrap justify-between">
          {grupoMesas.map((mesa) => {
            const estaLibre = mesa.estado?.toLowerCase() === 'libre';
            const CARD_WIDTH = (SCREEN_WIDTH - 64) / 2;
            const CARD_HEIGHT = (AVAILABLE_HEIGHT - 32) / 2;

            return (
              <TouchableOpacity
                key={mesa.id}
                onPress={() => handleAbrirModal(mesa)}
                activeOpacity={0.7}
                style={{ width: CARD_WIDTH, height: CARD_HEIGHT, elevation: 2, marginBottom: 16 }}
                className={`bg-secondary rounded-[28px] overflow-hidden border-2 shadow-sm ${estaLibre ? 'border-emerald-500/30' : 'border-red-500/30'
                  }`}
              >
                {/* Foto de la mesa */}
                <View className="w-full h-[50%] bg-primary/10 relative">
                  {mesa.foto ? (
                    <Image
                      source={{ uri: mesa.foto }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full justify-center items-center bg-tertiary/10">
                      <Ionicons name="camera-outline" size={32} color="#31603D/40" />
                    </View>
                  )}

                  <View className={`absolute top-2 right-2 px-2.5 py-1 rounded-full border ${estaLibre ? 'bg-emerald-100 border-emerald-400' : 'bg-red-100 border-red-400'
                    }`}>
                    <Text className={`text-[10px] font-black uppercase tracking-wider ${estaLibre ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                      {mesa.estado}
                    </Text>
                  </View>
                </View>

                {/* Detalles de la mesa */}
                <View className="p-4 justify-between flex-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-primary font-black text-lg uppercase tracking-tight">Mesa {mesa.numero}</Text>
                    {mesa.tipo?.toLowerCase() === 'vip' && (
                      <Ionicons name="star" size={14} color="#F5C065" />
                    )}
                  </View>

                  <View className="flex-row items-center mt-1">
                    <Ionicons name="people" size={13} color="#6E433D" style={{ marginRight: 5 }} />
                    <Text className="text-tertiary text-xs font-bold uppercase">
                      Capacidad: {mesa.comensales} pax
                    </Text>
                  </View>

                  <Text className="text-primary text-[10px] font-bold uppercase mt-1 tracking-widest bg-primary/5 py-1 text-center rounded-lg">
                    Tipo: {mesa.tipo}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const paginasMesas = chunkArray(mesas, 4);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      {/* ENCABEZADO PREMIUM INTEGRADO */}
      <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center justify-between shadow-2xl mb-6">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1 active:opacity-75">
            <Ionicons name="arrow-back" size={30} color="#31603D" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-primary font-black text-2xl uppercase tracking-tighter leading-none">Estado Salón</Text>
            <Text className="text-primary/70 font-bold text-[9px] uppercase tracking-widest mt-1">Monitoreo de Ocupación</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleRefreshVisual}
          className="bg-primary/10 p-2.5 rounded-full border border-primary/10 active:opacity-75"
        >
          <Ionicons name="refresh" size={20} color="#31603D" />
        </TouchableOpacity>
      </View>

      <LoadingModal visible={loading && mesas.length === 0} message="Cargando estado del salón..." />

      {(!loading || mesas.length > 0) && (
        <View className="flex-1">
          {mesas.length === 0 ? (
            <View className="px-6 justify-center items-center">
              <View className="bg-secondary p-8 rounded-3xl items-center mt-6 w-full">
                <Ionicons name="grid-outline" size={40} color="#31603D" />
                <Text className="text-primary font-bold text-center mt-3 uppercase text-xs">No hay mesas dadas de alta</Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={paginasMesas}
              keyExtractor={(item, index) => index.toString()}
              horizontal={true}
              pagingEnabled={true}
              showsHorizontalScrollIndicator={false}
              renderItem={renderPaginaMesas}
              decelerationRate="fast"
            />
          )}
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-secondary w-full max-w-sm rounded-[28px] overflow-hidden">
            {mesaModal && (
              <>
                <View className="w-full h-36 bg-primary/10 relative">
                  {mesaModal.foto ? (
                    <Image source={{ uri: mesaModal.foto }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-full justify-center items-center bg-tertiary/10">
                      <Ionicons name="camera-outline" size={40} color="#31603D/40" />
                    </View>
                  )}
                </View>

                <View className="p-5">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-primary font-black text-lg uppercase">Mesa {mesaModal.numero}</Text>
                    {mesaModal.tipo?.toLowerCase() === 'vip' && (
                      <Ionicons name="star" size={16} color="#F5C065" />
                    )}
                  </View>
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="people" size={13} color="#6E433D" style={{ marginRight: 4 }} />
                    <Text className="text-tertiary text-xs font-bold uppercase">Capacidad: {mesaModal.comensales} comensales</Text>
                  </View>

                  <View className="h-px bg-primary/10 my-3" />

                  <Text className="text-primary font-bold text-xs uppercase tracking-wider mb-2">Cliente</Text>
                  {cargandoCliente ? (
                    <View className="flex-row items-center py-2">
                      <ActivityIndicator size="small" color="#31603D" />
                      <Text className="text-tertiary text-xs font-bold ml-2">Cargando cliente...</Text>
                    </View>
                  ) : mesaModal.estado === 'Ocupada' && clienteInfo ? (
                    <View className="flex-row items-center py-2">
                      <View className="w-8 h-8 rounded-full bg-primary/10 justify-center items-center mr-3">
                        <Ionicons name="person" size={16} color="#31603D" />
                      </View>
                      <View>
                        <Text className="text-primary font-bold text-sm">{clienteInfo.nombre}</Text>
                        <Text className="text-tertiary text-[10px] font-bold uppercase">
                          {clienteInfo.esAnonimo ? 'Cliente Anónimo' : 'Cliente Registrado'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row items-center py-2">
                      <View className="w-8 h-8 rounded-full bg-primary/10 justify-center items-center mr-3">
                        <Ionicons name="person-outline" size={16} color="#31603D" />
                      </View>
                      <Text className="text-tertiary text-xs font-bold">Sin cliente</Text>
                    </View>
                  )}

                  <View className="h-px bg-primary/10 my-3" />

                  <Text className="text-primary font-bold text-xs uppercase tracking-wider mb-3">Estado</Text>
                  <View className="flex-row items-center justify-between bg-primary/5 rounded-xl px-4 py-3">
                    <Text className={`text-xs font-black uppercase tracking-wider ${nuevoEstado === 'Libre' ? 'text-emerald-600' : 'text-tertiary'}`}>Libre</Text>
                    <Switch
                      value={nuevoEstado === 'Ocupada'}
                      onValueChange={(val) => setNuevoEstado(val ? 'Ocupada' : 'Libre')}
                      trackColor={{ false: '#4ADE80', true: '#F87171' }}
                      thumbColor="#31603D"
                    />
                    <Text className={`text-xs font-black uppercase tracking-wider ${nuevoEstado === 'Ocupada' ? 'text-red-500' : 'text-tertiary'}`}>Ocupada</Text>
                  </View>

                  <View className="flex-row justify-end mt-5 gap-3">
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      className="bg-primary/10 py-3 px-6 rounded-full"
                    >
                      <Text className="text-primary font-bold text-xs uppercase">Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleAceptar}
                      className="bg-primary py-3 px-6 rounded-full"
                    >
                      <Text className="text-white font-bold text-xs uppercase">Aceptar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}