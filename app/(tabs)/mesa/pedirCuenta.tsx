import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/src/services/SupabaseClient';
import { SoundService } from '@/src/services/soundService';
import { useToast } from '@/src/context/ToastContext';
import { MesaService } from '@/src/services/mesaService';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingModal from '@/src/components/LoadingModal';

interface PedidoConsumo {
    id: string;
    producto_nombre: string;
    categoria: string;
    cantidad: number;
    estado: string;
    precio: number;
}

export default function PedirCuentaScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { mesaId, numeroMesa, clienteId, sesion_id } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [consumos, setConsumos] = useState<PedidoConsumo[]>([]);
    const [subtotal, setSubtotal] = useState(0);

    // Descuento
    const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
    const [descuentoJuego, setDescuentoJuego] = useState('');

    // Propina
    const [propinaPorcentaje, setPropinaPorcentaje] = useState(0);
    const [propinaNivel, setPropinaNivel] = useState('Sin propina');
    const [mostrarCamara, setMostrarCamara] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    const nroMesaInt = (numeroMesa && !isNaN(parseInt(numeroMesa as string, 10)))
        ? parseInt(numeroMesa as string, 10)
        : parseInt(mesaId as string, 10) || 21;

    useEffect(() => {
        cargarDetallesCuenta();
    }, [mesaId, nroMesaInt]);

    const cargarDetallesCuenta = async () => {
        try {
            setLoading(true);

            if (sesion_id) {
                const key = `ristodeli_juegos_sesion_${sesion_id}`;
                const json = await AsyncStorage.getItem(key);
                if (json) {
                    const state = JSON.parse(json);
                    if (state.descuentoGanado > 0 && state.juegoGanador) {
                        setDescuentoPorcentaje(state.descuentoGanado);
                        const nombresJuegos: { [key: string]: string } = {
                            tateti: "Tateti",
                            adivinanza: "Adivinanza",
                            memoria: "Memoria"
                        };
                        setDescuentoJuego(nombresJuegos[state.juegoGanador] || state.juegoGanador);
                    }
                }
            }

            let sessionStart = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(); // Fallback 4 horas
            if (mesaId) {
                const { data: asignacion } = await supabase
                    .from('lista_espera')
                    .select('created_at')
                    .eq('mesa_asignada', mesaId)
                    .eq('estado', 'asignado')
                    .maybeSingle();

                if (asignacion?.created_at) {
                    sessionStart = asignacion.created_at;
                }
            }

            const { data: pedidos, error: errPedidos } = await supabase
                .from('pedidos')
                .select('*')
                .eq('mesa_numero', nroMesaInt)
                .gte('created_at', sessionStart)
                .not('estado', 'ilike', '%rechazado%')
                .not('estado', 'ilike', '%cancelado%');

            if (errPedidos) throw errPedidos;

            const { data: productos, error: errProd } = await supabase
                .from('productos')
                .select('nombre, precio');

            if (errProd) throw errProd;

            const mapPrecios = new Map<string, number>();
            productos?.forEach(p => mapPrecios.set(p.nombre.toLowerCase().trim(), p.precio));

            let acumulado = 0;
            const consumosMapeados: PedidoConsumo[] = (pedidos || [])
                .filter(p => p.categoria !== 'descuento' && p.categoria !== 'propina')
                .map(p => {
                    const precio = mapPrecios.get(p.producto_nombre.toLowerCase().trim()) || 0;
                    acumulado += p.cantidad * precio;
                    return {
                        id: p.id,
                        producto_nombre: p.producto_nombre,
                        categoria: p.categoria,
                        cantidad: p.cantidad,
                        estado: p.estado,
                        precio
                    };
                });

            setConsumos(consumosMapeados);
            setSubtotal(acumulado);

        } catch (error: any) {
            console.error('[CUENTA] Error al cargar consumos:', error);
            showToast('error', 'Error al cargar', 'No se pudieron cargar los consumos de tu mesa.');
        } finally {
            setLoading(false);
        }
    };

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);

        const url = data.trim().toLowerCase();
        console.log('[SCANNER_PROPINA] Escaneado:', url);

        let porcentaje = 0;
        let nivel = 'Sin propina';
        let exito = false;

        if (url.includes('/excelente') || url === 'excelente') {
            porcentaje = 20;
            nivel = 'Excelente (20%)';
            exito = true;
        } else if (url.includes('/muy_bueno') || url === 'muy_bueno') {
            porcentaje = 15;
            nivel = 'Muy Bueno (15%)';
            exito = true;
        } else if (url.includes('/bueno') || url === 'bueno') {
            porcentaje = 10;
            nivel = 'Bueno (10%)';
            exito = true;
        } else if (url.includes('/regular') || url === 'regular') {
            porcentaje = 5;
            nivel = 'Regular (5%)';
            exito = true;
        } else if (url.includes('/malo') || url === 'malo') {
            porcentaje = 0;
            nivel = 'Malo (0%)';
            exito = true;
        }

        if (exito) {
            await SoundService.reproducir('exito');
            setPropinaPorcentaje(porcentaje);
            setPropinaNivel(nivel);
            showToast('success', 'Propina Seleccionada', `Agregaste un ${porcentaje}% de propina.`);
            setMostrarCamara(false);
            setScanned(false);
        } else {
            await SoundService.reproducir('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showToast('error', 'Código Inválido', 'El QR escaneado no corresponde a una propina válida.');
            setScanned(false);
        }
    };

    const solicitarCuenta = async () => {
        if (consumos.length === 0) {
            await SoundService.reproducir('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showToast('error', 'Sin consumos', 'No se registran consumos para solicitar la cuenta.');
            return;
        }

        try {
            setSubmitting(true);

            if (descuentoPorcentaje > 0) {
                const { error: errDesc } = await supabase
                    .from('pedidos')
                    .insert([{
                        mesa_numero: nroMesaInt,
                        producto_nombre: `Descuento: ${descuentoPorcentaje}% (${descuentoJuego})`,
                        categoria: 'descuento',
                        cantidad: descuentoPorcentaje,
                        estado: 'Entregado'
                    }]);
                if (errDesc) throw errDesc;
            }

            const { error: errProp } = await supabase
                .from('pedidos')
                .insert([{
                    mesa_numero: nroMesaInt,
                    producto_nombre: `Propina: ${propinaPorcentaje}% (${propinaNivel})`,
                    categoria: 'propina',
                    cantidad: propinaPorcentaje,
                    estado: 'Entregado'
                }]);
            if (errProp) throw errProp;

            if (mesaId) {
                await MesaService.actualizarEstado(mesaId as string, 'Pidiendo Cuenta');
            }

            await SoundService.reproducir('exito');
            showToast('success', 'Cuenta Solicitada', 'El Mozo vendrá pronto con el cobro. ¡Gracias!');
            router.back();

        } catch (error: any) {
            console.error('[CUENTA] Error al solicitar la cuenta:', error);
            await SoundService.reproducir('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showToast('error', 'Error de Conexión', 'No pudimos procesar tu solicitud de cuenta. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    const descuentoMonto = subtotal * (descuentoPorcentaje / 100);
    const propinaMonto = subtotal * (propinaPorcentaje / 100);
    const totalNeto = subtotal - descuentoMonto + propinaMonto;

    if (mostrarCamara) {
        if (!permission) return <View className="flex-1 bg-primary" />;
        if (!permission.granted) {
            return (
                <View className="flex-1 bg-primary justify-center items-center p-6">
                    <Text className="text-white text-center font-bold mb-4 uppercase text-xs">Permisos de cámara requeridos</Text>
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
                    <TouchableOpacity onPress={() => setMostrarCamara(false)} className="self-start bg-secondary/90 p-3 rounded-full mt-6">
                        <Ionicons name="close" size={20} color="#31603D" />
                    </TouchableOpacity>
                    <View className="w-64 h-64 border-4 border-tertiary rounded-[35px] bg-transparent" />
                    <View className="bg-secondary/95 p-4 rounded-[24px] items-center border border-tertiary/20 mb-6 w-full">
                        <Text className="text-primary font-bold uppercase text-xs tracking-widest text-center">Apunta al QR de Propina del Local</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-primary">
            <LoadingModal visible={submitting} message="Solicitando cuenta..." />

            <View className="px-6 pt-4 flex-row items-center">
                <TouchableOpacity
                    onPress={async () => {
                        await SoundService.reproducir('exito');
                        router.back();
                    }}
                    className="flex-row items-center bg-secondary/20 py-2 px-4 rounded-full border border-tertiary/20 mr-4"
                >
                    <Ionicons name="arrow-back" size={16} color="#F5C065" style={{ marginRight: 6 }} />
                    <Text className="text-secondary font-bold text-xs uppercase">Volver</Text>
                </TouchableOpacity>

                <Text className="text-secondary font-black text-lg uppercase">
                    Resumen de Consumo
                </Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#F5C065" />
                    <Text className="text-secondary font-bold mt-4 text-xs uppercase">Cargando consumos...</Text>
                </View>
            ) : (
                <ScrollView className="flex-1 px-6 mt-6" showsVerticalScrollIndicator={false}>
                    <View className="bg-secondary p-5 rounded-3xl border border-tertiary/15 shadow-sm mb-6">
                        <Text className="text-primary font-black uppercase text-center text-xs tracking-widest mb-4">
                            Mesa N° {numeroMesa || nroMesaInt} - Detalle de Cuenta
                        </Text>

                        {/* Listado de Productos */}
                        <View className="space-y-3 mb-4">
                            {consumos.map((item) => (
                                <View key={item.id} className="flex-row justify-between items-center py-2 border-b border-primary/5">
                                    <View className="flex-1 pr-2">
                                        <Text className="text-primary font-bold text-sm">{item.producto_nombre}</Text>
                                        <Text className="text-primary/50 text-[10px] uppercase font-bold">Cantidad: {item.cantidad}</Text>
                                    </View>
                                    <Text className="text-primary font-black text-sm">${item.precio * item.cantidad}</Text>
                                </View>
                            ))}

                            {consumos.length === 0 && (
                                <Text className="text-primary/40 text-center py-6 font-bold uppercase text-xs">No hay consumos activos</Text>
                            )}
                        </View>

                        {/* Subtotal */}
                        <View className="flex-row justify-between items-center pt-2 border-t-2 border-primary/10">
                            <Text className="text-primary font-bold text-sm uppercase">Subtotal</Text>
                            <Text className="text-primary font-black text-base">${subtotal}</Text>
                        </View>
                    </View>

                    {/* Descuentos y Propinas */}
                    <View className="bg-secondary p-5 rounded-3xl border border-tertiary/15 shadow-sm mb-6 space-y-4">
                        <Text className="text-primary font-black uppercase text-center text-xs tracking-widest mb-2">Descuentos y Propinas</Text>

                        {/* Descuento Juego */}
                        <View className="flex-row justify-between items-center py-1">
                            <View>
                                <Text className="text-primary font-bold text-xs uppercase">Descuento de Juegos</Text>
                                <Text className="text-primary/50 text-[9px] font-bold uppercase">
                                    {descuentoPorcentaje > 0 ? `Ganado en ${descuentoJuego}` : 'Sin descuento activo'}
                                </Text>
                            </View>
                            <Text className={`font-black text-sm ${descuentoPorcentaje > 0 ? 'text-emerald-600' : 'text-primary/40'}`}>
                                {descuentoPorcentaje > 0 ? `-${descuentoPorcentaje}%` : '$0'}
                            </Text>
                        </View>

                        {/* Propina */}
                        <View className="flex-row justify-between items-center py-1 border-t border-primary/5 pt-3">
                            <View>
                                <Text className="text-primary font-bold text-xs uppercase">Propina</Text>
                                <Text className="text-primary/50 text-[9px] font-bold uppercase">{propinaNivel}</Text>
                            </View>
                            <Text className={`font-black text-sm ${propinaPorcentaje > 0 ? 'text-primary' : 'text-primary/40'}`}>
                                {propinaPorcentaje > 0 ? `+${propinaPorcentaje}%` : '$0'}
                            </Text>
                        </View>

                        {/* Boton Scanner de Propina */}
                        <TouchableOpacity
                            onPress={async () => {
                                await SoundService.reproducir('exito');
                                setMostrarCamara(true);
                            }}
                            activeOpacity={0.8}
                            className="w-full bg-primary/10 border border-primary py-3 rounded-2xl items-center justify-center flex-row mt-2"
                        >
                            <Ionicons name="qr-code-outline" size={16} color="#31603D" style={{ marginRight: 6 }} />
                            <Text className="text-primary font-bold uppercase text-xs tracking-wide">
                                Escanear QR de Propina
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Resumen Total */}
                    <View className="bg-secondary p-5 rounded-3xl border border-tertiary/15 shadow-sm mb-12">
                        <View className="space-y-2 mb-4">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-primary/70 text-xs font-semibold uppercase">Subtotal Consumido</Text>
                                <Text className="text-primary/70 text-xs font-bold">${subtotal}</Text>
                            </View>
                            {descuentoPorcentaje > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-emerald-600 text-xs font-semibold uppercase">Descuento ({descuentoPorcentaje}%)</Text>
                                    <Text className="text-emerald-600 text-xs font-bold">-${descuentoMonto.toFixed(2)}</Text>
                                </View>
                            )}
                            {propinaPorcentaje > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-primary text-xs font-semibold uppercase">Propina ({propinaPorcentaje}%)</Text>
                                    <Text className="text-primary text-xs font-bold">+${propinaMonto.toFixed(2)}</Text>
                                </View>
                            )}
                        </View>

                        <View className="h-px bg-primary/10 w-full my-3" />

                        <View className="flex-row justify-between items-center">
                            <Text className="text-primary font-black text-base uppercase">Total a Pagar</Text>
                            <Text className="text-primary font-black text-xl">${totalNeto.toFixed(2)}</Text>
                        </View>

                        {/* Boton Solicitar Cuenta */}
                        <TouchableOpacity
                            onPress={solicitarCuenta}
                            activeOpacity={0.9}
                            className="w-full bg-primary py-4 rounded-[22px] items-center justify-center border-b-4 border-[#1E3D25] shadow-lg mt-6"
                        >
                            <Text className="text-secondary font-black uppercase text-sm tracking-wider">
                                Confirmar y Solicitar Cuenta
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
