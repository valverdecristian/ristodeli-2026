import { supabase } from '@/src/services/SupabaseClient';
import { ListaEsperaService } from '@/src/services/listaEsperaService';
import { MesaService } from '@/src/services/mesaService';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EscanearMesaScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [mensajeError, setMensajeError] = useState<string | null>(null);
    const [mesaEsperadaId, setMesaEsperadaId] = useState<string | null>(null);
    const [numeroMesaEsperada, setNumeroMesaEsperada] = useState<string | null>(null);
    const [clienteId, setClienteId] = useState<string | null>(null);

    const { clienteId: paramClienteId } = useLocalSearchParams<{ clienteId?: string }>();

    useEffect(() => {
        obtenerAsignacionMesa();
    }, [paramClienteId]);

    const obtenerAsignacionMesa = async () => {
        try {
            let idUsuario: string | null | undefined = null;

            if (paramClienteId) {
                idUsuario = paramClienteId;
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                idUsuario = session?.user?.id;
            }

            if (!idUsuario) return;
            setClienteId(idUsuario);

            const mesaAsignadaId = await ListaEsperaService.obtenerAsignacionActiva(idUsuario);

            if (mesaAsignadaId) {
                setMesaEsperadaId(mesaAsignadaId);
                const numero = await MesaService.obtenerNumeroPorId(mesaAsignadaId);
                if (numero !== null) setNumeroMesaEsperada(numero.toString());
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
            const qrLimpio = data.trim();
            console.log('[SCANNER_MESA] Procesando código leído:', qrLimpio);

            const esUUIDValido = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(qrLimpio);
            let query = supabase.from('mesas').select('*');
            if (esUUIDValido) {
                query = query.or(`id.eq.${qrLimpio},qr_data.eq.${qrLimpio}`);
            } else {
                query = query.eq('qr_data', qrLimpio);
            }
            const { data: mesaEscaneada, error: dbError } = await query.maybeSingle();

            if (dbError) {
                console.error("[SCANNER_MESA] Error en Supabase:", dbError);
                throw new Error(`Error de base de datos: ${dbError.message}`);
            }

            if (!mesaEscaneada) {
                throw new Error("El código QR escaneado no pertenece a ninguna mesa de este restaurante.");
            }

            console.log('[SCANNER_MESA] ¡Mesa asociada exitosamente! Número:', mesaEscaneada.numero);

            if (!mesaEsperadaId) {
                throw new Error("No tienes una mesa asignada en este momento. Por favor, únete a la lista de espera en la entrada.");
            }

            if (mesaEscaneada.id !== mesaEsperadaId) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                await SoundService.reproducir('error');
                setMensajeError(`Mesa equivocada. Escaneaste la Mesa N° ${mesaEscaneada.numero}, pero debías ir a la Mesa N° ${numeroMesaEsperada || 'asignada'}.`);
                return;
            }

            await SoundService.reproducir('exito');
            if (clienteId) await ListaEsperaService.confirmarEscaneoMesa(clienteId);

            const sesionId = clienteId ? await ListaEsperaService.obtenerSesionActiva(mesaEscaneada.id) : null;

            router.replace({
                pathname: "/(tabs)/mesa/panelMesaCliente" as any,
                params: { mesaId: mesaEscaneada.id, numeroMesa: mesaEscaneada.numero, clienteId, sesion_id: sesionId || undefined }
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