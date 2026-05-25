import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Modal, Switch, ActivityIndicator } from 'react-native';
import { supabase } from '@/src/services/SupabaseClient';
import { MesaService } from '@/src/services/mesaService';
import LoadingModal from '@/src/components/LoadingModal';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

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

  return (
    <View className="flex-1 bg-primary px-6 pt-12">
      {/* Cabecera / Boton Volver */}
      <View className="flex-row justify-between items-center mb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center bg-secondary py-2 px-4 rounded-full border border-tertiary/10"
        >
          <Ionicons name="arrow-back" size={18} color="#31603D" style={{ marginRight: 6 }} />
          <Text className="text-primary font-bold text-xs uppercase">Volver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRefreshVisual}
          className="bg-secondary p-2 rounded-full border border-tertiary/10"
        >
          <Ionicons name="refresh" size={18} color="#31603D" />
        </TouchableOpacity>
      </View>

      <Text className="text-white text-2xl font-black uppercase tracking-wider mb-2">Estado del Salón</Text>
      <Text className="text-tertiary text-xs uppercase font-bold mb-6 tracking-widest">Monitoreo de Ocupación</Text>

      <LoadingModal visible={loading && mesas.length === 0} message="Cargando estado del salón..." />

      {(!loading || mesas.length > 0) && (
        <FlatList
          data={mesas}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="bg-secondary p-8 rounded-3xl items-center mt-6 w-full">
              <Ionicons name="grid-outline" size={40} color="#31603D" />
              <Text className="text-primary font-bold text-center mt-3 uppercase text-xs">No hay mesas dadas de alta</Text>
            </View>
          }
          renderItem={({ item }) => {
            const estaLibre = item.estado?.toLowerCase() === 'libre';

            return (
              <TouchableOpacity
                onPress={() => handleAbrirModal(item)}
                activeOpacity={0.7}
                style={{ elevation: 2 }}
                className={`bg-secondary w-[48%] mb-5 rounded-[28px] overflow-hidden border-2 shadow-sm ${estaLibre ? 'border-emerald-500/30' : 'border-red-500/30'
                  }`}
              >
                <View className="w-full h-28 bg-primary/10 relative">
                  {item.foto ? (
                    <Image
                      source={{ uri: item.foto }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full justify-center items-center bg-tertiary/10">
                      <Ionicons name="camera-outline" size={32} color="#31603D/40" />
                    </View>
                  )}

                  <View className={`absolute top-2 right-2 px-2 py-1 rounded-full border ${estaLibre ? 'bg-emerald-100 border-emerald-400' : 'bg-red-100 border-red-400'
                    }`}>
                    <Text className={`text-[9px] font-black uppercase tracking-wider ${estaLibre ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                      {item.estado}
                    </Text>
                  </View>
                </View>

                <View className="p-4 bg-secondary">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-primary font-black text-base uppercase">Mesa {item.numero}</Text>
                    {item.tipo?.toLowerCase() === 'vip' && (
                      <Ionicons name="star" size={14} color="#F5C065" />
                    )}
                  </View>

                  <View className="flex-row items-center mt-0.5">
                    <Ionicons name="people" size={12} color="#6E433D" style={{ marginRight: 4 }} />
                    <Text className="text-tertiary text-[11px] font-bold uppercase">
                      Capacidad: {item.comensales}
                    </Text>
                  </View>

                  <Text className="text-primary text-[9px] font-bold uppercase mt-2 tracking-widest bg-primary/5 align-middle py-1 text-center rounded-lg">
                    Tipo: {item.tipo}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
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
    </View>
  );
}