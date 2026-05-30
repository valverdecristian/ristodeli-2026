import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/services/SupabaseClient';
import { SoundService } from '@/src/services/soundService';
import { useToast } from '@/src/context/ToastContext';
import { MesaService } from '@/src/services/mesaService';
import { NotificationService } from '@/src/services/notificationService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingModal from '@/src/components/LoadingModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 80;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - 120;

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

            const cliente = await MesaService.obtenerClienteDeMesa(mesa.id);
            if (cliente) {
                setClienteNombre(cliente.nombre);
                setSesionId(cliente.sesion_id);
            } else {
                setClienteNombre('Cliente de Mesa');
                setSesionId('');
            }

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

            const { data: pedidos, error: errPedidos } = await supabase
                .from('pedidos')
                .select('*')
                .eq('mesa_numero', mesa.numero)
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

            const { data: asignacion, error: errAsign } = await supabase
                .from('lista_espera')
                .select('id, sesion_id, created_at')
                .eq('mesa_asignada', mesaSeleccionada.id)
                .eq('estado', 'asignado')
                .maybeSingle();

            if (errAsign) throw errAsign;

            const targetSesionId = asignacion?.sesion_id || sesionId;

            if (asignacion?.id) {
                // Modificado para conservar el fix del compañero (completar estado)
                // Usamos 'asignado' con mesa_asignada: null debido a la check constraint 'lista_espera_estado_check' de la DB
                const { error: errUpd } = await supabase
                    .from('lista_espera')
                    .update({ 
                        estado: 'asignado',
                        mesa_asignada: null
                    })
                    .eq('id', asignacion.id);
                if (errUpd) throw errUpd;
            }

            if (targetSesionId) {
                await supabase
                    .from('consultas')
                    .delete()
                    .eq('sesion_id', targetSesionId);
            }

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

            await MesaService.actualizarEstado(mesaSeleccionada.id, 'Libre');

            if (targetSesionId) {
                await AsyncStorage.removeItem(`encuesta_completada_${targetSesionId}`);
                await AsyncStorage.removeItem(`ristodeli_juegos_sesion_${targetSesionId}`);
            }

            await SoundService.reproducir('exito');
            showToast('success', 'Pago Confirmado', `La Mesa N° ${mesaSeleccionada.numero} ha sido cobrada y liberada con éxito.`);

            // Notifica a admins y supervisores
            NotificationService.notificarPagoConfirmado(
                mesaSeleccionada.numero,
                totalNeto
            ).catch((err) => console.warn('[cobrarCuenta] Fallo notificación pago al staff:', err));

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

    const chunkArray = (arr: any[], size: number) => {
        const chunked = [];
        for (let i = 0; i < arr.length; i += size) {
            chunked.push(arr.slice(i, i + size));
        }
        return chunked;
    };

    const renderPaginaMesasCobro = ({ item: grupoMesas }: { item: MesaCobro[] }) => {
        return (
            <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT, paddingHorizontal: 24, justifyContent: 'center' }}>
                {grupoMesas.map((item) => {
                    const CARD_WIDTH = SCREEN_WIDTH - 48;
                    const CARD_HEIGHT = (AVAILABLE_HEIGHT - 32) / 2;

                    return (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => { SoundService.reproducir('exito'); handleSeleccionarMesa(item); }}
                            activeOpacity={0.7}
                            style={{ width: CARD_WIDTH, height: CARD_HEIGHT, marginBottom: 16 }}
                            className="bg-primary rounded-[28px] border border-tertiary/30 p-5 justify-between shadow-lg flex-row items-center"
                        >
                            <View className="flex-row items-center">
                                <View className="bg-tertiary/20 p-4 rounded-full mr-4">
                                    <Ionicons name="restaurant-outline" size={26} color="#F5C065" />
                                </View>
                                <View>
                                    <Text className="text-white font-black text-lg uppercase tracking-tight">Mesa N° {item.numero}</Text>
                                    <Text className="text-tertiary text-xs font-bold uppercase mt-1">Estado: Esperando Pago</Text>
                                </View>
                            </View>
                            <View className="bg-tertiary p-2 rounded-full">
                                <Ionicons name="chevron-forward" size={18} color="#31603D" />
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {/* Relleno si hay un solo item */}
                {grupoMesas.length === 1 && (
                    <View style={{ width: SCREEN_WIDTH - 48, height: (AVAILABLE_HEIGHT - 32) / 2, marginBottom: 16 }} />
                )}
            </View>
        );
    };

    const paginas = chunkArray(mesas, 2);

    return (
        <SafeAreaView className="flex-1 bg-primary">
            <LoadingModal visible={submittingPago} message="Confirmando Pago y Liberando..." />

            {/* ENCABEZADO PREMIUM INTEGRADO */}
            <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center justify-between shadow-2xl">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1 active:opacity-75">
                        <Ionicons name="arrow-back" size={30} color="#31603D" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-primary font-black text-2xl uppercase tracking-tighter leading-none">Cobrar Cuenta</Text>
                        <Text className="text-primary/70 font-bold text-[9px] uppercase tracking-widest mt-1">Mesas Solicitantes</Text>
                    </View>
                </View>
            </View>

            {loadingMesas && mesas.length === 0 ? (
                <View className="flex-1 justify-center items-center bg-secondary">
                    <ActivityIndicator size="large" color="#F5C065" />
                    <Text className="text-primary font-bold mt-4 text-xs uppercase">Buscando solicitudes...</Text>
                </View>
            ) : (
                <View className="flex-1 bg-secondary rounded-t-[32px] border-t border-tertiary/20 pt-6">
                    {mesas.length === 0 ? (
                        <View style={{ height: AVAILABLE_HEIGHT }} className="justify-center items-center px-6">
                            <View className="bg-secondary p-8 rounded-full mb-4 border border-tertiary/20">
                                <Ionicons name="receipt-outline" size={48} color="#31603D" style={{ opacity: 0.3 }} />
                            </View>
                            <Text className="text-primary font-bold text-xs uppercase tracking-widest text-center">No hay mesas solicitando la cuenta</Text>
                        </View>
                    ) : (
                        <>
                            <FlatList
                                data={paginas}
                                keyExtractor={(item, index) => index.toString()}
                                horizontal={true}
                                pagingEnabled={true}
                                showsHorizontalScrollIndicator={false}
                                renderItem={renderPaginaMesasCobro}
                                decelerationRate="fast"
                            />
                            {paginas.length > 1 && (
                                <View className="flex-row justify-center items-center pb-6">
                                    <Ionicons name="swap-horizontal" size={14} color="#31603D" style={{ marginRight: 6 }} />
                                    <Text className="text-primary/75 font-bold text-[10px] uppercase tracking-widest">
                                        Desliza para ver más ({paginas.length} páginas)
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            )}

            {/* Modal de cobro de mesa */}
            <Modal
                visible={mesaSeleccionada !== null}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setMesaSeleccionada(null)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <SafeAreaView edges={['bottom']} className="bg-secondary rounded-t-[35px] max-h-[85%] px-6 pt-6 pb-2 border-t-2 border-tertiary shadow-2xl">
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
                                    <Text className="text-primary/70 font-bold text-xs uppercase tracking-widest border-b border-primary/5 pb-2">Consumos</Text>
                                    {itemsConsumo.map((item) => (
                                        <View key={item.id} className="flex-row justify-between items-center py-1 border-b border-primary/5">
                                            <View className="flex-1">
                                                <Text className="text-primary font-bold text-base">{item.producto_nombre}</Text>
                                                <Text className="text-primary/50 text-xs font-bold uppercase">Cantidad: {item.cantidad} x ${item.precio}</Text>
                                            </View>
                                            <Text className="text-primary font-black text-base">${item.precio * item.cantidad}</Text>
                                        </View>
                                    ))}
                                    {itemsConsumo.length === 0 && (
                                        <Text className="text-primary/40 text-center py-4 font-bold text-sm uppercase">Sin consumos cargados</Text>
                                    )}
                                </View>

                                {/* Desglose financiero */}
                                <View className="bg-secondary/40 border border-primary/10 rounded-2xl p-4 space-y-2.5">
                                    <Text className="text-primary/70 font-bold text-xs uppercase tracking-widest border-b border-primary/5 pb-2">Resumen Financiero</Text>

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-primary text-sm font-semibold uppercase">Subtotal</Text>
                                        <Text className="text-primary font-black text-base">${subtotal}</Text>
                                    </View>

                                    {descuentoPorcentaje > 0 && (
                                        <View className="flex-row justify-between items-center">
                                            <View>
                                                <Text className="text-emerald-600 text-sm font-semibold uppercase">Descuento ({descuentoPorcentaje}%)</Text>
                                                <Text className="text-emerald-500/70 text-[11px] font-bold uppercase">{descuentoInfo}</Text>
                                            </View>
                                            <Text className="text-emerald-600 font-black text-base">-${descuentoMonto.toFixed(2)}</Text>
                                        </View>
                                    )}

                                    <View className="flex-row justify-between items-center">
                                        <View>
                                            <Text className="text-primary text-sm font-semibold uppercase">Propina ({propinaPorcentaje}%)</Text>
                                            <Text className="text-primary/50 text-[11px] font-bold uppercase">{propinaInfo || 'Sin propina'}</Text>
                                        </View>
                                        <Text className="text-primary font-black text-base">+${propinaMonto.toFixed(2)}</Text>
                                    </View>

                                    <View className="h-px bg-primary/10 w-full my-2" />

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-primary font-black text-lg uppercase">Total a Cobrar</Text>
                                        <Text className="text-primary font-black text-xl">${totalNeto.toFixed(2)}</Text>
                                    </View>
                                </View>

                                {/* Botón cobrar */}
                                <TouchableOpacity
                                    onPress={confirmarPago}
                                    activeOpacity={0.9}
                                    className="w-full bg-primary py-4.5 rounded-[22px] items-center justify-center border-b-4 border-[#1E3D25] shadow-lg mt-4 mb-6"
                                >
                                    <Text className="text-secondary font-black uppercase text-base tracking-wider">
                                        Confirmar Pago
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </SafeAreaView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}