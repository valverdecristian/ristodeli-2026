import VisorProductos from '@/src/components/VisorProductos';
import { useToast } from "@/src/context/ToastContext";
import { useCarritoPedido } from '@/src/hooks/useCarritoPedido';
import { NotificationService } from '@/src/services/notificationService';
import { PedidoService } from '@/src/services/pedidoService';
import { SoundService } from '@/src/services/soundService';
import { supabase } from '@/src/services/SupabaseClient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

export default function MenuProductosScreen() {
    const router = useRouter();
    const { showToast } = useToast();

    const { mesaId, numeroMesa, clienteId } = useLocalSearchParams<{
        mesaId: string;
        numeroMesa: string;
        clienteId?: string;
    }>();

    const { carrito, actualizarCantidad, importeTotal, tiempoEstimadoMaximo, vaciarCarrito } = useCarritoPedido();

    const [estadoComanda, setEstadoComanda] = useState<'edicion' | 'esperando'>('edicion');

    const categoriasAMostrar: ('plato' | 'bebida' | 'postre')[] = ['plato', 'bebida', 'postre'];
    const nroMesaInt = (numeroMesa && !isNaN(parseInt(numeroMesa, 10))) ? parseInt(numeroMesa, 10) : 21;

    useEffect(() => {
        if (estadoComanda !== 'esperando') return;

        const intervaloPolling = setInterval(async () => {
            try {
                const { data, error } = await supabase
                    .from('pedidos')
                    .select('estado')
                    .eq('mesa_numero', nroMesaInt)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data && !error) {
                    const estadoLimpio = data.estado.toLowerCase();

                    // CASO ÉXITO
                    if (estadoLimpio === 'pendiente') {
                        clearInterval(intervaloPolling);
                        setEstadoComanda('edicion');
                        vaciarCarrito();

                        await SoundService.reproducir('exito');
                        showToast("success", "¡Pedido Confirmado!", "Tu orden fue enviada a la cocina.");
                        router.replace("/(tabs)/mesa/escanearMesa");
                    }

                    // CASO RECHAZO
                    if (estadoLimpio.startsWith('rechazado') || estadoLimpio.startsWith('cancelado')) {
                        clearInterval(intervaloPolling);
                        setEstadoComanda('edicion');

                        await SoundService.reproducir('error');

                        let motivoDelMozo = "Revisá los motivos de rechazo.";
                        if (data.estado.includes(':')) {
                            motivoDelMozo = data.estado.split(':')[1].trim();
                        }

                        showToast("error", "Pedido Rechazado", motivoDelMozo);
                    }
                }
            } catch (err) {
                console.log("[POLLING_ERROR] Fallo silencioso en consulta:", err);
            }
        }, 3000);

        return () => clearInterval(intervaloPolling);
    }, [estadoComanda, nroMesaInt]);

    const handleConfirmarPedidoFinal = async () => {
        if (carrito.length === 0) {
            showToast("error", "Pedido Vacío", "Selecciona al menos un producto de la carta.");
            return;
        }

        try {
            setEstadoComanda('esperando');

            await PedidoService.enviarPedidoMesa(nroMesaInt, carrito);
            showToast("info", "Comanda enviada", "Aguardando validación del mozo...");

            // Notifica a todos los mozos con push_token registrado
            const cantItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
            NotificationService.notificarComandaAlMozo(nroMesaInt, cantItems, importeTotal).catch(
                (err) => console.warn('[menuProductos] Fallo notificación push al mozo:', err)
            );
        } catch (error: any) {
            setEstadoComanda('edicion');
            SoundService.reproducir('error');
            Alert.alert("Error", error.message);
        }
    };

    return (
        <View className="flex-1 bg-primary pt-12 relative">

            <View className="px-6 mb-4">
                <Text className="text-white text-2xl font-black uppercase tracking-wider mb-1">Menú Ristodeli</Text>
                <Text className="text-tertiary text-xs uppercase font-bold tracking-widest">Mesa N° {numeroMesa || '--'}</Text>
            </View>

            <View
                pointerEvents={estadoComanda === 'esperando' ? 'none' : 'auto'}
                className={`flex-1 px-6 ${estadoComanda === 'esperando' ? 'opacity-40' : ''}`}
            >
                <VisorProductos
                    categoriasFiltradas={categoriasAMostrar}
                    modo="pedido"
                    carrito={carrito}
                    onActualizarCantidad={(prod, cambio) => {
                        if (estadoComanda === 'esperando') return;

                        actualizarCantidad({
                            producto_nombre: prod.nombre,
                            categoria: prod.tipo === 'plato' ? 'comida' : prod.tipo,
                            precio: prod.precio,
                            tiempo_elaboracion: prod.tiempo_elaboracion
                        }, cambio);
                    }}
                />
            </View>

            {carrito.length > 0 && (
                <View style={{ elevation: 10 }} className="bg-secondary p-5 rounded-t-[32px] border-t-2 border-tertiary/20 absolute bottom-0 inset-x-0 px-6">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-primary font-bold text-xs uppercase">Tiempo Total Estimado:</Text>
                        <Text className="text-primary font-black text-sm">{tiempoEstimadoMaximo} min</Text>
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-primary font-black text-sm uppercase">Importe Acumulado:</Text>
                        <Text className="text-primary font-black text-2xl text-emerald-800">${importeTotal}</Text>
                    </View>

                    {estadoComanda === 'esperando' ? (
                        <View className="w-full bg-orange-400/90 rounded-full py-4 flex-row justify-center items-center">
                            <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                            <Text className="text-white font-black text-sm uppercase tracking-wider">Esperando al Mozo...</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={handleConfirmarPedidoFinal}
                            className="w-full bg-tertiary rounded-full py-4 items-center border-b-4 border-orange active:mt-1 active:border-b-0"
                        >
                            <Text className="text-primary font-black text-sm uppercase tracking-wider">Enviar Comanda al Mozo</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}