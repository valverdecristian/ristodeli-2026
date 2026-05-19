// app/(tabs)/homeAnonimo.tsx
import { useToast } from "@/src/context/ToastContext";
import { SoundService } from '@/src/services/soundService';
import { supabase } from '@/src/services/SupabaseClient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function HomeAnonimoScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    
    const { clienteId, nombre: nombreCliente } = useLocalSearchParams<{ clienteId?: string; nombre?: string }>();

    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    if (!permission) {
        return (
            <View className="flex-1 bg-primary justify-center items-center">
                <ActivityIndicator size="large" color="#F5C065" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View className="flex-1 bg-primary justify-center items-center p-6">
                <Text className="text-secondary font-bold text-center uppercase mb-4 text-xs">
                    Se necesitan permisos de cámara para escanear el QR de entrada
                </Text>
            </View>
        );
    }

    const handleBarcodeScanned = async ({ data }: { data: string }) => {
        if (scanned || loading) return;
        setScanned(true);
        
        const valorEsperadoQR = "RISTODELI_ENTRADA";

        if (data !== valorEsperadoQR) {
            SoundService.reproducir('error');
            showToast("error", "Código Inválido", "Este QR no corresponde a la entrada de Ristodeli.");
            
            setTimeout(() => setScanned(false), 2000);
            return;
        }

        setLoading(true);
        try {
            console.log('[HOME_ANON] Insertando en lista_espera para id:', clienteId);
            
            const { error } = await supabase
                .from('lista_espera')
                .insert([{
                    nombre: nombreCliente || 'Cliente Express',
                    foto: '',
                    estado: 'pendiente',
                    tipo: 'anonimo',
                    cliente_id: clienteId || null, 
                    mesa_asignada: null,
                    qr_mesa_escaneado: false
                }]);

            if (error) throw error;

            await SoundService.reproducir('exito');
            showToast("success", "¡Anunciado!", "Te has unido a la lista de espera con éxito.");

            // 🚀 CORRECCIÓN 1: Apagamos el loader inmediatamente al terminar el proceso exitoso
            setLoading(false);

            // 🚀 CORRECCIÓN 2: Ruta limpia sin el prefijo del grupo '(tabs)'
            router.replace({
                pathname: "/panelAccionesAnonimo" as any, 
                params: { clienteId: clienteId } 
            });

        } catch (error: any) {
            console.log('[HOME_ANON] Error al insertar en lista_espera:', error);
            SoundService.reproducir('error');
            showToast("error", "Error", error.message || "No se pudo procesar el ingreso.");
            
            // Si explota, también nos aseguramos de apagar el loading y rehabilitar la cámara
            setLoading(false);
            setScanned(false);
        }
    };

    return (
        <View className="flex-1 bg-primary">
            {loading ? (
                <View className="flex-1 justify-center items-center bg-black/50 absolute inset-0 z-50">
                    <ActivityIndicator size="large" color="#F5C065" />
                    <Text className="text-secondary font-bold mt-4 uppercase text-xs tracking-wider">Procesando Entrada...</Text>
                </View>
            ) : null}

            <View className="p-6 pt-12 bg-secondary border-b border-tertiary/20 items-center">
                <Text className="text-primary font-black text-base uppercase tracking-wider">Escanea el QR de Entrada</Text>
                <Text className="text-primary/60 text-xs mt-1 text-center font-medium">Anúnciate para ingresar a la lista de espera del Metre</Text>
            </View>

            <View className="flex-1 overflow-hidden relative justify-center items-center">
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                />

                <View className="w-64 h-64 border-4 border-tertiary rounded-3xl opacity-70" />
            </View>
        </View>
    );
}