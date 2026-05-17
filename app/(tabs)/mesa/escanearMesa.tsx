import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/services/SupabaseClient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SoundService } from '@/src/services/soundService';

export default function EscanearMesaScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [mensajeError, setMensajeError] = useState<string | null>(null);
    const [mesaEsperadaId, setMesaEsperadaId] = useState<string | null>(null);
    const [numeroMesaEsperada, setNumeroMesaEsperada] = useState<string | null>(null);
    const [clienteId, setClienteId] = useState<string | null>(null);

    useEffect(() => {
        obtenerAsignacionMesa();
    }, []);

    const obtenerAsignacionMesa = async () => {
        try {
        const { data: { session } } = await supabase.auth.getSession();
        const idUsuario = session?.user?.id; 
        if (!idUsuario) return;
        setClienteId(idUsuario);
            
        const { data: asignacion, error } = await supabase
            .from('lista_espera')
            .select('mesa_asignada, estado')
            .eq('cliente_id', idUsuario)
            .eq('estado', 'asignado')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (asignacion && asignacion.mesa_asignada) {
            setMesaEsperadaId(asignacion.mesa_asignada);

            const { data: mesa } = await supabase
            .from('mesas')
            .select('numero')
            .eq('id', asignacion.mesa_asignada)
            .single();
            
            if (mesa) setNumeroMesaEsperada(mesa.numero.toString());
        }
        } catch (error) {
        console.error("Error buscando asignación de mesa:", error);
        }
    };

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        setMensajeError(null);

        try {
        const { data: mesaEscaneada, error } = await supabase
            .from('mesas')
            .select('id, numero')
            .eq('qr_data', data)
            .single();

        if (error || !mesaEscaneada) {
            throw new Error("El código QR no pertenece a ninguna mesa del sistema.");
        }

        if (!mesaEsperadaId) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await SoundService.reproducir('error');
            setMensajeError("Aún no tienes una mesa asignada por el metre. Por favor, aguarda en la lista.");
            return;
        }

        if (mesaEscaneada.id !== mesaEsperadaId) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await SoundService.reproducir('error');
            setMensajeError(`Mesa equivocada. Escaneaste la Mesa N° ${mesaEscaneada.numero}, pero debes ir a la Mesa N° ${numeroMesaEsperada || 'asignada'}.`);
            return;
        }

        await SoundService.reproducir('exito');
        
        await supabase
            .from('lista_espera')
            .update({ qr_mesa_escaneado: true })
            .eq('cliente_id', clienteId)
            .eq('estado', 'asignado');

        router.replace({
            pathname: "/(tabs)/mesa/panelMesaCliente",
            params: { mesaId: mesaEscaneada.id, numeroMesa: mesaEscaneada.numero }
        });

        } catch (err: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        await SoundService.reproducir('error');
        setMensajeError(err.message || "Error al procesar el escaneo.");
        }
    };

    if (!permission) return <View className="flex-1 bg-primary" />;
    if (!permission.granted) {
        return (
        <View className="flex-1 bg-primary justify-center items-center p-6">
            <Text className="text-white text-center font-bold mb-4 uppercase text-xs">Se necesitan permisos de cámara</Text>
            <TouchableOpacity onPress={requestPermission} className="bg-secondary px-6 py-3 rounded-2xl">
            <Text className="text-primary font-bold uppercase text-xs">Activar Cámara</Text>
            </TouchableOpacity>
        </View>
        );
    }

    return (
        <View className="flex-1 bg-primary">
        <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
        <View className="flex-1 justify-between p-6 items-center">
            <TouchableOpacity onPress={() => router.back()} className="self-start bg-secondary/90 p-3 rounded-full mt-6">
            <Ionicons name="arrow-back" size={20} color="#31603D" />
            </TouchableOpacity>
            <View className="w-64 h-64 border-4 border-tertiary rounded-[35px] bg-transparent" />
            <View className="w-full mb-6">
            {mensajeError ? (
                <View className="bg-red-500/95 p-5 rounded-[24px] border border-red-600">
                <Text className="text-white text-xs font-semibold leading-5">{mensajeError}</Text>
                <TouchableOpacity onPress={() => { setScanned(false); setMensajeError(null); }} className="bg-white/20 mt-3 py-2 rounded-xl items-center">
                    <Text className="text-white font-bold text-xs uppercase">Escanear de Nuevo</Text>
                </TouchableOpacity>
                </View>
            ) : (
                <View className="bg-secondary/95 p-4 rounded-[24px] items-center border border-tertiary/20">
                <Text className="text-primary font-bold uppercase text-xs tracking-widest">Apunta al código QR de tu mesa</Text>
                </View>
            )}
            </View>
        </View>
        </View>
    );
}