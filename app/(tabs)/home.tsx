import { useToast } from "@/src/context/ToastContext";
import { supabase } from '@/src/services/SupabaseClient';
import { SoundService } from '@/src/services/soundService';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function HomeClienteRegistradoScreen() {
    const router = useRouter();
    const { showToast } = useToast();

    const { usuarioId, usuarioNombre, usuarioFoto } = useLocalSearchParams();
    
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
            <Text className="text-secondary font-bold text-center uppercase mb-4">
            Se necesitan permisos de cámara para escanear el QR de entrada
            </Text>
        </View>
        );
    }

    const handleBarcodeScanned = async ({ data }: { data: string }) => {
        if (scanned || loading) return;
        setScanned(true);

        // 🌟 VALIDACIÓN: Usamos el string exacto que le saca la ficha a tu QR
        const esQRValido = data === "RISTODELI_ENTRADA"; 

        if (!esQRValido) {
        SoundService.reproducir('error');
        showToast("error", "Código Inválido", "Este QR no corresponde a la entrada de Ristodeli.");
        setTimeout(() => setScanned(false), 3000);
        return;
        }

        setLoading(true);
        try {
        // Insertamos en la lista de espera unificada cumpliendo tus restricciones
        const { error } = await supabase
            .from('lista_espera')
            .insert([{ 
            nombre: usuarioNombre || 'Cliente Registrado',
            foto: usuarioFoto || '',
            estado: 'pendiente',      
            tipo: 'registrado',       // 🌟 IMPORTANTE: Pasamos 'registrado' (tu check constraint lo exige)
            cliente_id: usuarioId,    // ID de la tabla usuarios
            mesa_asignada: null,
            qr_mesa_escaneado: false
            }]);

        if (error) throw error;

        await SoundService.reproducir('exito');
        showToast("success", "¡Anunciado!", "Te has unido a la lista de espera. El Metre te asignará una mesa pronto.");

        // 🔀 REDIRECCIÓN AUTOMÁTICA a su panel de acciones exclusivo
        router.replace({
            pathname: "/(tabs)/panelAccionesCliente",
            params: { usuarioNombre, usuarioFoto, usuarioId }
        });

        } catch (error: any) {
        SoundService.reproducir('error');
        showToast("error", "Error", error.message || "No se pudo procesar tu ingreso a la lista.");
        setScanned(false);
        } finally {
        setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-primary">
        {loading && (
            <View className="flex-1 justify-center items-center bg-black/50 absolute inset-0 z-50">
            <ActivityIndicator size="large" color="#F5C065" />
            <Text className="text-secondary font-bold mt-4 uppercase text-xs">Procesando Entrada...</Text>
            </View>
        )}

        <View className="p-6 pt-12 bg-secondary border-b border-tertiary/20 items-center">
            <Text className="text-primary font-black text-base uppercase tracking-wider">¡Hola! Escanea para Ingresar</Text>
            <Text className="text-primary/60 text-xs mt-1 text-center font-medium">Escanea el QR de la entrada para solicitar mesa</Text>
        </View>

        <View className="flex-1 overflow-hidden relative justify-center items-center">
            <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />
            <View className="w-64 h-64 border-4 border-tertiary rounded-3xl opacity-70" />
        </View>
        </View>
    );
}