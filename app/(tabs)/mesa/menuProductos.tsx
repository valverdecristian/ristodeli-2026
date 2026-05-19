import LoadingModal from '@/src/components/LoadingModal';
import VisorProductos from '@/src/components/VisorProductos';
import { useToast } from "@/src/context/ToastContext";
import { useCarritoPedido } from '@/src/hooks/useCarritoPedido';
import { PedidoService } from '@/src/services/pedidoService';
import { SoundService } from '@/src/services/soundService';
import { supabase } from '@/src/services/SupabaseClient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export default function MenuProductosScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { mesaId, numeroMesa } = useLocalSearchParams<{ mesaId: string; numeroMesa: string }>();
    
    // Consumimos las operaciones locales y matemáticas del Hook desacoplado
    const { carrito, actualizarCantidad, importeTotal, tiempoEstimadoMaximo, vaciarCarrito } = useCarritoPedido();

    // Estados para congelar la pantalla con tu spinner nativo mientras el mozo decide
    const [esperandoMozo, setEsperandoMozo] = useState(false);
    const [mensajeSpinner, setMensajeSpinner] = useState("Procesando pedido...");

    // Definimos las categorías exactas que exige tu CHECK CONSTRAINT de la DB ('plato', 'bebida', 'postre')
    const categoriasAMostrar: ('plato' | 'bebida' | 'postre')[] = ['plato', 'bebida', 'postre'];

    const handleConfirmarPedidoFinal = async () => {
        if (carrito.length === 0) {
        showToast("error", "Pedido Vacío", "Selecciona al menos un producto de la carta.");
        return;
        }

        try {
            const nroMesaInt = (numeroMesa && !isNaN(parseInt(numeroMesa, 10))) ? parseInt(numeroMesa, 10) : 21;
        
        // 1. Levantamos el Spinner bloqueante con el texto requerido
        setMensajeSpinner("Esperando la confirmación del mozo...");
        setEsperandoMozo(true);

        // 2. Insertamos la orden unificada en la tabla `pedidos` con estado inicial 'A Confirmar Mozo'
        await PedidoService.enviarPedidoMesa(nroMesaInt, carrito);
        showToast("info", "Pedido enviado", "Aguardando validación en mesa.");

        // 3. ⚡ CANAL EN TIEMPO REAL: Escuchamos las actualizaciones del estado de esta mesa
        const channel = supabase
        .channel(`monitoreo_pedido_mesa_${nroMesaInt}`)
        .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' }, // 🌟 Quitamos el filter rígido de acá
        async (payload) => {
            const nuevoEstado = payload.new.estado;
            const mesaPayload = payload.new.mesa_numero;

            // Validamos adentro que la actualización le pertenezca a esta mesa
            if (parseInt(mesaPayload, 10) !== nroMesaInt) return;

            console.log('[REALTIME_CLIENTE] Cambio de estado detectado:', nuevoEstado);

            // 🟢 CASO ÉXITO: El mozo da el ok
            if (nuevoEstado === 'Pendiente') {
                supabase.removeChannel(channel); 
                setEsperandoMozo(false);
                vaciarCarrito();
                
                await SoundService.reproducir('exito');
                showToast("success", "¡Pedido Confirmado!", "Tu orden fue enviada a la cocina.");
                router.replace("/(tabs)/mesa/escanearMesa");
                return;
            }

            // 🔴 CASO RECHAZO: El mozo rebota la comanda
            // 🌟 Agregamos fallbacks por si tu mozo escribe 'Rechazado' o 'Rechazado Mozo'
            if (nuevoEstado === 'Rechazado Mozo' || nuevoEstado === 'Rechazado') {
                supabase.removeChannel(channel); 
                setEsperandoMozo(false);
                
                await SoundService.reproducir('error');
                showToast("error", "Pedido Fue Rechazado", "Revisa los motivos con el mozo.");
                
                // 🌟 Arrastramos las identidades para que el chat las lea al instante
                router.replace({
                    pathname: "/(tabs)/mesa/chatMozo" as any,
                    params: { 
                        mesaId: mesaId, 
                        numeroMesa: numeroMesa,
                        clienteId: useLocalSearchParams().clienteId, // Conserva el ID del anónimo
                        tipoCliente: 'anonimo'
                    }
                });
                return;
            }
        }
        )
        .subscribe();

        } catch (error: any) {
        setEsperandoMozo(false);
        SoundService.reproducir('error');
        Alert.alert("Error de procesamiento", error.message);
        }
    };

    return (
        <View className="flex-1 bg-primary pt-12 relative">
        {/* Tu modal de carga nativo */}
        <LoadingModal visible={esperandoMozo} message={mensajeSpinner} />

        <View className="px-6 mb-4">
            <Text className="text-white text-2xl font-black uppercase tracking-wider mb-1">Menú Ristodeli</Text>
            <Text className="text-tertiary text-xs uppercase font-bold tracking-widest">Mesa N° {numeroMesa || '--'}</Text>
        </View>

        {/* 🌟 Tu VisorProductos leyendo directo de tu servicio con las categorías de tu base de datos */}
        <View className="flex-1 px-6">
            <VisorProductos 
            categoriasFiltradas={categoriasAMostrar} 
            modo="pedido"
            carrito={carrito}
            onActualizarCantidad={(prod, cambio) => {
                // Sincronizamos las propiedades de tu tabla 'productos' con el acumulador del carrito
                actualizarCantidad({
                producto_nombre: prod.nombre,
                // Si la columna tipo es 'plato', lo guardamos como 'comida' para coincidir con tu lógica de negocio
                categoria: prod.tipo === 'plato' ? 'comida' : prod.tipo,
                precio: prod.precio,
                tiempo_elaboracion: prod.tiempo_elaboracion
                }, cambio);
            }}
            />
        </View>

        {/* 📊 INTERFAZ FIJA DE IMPORTES ACUMULADOS (Punto 12) */}
        {carrito.length > 0 && !esperandoMozo && (
            <View style={{ elevation: 10 }} className="bg-secondary p-5 rounded-t-[32px] border-t-2 border-tertiary/20 absolute bottom-0 inset-x-0 px-6">
            <View className="flex-row justify-between items-center mb-1">
                <Text className="text-primary font-bold text-xs uppercase">Tiempo Total Estimado:</Text>
                <Text className="text-primary font-black text-sm">{tiempoEstimadoMaximo} min</Text>
            </View>
            
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-primary font-black text-sm uppercase">Importe Acumulado:</Text>
                <Text className="text-primary font-black text-2xl text-emerald-800">${importeTotal}</Text>
            </View>

            <TouchableOpacity 
                onPress={handleConfirmarPedidoFinal}
                className="w-full bg-tertiary rounded-full py-4 items-center border-b-4 border-orange active:mt-1 active:border-b-0"
            >
                <Text className="text-primary font-black text-sm uppercase tracking-wider">Enviar Comanda al Mozo</Text>
            </TouchableOpacity>
            </View>
        )}
        </View>
    );
    }