import { useToast } from "@/src/context/ToastContext";
import { supabase } from '@/src/services/SupabaseClient';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router'; // 🌟 Importamos useFocusEffect
import React, { useCallback, useState } from 'react'; // 🌟 Importamos useCallback
import { ActivityIndicator, FlatList, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ClientePendiente {
    id: string;
    nombres: string;
    apellidos: string;
    foto_url: string;
    email: string;
}

export default function AprobacionClientesScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const [clientes, setClientes] = useState<ClientePendiente[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');

    // 1. CARGAR CLIENTES PENDIENTES DE APROBACIÓN
    const obtenerClientesPendientes = async () => {
        try {
          const { data, error } = await supabase
            .from('usuarios')
            .select('id, nombres, apellidos, foto_url, email')
            .eq('perfil', 'cliente_pendiente'); // Filtramos por rol pendiente
    
          if (error) throw error;
          setClientes(data || []);
        } catch (error) {
          console.error(error);
        }
    };
    
    // 🌟 EL TRUCO CLAVE: useFocusEffect se ejecuta SIEMPRE que el usuario entra a la pantalla,
    // incluso si vuelve de atrás usando router.back()
    useFocusEffect(
        useCallback(() => {
            obtenerClientesPendientes();
        }, [])
    );
    
    // 2. PROCESAMOS EL CAMBIO DE PERFIL (APROBAR O RECHAZAR)
    const procesarCliente = async (cliente: ClientePendiente, decision: 'aprobar' | 'rechazar') => {
        setLoadingText(decision === 'aprobar' ? 'Aprobando cuenta...' : 'Rechazando cuenta...');
        setLoading(true);
    
        const nuevoPerfil = decision === 'aprobar' ? 'cliente' : 'cliente_rechazado'; //
    
        try {
          // Ejecutamos el update y le pedimos que nos devuelva la fila afectada (.select())
          const { data, error: dbError } = await supabase
            .from('usuarios')
            .update({ perfil: nuevoPerfil }) //
            .eq('id', cliente.id)
            .select(); // 🌟 CLAVE: Obliga a Supabase a retornar el registro modificado
    
          if (dbError) throw dbError;

          // 🚨 SI DATA VIENE VACÍO, ES PORQUE EL RLS BLOQUEÓ LA ACTUALIZACIÓN
          if (!data || data.length === 0) {
            throw new Error("Permiso denegado por políticas RLS. El registro no se modificó.");
          }
    
          // 🔊 Feedback multimedia de éxito si pasó el RLS
          await SoundService.reproducir('exito');
          
          showToast(
            "success", 
            decision === 'aprobar' ? "Cliente Aceptado" : "Cliente Rechazado", 
            `${cliente.apellidos}, ${cliente.nombres} ahora tiene perfil de ${nuevoPerfil}.`
          );
    
          // Refrescamos la lista local inmediatamente
          setClientes(prev => prev.filter(c => c.id !== cliente.id));
    
        } catch (error: any) {
          // 🔊 Si falla, chilla el celular con sonido de error y vibración
          SoundService.reproducir('error'); 
          showToast("error", "Error de operación", error.message || "No se pudo actualizar el perfil.");
          console.error("Detalle del fallo:", error);
        } finally {
          setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-primary px-6 pt-4">
        {/* MODAL DE ESPERA REQUERIDO CON LOGO */}
        <Modal transparent visible={loading} animationType="fade">
            <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-primary p-10 rounded-3xl items-center border-2 border-tertiary shadow-2xl w-[80%]">
                <View className="bg-secondary rounded-full p-2 mb-4 border border-tertiary">
                <Image source={require('@/assets/images/icon.png')} className="w-12 h-12" resizeMode="contain" />
                </View>
                <ActivityIndicator size="large" color="#F5C065" />
                <Text className="text-secondary font-bold mt-4 text-base text-center">{loadingText}</Text>
            </View>
            </View>
        </Modal>

        {/* ENCABEZADO CON BOTÓN DE REGRESO */}
        <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1 active:opacity-70">
                <Ionicons name="arrow-back-outline" size={28} color="#31603D" />
            </TouchableOpacity>
            <Text className="text-secondary font-bold text-2xl uppercase tracking-tight">
                Clientes Pendientes
            </Text>
        </View>

        {clientes.length === 0 ? (
            <View className="flex-1 justify-center items-center">
            <Ionicons name="checkmark-circle-outline" size={64} color="#31603D" />
            <Text className="text-secondary font-bold text-center mt-4 text-base uppercase">
                No hay solicitudes pendientes
            </Text>
            </View>
        ) : (
            <FlatList
            data={clientes}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
                <View className="bg-secondary rounded-[25px] p-4 flex-row items-center justify-between mb-4 border border-tertiary/20 shadow-md">
                
                <Image 
                    source={{ uri: item.foto_url }} 
                    className="w-20 h-20 rounded-2xl border-2 border-tertiary"
                    resizeMode="cover"
                />

                <View className="flex-1 mx-4">
                    <Text className="text-primary font-bold text-base uppercase leading-tight" numberOfLines={1}>
                    {item.apellidos}
                    </Text>
                    <Text className="text-primary font-semibold text-sm text-gray-700 uppercase" numberOfLines={1}>
                    {item.nombres}
                    </Text>
                    <Text className="text-tertiary text-[11px] font-bold mt-1" numberOfLines={1}>
                    {item.email}
                    </Text>
                </View>

                <View className="flex-col justify-between h-20">
                    <TouchableOpacity
                    onPress={() => procesarCliente(item, 'aprobar')} 
                    className="bg-tertiary p-2.5 rounded-xl border-b-2 border-orange items-center justify-center active:opacity-80 mb-2"
                    >
                    <Ionicons name="checkmark-outline" size={20} color="#31603D" />
                    </TouchableOpacity>

                    <TouchableOpacity
                    onPress={() => procesarCliente(item, 'rechazar')}
                    className="bg-red-500 p-2.5 rounded-xl border-b-2 border-red-700 items-center justify-center active:opacity-80"
                    >
                    <Ionicons name="close-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                </View>
            )}
            />
        )}
        </SafeAreaView>
    );
}