import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/services/SupabaseClient';
import { SoundService } from '@/src/services/soundService';
import { useToast } from '@/src/context/ToastContext';
import { MesaService } from '@/src/services/mesaService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingModal from '@/src/components/LoadingModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MesaCobro {
    id: string;
    numero: number;
    estado: string;
    foto?: string;
}

interface ItemDetalle {
    id: string;
    producto_nombre: string;
    categoria: string;
    cantidad: number;
    precio: number;
}

export default function CobrarCuentaScreen() {
    const router = useRouter();
    const { showToast } = useToast();

    const [loadingMesas, setLoadingMesas] = useState(true);
    const [mesas, setMesas] = useState<MesaCobro[]>([]);

    // Detalles de cobro seleccionados
    const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaCobro | null>(null);
    const [clienteNombre, setClienteNombre] = useState('Cliente');
    const [sesionId, setSesionId] = useState('');
    const [cargandoDetalles, setCargandoDetalles] = useState(false);
    const [submittingPago, setSubmittingPago] = useState(false);

    // Valores calculados
    const [itemsConsumo, setItemsConsumo] = useState<ItemDetalle[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
    const [descuentoInfo, setDescuentoInfo] = useState('');
    const [propinaPorcentaje, setPropinaPorcentaje] = useState(0);
    const [propinaInfo, setPropinaInfo] = useState('');

    useEffect(() => {
        cargarMesasPendientes();

        const channel = supabase
            .channel('mesas_cobro_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, () => {
                cargarMesasPendientes();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const cargarMesasPendientes = async () => {
        try {
            setLoadingMesas(true);
            const { data, error } = await supabase
                .from('mesas')
                .select('id, numero, estado, foto')
                .eq('estado', 'Pidiendo Cuenta')
                .order('numero', { ascending: true });

            if (error) throw error;
            setMesas(data || []);
        } catch (err: any) {
            console.error('[COBRO] Error al cargar mesas:', err);
            showToast('error', 'Error al cargar', 'No se pudieron obtener las mesas pendientes de cobro.');
        } finally {
            setLoadingMesas(false);
        }
    };

    const handleSeleccionarMesa = async (mesa: MesaCobro) => {
        try {
            setCargandoDetalles(true);
            setMesaSeleccionada(mesa);
            setItemsConsumo([]);
            setSubtotal(0);
            setDescuentoPorcentaje(0);
            setDescuentoInfo('');
            setPropinaPorcentaje(0);
            setPropinaInfo('');

            // 1. Obtener cliente y sesion activa
            const cliente = await MesaService.obtenerClienteDeMesa(mesa.id);
            if (cliente) {
                setClienteNombre(cliente.nombre);
                setSesionId(cliente.sesion_id);
            } else {
                setClienteNombre('Cliente de Mesa');
                setSesionId('');
            }

            // 2. Obtener hora de inicio de la sesión
            let sessionStart = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
            const { data: asignacion } = await supabase
                .from('lista_espera')
                .select('created_at')
                .eq('mesa_asignada', mesa.id)
                .eq('estado', 'asignado')
                .maybeSingle();

            if (asignacion?.created_at) {
                sessionStart = asignacion.created_at;
            }

            // 3. Obtener consumos de la mesa
            const { data: pedidos, error: errPedidos } = await supabase
                .from('pedidos')
                .select('*')
                .eq('mesa_numero', mesa.numero)
                .gte('created_at', sessionStart)
                .not('estado', 'ilike', '%rechazado%')
                .not('estado', 'ilike', '%cancelado%');

            if (errPedidos) throw errPedidos;

            // 4. Obtener todos los productos para precios
            const { data: productos, error: errProd } = await supabase
                .from('productos')
                .select('nombre, precio');

            if (errProd) throw errProd;

            const mapPrecios = new Map<string, number>();
            productos?.forEach(p => mapPrecios.set(p.nombre.toLowerCase().trim(), p.precio));

            let acumulado = 0;
            let descPct = 0;
            let descLbl = '';
            let propPct = 0;
            let propLbl = '';

            const mapeados: ItemDetalle[] = [];

            (pedidos || []).forEach(p => {
                if (p.categoria === 'descuento') {
                    descPct = p.cantidad;
                    descLbl = p.producto_nombre;
                } else if (p.categoria === 'propina') {
                    propPct = p.cantidad;
                    propLbl = p.producto_nombre;
                } else {
                    const precio = mapPrecios.get(p.producto_nombre.toLowerCase().trim()) || 0;
                    acumulado += p.cantidad * precio;
                    mapeados.push({
                        id: p.id,
                        producto_nombre: p.producto_nombre,
                        categoria: p.categoria,
                        cantidad: p.cantidad,
                        precio
                    });
                }
            });

            setItemsConsumo(mapeados);
            setSubtotal(acumulado);
            setDescuentoPorcentaje(descPct);
            setDescuentoInfo(descLbl);
            setPropinaPorcentaje(propPct);
            setPropinaInfo(propLbl);

        } catch (error) {
            console.error('[COBRO] Error cargando detalles:', error);
            showToast('error', 'Error al cargar', 'No pudimos obtener el detalle de la mesa.');
            setMesaSeleccionada(null);
        } finally {
            setCargandoDetalles(false);
        }
    };

    const confirmarPago = async () => {
        if (!mesaSeleccionada) return;

        try {
            setSubmittingPago(true);

            // 1. Obtener la asignación activa de lista_espera
            const { data: asignacion, error: errAsign } = await supabase
                .from('lista_espera')
                .select('id, sesion_id, created_at')
                .eq('mesa_asignada', mesaSeleccionada.id)
                .eq('estado', 'asignado')
                .maybeSingle();

            if (errAsign) throw errAsign;

            const targetSesionId = asignacion?.sesion_id || sesionId;

            // 2. Finalizar la sesión en lista_espera
            if (asignacion?.id) {
                const { error: errUpd } = await supabase
                    .from('lista_espera')
                    .update({ estado: 'finalizado' })
                    .eq('id', asignacion.id);
                if (errUpd) throw errUpd;
            }

            // 3. Eliminar las consultas de la sesión
            if (targetSesionId) {
                await supabase
                    .from('consultas')
                    .delete()
                    .eq('sesion_id', targetSesionId);
            }

            // 4. Actualizar todos los pedidos de la sesión a 'Pagado'
            let sessionStart = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
            if (asignacion?.created_at) {
                sessionStart = asignacion.created_at;
            }
            const { error: errPedUpd } = await supabase
                .from('pedidos')
                .update({ estado: 'Pagado' })
                .eq('mesa_numero', mesaSeleccionada.numero)
                .gte('created_at', sessionStart);
            if (errPedUpd) throw errPedUpd;

            // 5. Cambiar estado de la mesa a 'Libre'
            await MesaService.actualizarEstado(mesaSeleccionada.id, 'Libre');

            // 6. Eliminar llaves locales de AsyncStorage para la sesión (limpieza del dispositivo de cobro/pruebas)
            if (targetSesionId) {
                await AsyncStorage.removeItem(`encuesta_completada_${targetSesionId}`);
                await AsyncStorage.removeItem(`ristodeli_juegos_sesion_${targetSesionId}`);
            }

            await SoundService.reproducir('exito');
            showToast('success', 'Pago Confirmado', `La Mesa N° ${mesaSeleccionada.numero} ha sido cobrada y liberada con éxito.`);

            setMesaSeleccionada(null);
            cargarMesasPendientes();

        } catch (error: any) {
            console.error('[COBRO] Error al procesar pago:', error);
            await SoundService.reproducir('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showToast('error', 'Error al procesar', 'No se pudo confirmar el pago de la mesa. Reintenta.');
        } finally {
            setSubmittingPago(false);
        }
    };

    const descuentoMonto = subtotal * (descuentoPorcentaje / 100);
    const propinaMonto = subtotal * (propinaPorcentaje / 100);
    const totalNeto = subtotal - descuentoMonto + propinaMonto;

    return (
        <SafeAreaView className="flex-1 bg-primary">
            <LoadingModal visible={submittingPago} message="Confirmando Pago y Liberando..." />

            <View className="px-6 pt-4 flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={() => { SoundService.reproducir('exito'); router.back(); }}
                    className="flex-row items-center bg-secondary/20 py-2 px-4 rounded-full border border-tertiary/20"
                >
                    <Ionicons name="arrow-back" size={16} color="#F5C065" style={{ marginRight: 6 }} />
                    <Text className="text-secondary font-bold text-xs uppercase">Volver</Text>
                </TouchableOpacity>

                <Text className="text-secondary font-black text-lg uppercase">
                    Cobrar Cuenta
                </Text>
            </View>

            <View className="px-6 mt-4 mb-2">
                <Text className="text-white text-xs uppercase font-bold tracking-widest text-left">
                    Mesas Solicitantes
                </Text>
            </View>

            {loadingMesas && mesas.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#F5C065" />
                    <Text className="text-secondary font-bold mt-4 text-xs uppercase">Buscando solicitudes...</Text>
                </View>
            ) : (
                <FlatList
                    data={mesas}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    className="px-6 mt-4"
                    ListEmptyComponent={
                        <View className="bg-secondary p-8 rounded-3xl items-center mt-6 w-full border border-tertiary/10">
                            <Ionicons name="receipt-outline" size={40} color="#31603D" />
                            <Text className="text-primary font-bold text-center mt-3 uppercase text-xs">No hay mesas solicitando la cuenta</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => { SoundService.reproducir('exito'); handleSeleccionarMesa(item); }}
                            className="bg-secondary p-5 rounded-[24px] border border-tertiary/20 flex-row items-center justify-between mb-4 shadow-sm"
                        >
                            <View className="flex-row items-center">
                                <View className="bg-primary/10 p-3 rounded-full mr-4">
                                    <Ionicons name="restaurant-outline" size={24} color="#31603D" />
                                </View>
                                <View>
                                    <Text className="text-primary font-bold text-base">Mesa N° {item.numero}</Text>
                                    <Text className="text-tertiary text-[10px] font-bold uppercase">Estado: Esperando Pago</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#31603D" />
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Modal de cobro de mesa */}
            <Modal
                visible={mesaSeleccionada !== null}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setMesaSeleccionada(null)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-secondary rounded-t-[35px] max-h-[85%] p-6 border-t-2 border-tertiary shadow-2xl">
                        {/* Encabezado */}
                        <View className="flex-row justify-between items-center mb-4">
                            <View>
                                <Text className="text-primary font-black text-xl uppercase">Cobro Mesa {mesaSeleccionada?.numero}</Text>
                                <Text className="text-tertiary text-[11px] font-bold uppercase">{clienteNombre}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setMesaSeleccionada(null)}
                                className="bg-primary/10 p-2 rounded-full"
                            >
                                <Ionicons name="close" size={20} color="#31603D" />
                            </TouchableOpacity>
                        </View>

                        {cargandoDetalles ? (
                            <View className="py-20 justify-center items-center">
                                <ActivityIndicator size="large" color="#31603D" />
                                <Text className="text-primary font-bold mt-4 text-xs uppercase">Cargando recibo...</Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
                                {/* Detalle de Consumos */}
                                <View className="bg-secondary/40 border border-primary/10 rounded-2xl p-4 space-y-3">
                                    <Text className="text-primary/70 font-bold text-[10px] uppercase tracking-widest border-b border-primary/5 pb-2">Consumos</Text>
                                    {itemsConsumo.map((item) => (
                                        <View key={item.id} className="flex-row justify-between items-center py-1 border-b border-primary/5">
                                            <View className="flex-1">
                                                <Text className="text-primary font-bold text-sm">{item.producto_nombre}</Text>
                                                <Text className="text-primary/50 text-[10px] font-bold uppercase">Cantidad: {item.cantidad}</Text>
                                            </View>
                                            <Text className="text-primary font-black text-sm">${item.precio * item.cantidad}</Text>
                                        </View>
                                    ))}
                                    {itemsConsumo.length === 0 && (
                                        <Text className="text-primary/40 text-center py-4 font-bold text-xs uppercase">Sin consumos cargados</Text>
                                    )}
                                </View>

                                {/* Desglose financiero */}
                                <View className="bg-secondary/40 border border-primary/10 rounded-2xl p-4 space-y-2.5">
                                    <Text className="text-primary/70 font-bold text-[10px] uppercase tracking-widest border-b border-primary/5 pb-2">Resumen Financiero</Text>

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-primary text-xs font-semibold uppercase">Subtotal</Text>
                                        <Text className="text-primary font-black text-sm">${subtotal}</Text>
                                    </View>

                                    {descuentoPorcentaje > 0 && (
                                        <View className="flex-row justify-between items-center">
                                            <View>
                                                <Text className="text-emerald-600 text-xs font-semibold uppercase">Descuento ({descuentoPorcentaje}%)</Text>
                                                <Text className="text-emerald-500/70 text-[9px] font-bold uppercase">{descuentoInfo}</Text>
                                            </View>
                                            <Text className="text-emerald-600 font-black text-sm">-${descuentoMonto.toFixed(2)}</Text>
                                        </View>
                                    )}

                                    <View className="flex-row justify-between items-center">
                                        <View>
                                            <Text className="text-primary text-xs font-semibold uppercase">Propina ({propinaPorcentaje}%)</Text>
                                            <Text className="text-primary/50 text-[9px] font-bold uppercase">{propinaInfo || 'Sin propina'}</Text>
                                        </View>
                                        <Text className="text-primary font-black text-sm">+${propinaMonto.toFixed(2)}</Text>
                                    </View>

                                    <View className="h-px bg-primary/10 w-full my-2" />

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-primary font-black text-base uppercase">Total a Cobrar</Text>
                                        <Text className="text-primary font-black text-lg">${totalNeto.toFixed(2)}</Text>
                                    </View>
                                </View>

                                {/* Botón cobrar */}
                                <TouchableOpacity
                                    onPress={confirmarPago}
                                    activeOpacity={0.9}
                                    className="w-full bg-primary py-4.5 rounded-[22px] items-center justify-center border-b-4 border-[#1E3D25] shadow-lg mt-4 mb-2"
                                >
                                    <Text className="text-secondary font-black uppercase text-sm tracking-wider">
                                        Confirmar Pago y Liberar Mesa
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}