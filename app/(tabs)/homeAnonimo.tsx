import { useToast } from "@/src/context/ToastContext";
import { ListaEsperaService } from '@/src/services/listaEsperaService';
import { SoundService } from '@/src/services/soundService';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function HomeAnonimoScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { anonimoId, anonimoNombre, anonimoFoto } = useLocalSearchParams();
    
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    // Solicitamos los permisos de la cámara al entrar
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
        const valorEsperadoQR = "RISTODELI_ENTRADA"; 

        if (data !== valorEsperadoQR) {
        SoundService.reproducir('error'); 
        showToast("error", "Código Inválido", "Este QR no corresponde a la entrada de Ristodeli.");
        
        // Dejamos pasar 2 segundos y habilitamos el escáner otra vez por si quiere reintentar
        setTimeout(() => setScanned(false), 2000);
        return;
        }

        // Si el QR es el correcto, procedemos al alta en la lista de espera
        setLoading(true);
        try {
        await ListaEsperaService.agregarClienteAnonimo({
            nombre: String(anonimoNombre),
            foto: String(anonimoFoto),
            clienteId: String(anonimoId),
        });

        await SoundService.reproducir('exito');
        showToast("success", "¡Anunciado!", "Te has unido a la lista de espera con éxito.");

        // 🔀 REDIRECCIÓN AUTOMÁTICA a la nueva vista con las acciones destrabadas
        router.replace({
            pathname: "/(tabs)/panelAccionesAnonimo",
            params: { anonimoNombre, anonimoFoto, anonimoId }
        });

        } catch (error: any) {
        SoundService.reproducir('error');
        showToast("error", "Error", error.message || "No se pudo procesar el ingreso.");
        setScanned(false);
        } finally {
        setLoading(false);
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

        {/* 📸 CÁMERA NATIVA ACTIVA OCUPANDO EL ESPACIO CENTRAL */}
        <View className="flex-1 overflow-hidden relative justify-center items-center">
            <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
                barcodeTypes: ["qr"],
            }}
            />
            
            {/* Cuadro de enfoque estético para guiar al usuario */}
            <View className="w-64 h-64 border-4 border-tertiary rounded-3xl opacity-70 animate-pulse" />
        </View>
        </View>
    );
}