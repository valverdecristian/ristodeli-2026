import LoadingModal from '@/src/components/LoadingModal';
import { useToast } from "@/src/context/ToastContext";
import { ProductoService } from '@/src/services/productoService';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';

interface Producto {
    id: string;
    created_at: string;
    nombre: string;
    descripcion: string;
    tiempo_elaboracion: number;
    precio: number;            
    fotos: string[];          
    tipo: 'plato' | 'bebida' | 'postre'; 
    estado: 'disponible' | 'agotado'; 
}

// 🌟 Extendemos las Props para que sea condicional e interactivo
interface VisorProductosProps {
    categoriasFiltradas: ('plato' | 'bebida' | 'postre')[];
    modo?: 'lectura' | 'pedido'; // 👈 'pedido' habilita la botonera del carrito
    carrito?: any[];             // 👈 Opcional para el modo pedido
    onActualizarCantidad?: (producto: any, cambio: number) => void; // 👈 Opcional para el modo pedido
}

function TarjetaProducto({
    item,
    modo,
    carrito,
    onActualizarCantidad
}: {
    item: Producto;
    modo: 'lectura' | 'pedido';
    carrito: any[];
    onActualizarCantidad?: (producto: any, cambio: number) => void;
}) {
    const [fotoIndex, setFotoIndex] = useState(0);

    const itemEnCarrito = carrito.find(i => i.producto_nombre === item.nombre);
    const cantidad = itemEnCarrito ? itemEnCarrito.cantidad : 0;
    const esAgotado = item.estado === 'agotado';

    const cambiarFoto = (direccion: 'next' | 'prev') => {
        if (!item.fotos || item.fotos.length <= 1) return;
        if (direccion === 'next') {
            setFotoIndex((prev) => (prev + 1) % item.fotos.length);
        } else {
            setFotoIndex((prev) => (prev - 1 + item.fotos.length) % item.fotos.length);
        }
    };

    const tieneMultiplesFotos = item.fotos && item.fotos.length > 1;

    return (
        <View className="bg-secondary rounded-[25px] p-5 mb-5 border border-tertiary/20 shadow-md w-full">
            
            {/* Nombre y Precio */}
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-primary font-bold text-lg uppercase flex-1 mr-2" numberOfLines={1}>
                    {item.nombre}
                </Text>
                <Text className="text-tertiary font-extrabold text-lg">
                    ${item.precio}
                </Text>
            </View>

            {/* Descripcion */}
            <Text className="text-gray-700 font-medium text-sm mb-3 text-justify">
                {item.descripcion}
            </Text>

            {/* Detalles de Demora y Disponibilidad */}
            <View className="flex-row flex-wrap gap-2 mb-4">
                <View className="flex-row items-center bg-primary/30 px-3 py-1.5 rounded-full">
                    <Ionicons name="time-outline" size={16} color="#31603D" style={{ marginRight: 5 }} />
                    <Text className="text-primary font-bold text-xs uppercase">
                        Elaboración: {item.tiempo_elaboracion} minutos
                    </Text>
                </View>

                <View className={`flex-row items-center px-3 py-1.5 rounded-full ${item.estado === 'disponible' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <View className={`w-2 h-2 rounded-full mr-2 ${item.estado === 'disponible' ? 'bg-green-600' : 'bg-red-600'}`} />
                    <Text className={`font-bold text-xs uppercase ${item.estado === 'disponible' ? 'text-green-800' : 'text-red-800'}`}>
                        {item.estado}
                    </Text>
                </View>
            </View>

            {/* Contenedor de Imagen de Buen Tamaño e Individual */}
            {item.fotos && item.fotos.length > 0 ? (
                <View className="w-full aspect-[16/10] bg-primary/10 rounded-2xl overflow-hidden border border-tertiary/30 relative justify-center items-center mb-2">
                    <Image 
                        source={{ uri: item.fotos[fotoIndex] }} 
                        className="w-full h-full" 
                        resizeMode="cover" 
                    />

                    {/* Botones de navegación (Flechas) si tiene múltiples imágenes */}
                    {tieneMultiplesFotos && (
                        <>
                            <TouchableOpacity 
                                onPress={() => cambiarFoto('prev')}
                                className="absolute left-3 bg-black/45 p-2 rounded-full justify-center items-center animate-pulse"
                            >
                                <Ionicons name="chevron-back" size={20} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => cambiarFoto('next')}
                                className="absolute right-3 bg-black/45 p-2 rounded-full justify-center items-center animate-pulse"
                            >
                                <Ionicons name="chevron-forward" size={20} color="white" />
                            </TouchableOpacity>

                            {/* Indicadores visuales de posición (Puntos) */}
                            <View className="absolute bottom-3 flex-row justify-center items-center">
                                {item.fotos.map((_, i) => (
                                    <View 
                                        key={i} 
                                        className={`w-2 h-2 rounded-full mx-1 ${i === fotoIndex ? 'bg-tertiary' : 'bg-white/60'}`} 
                                    />
                                ))}
                            </View>
                        </>
                    )}
                </View>
            ) : (
                <View className="w-full aspect-[16/10] bg-primary/10 rounded-2xl items-center justify-center border border-tertiary/30 mb-2">
                    <Ionicons name="image-outline" size={48} color="#31603D" style={{ opacity: 0.3 }} />
                </View>
            )}

            {/* 🌟 RENDERIZADO CONDICIONAL SEGÚN EL MODO EXIGIDO */}
            {modo === 'pedido' && (
                <View className="flex-row justify-end items-center border-t border-primary/5 mt-4 pt-3">
                    {esAgotado ? (
                        <View className="bg-red-500/10 px-4 py-2 rounded-full">
                            <Text className="text-red-600 font-black text-xs uppercase">Agotado</Text>
                        </View>
                    ) : cantidad > 0 ? (
                        <View className="flex-row items-center bg-primary/10 rounded-full p-1">
                            <TouchableOpacity 
                                onPress={() => onActualizarCantidad && onActualizarCantidad(item, -1)} 
                                className="bg-primary w-8 h-8 rounded-full items-center justify-center"
                            >
                                <Ionicons name="remove" size={16} color="white" />
                            </TouchableOpacity>
                            
                            <Text className="text-primary font-black mx-4 text-base">{cantidad}</Text>
                            
                            <TouchableOpacity 
                                onPress={() => onActualizarCantidad && onActualizarCantidad(item, 1)} 
                                className="bg-primary w-8 h-8 rounded-full items-center justify-center"
                            >
                                <Ionicons name="add" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity 
                            onPress={() => onActualizarCantidad && onActualizarCantidad(item, 1)}
                            className="bg-tertiary px-5 py-2.5 rounded-full border-b-4 border-orange flex-row items-center"
                        >
                            <Text className="text-primary font-black text-xs uppercase mr-2">Añadir al pedido</Text>
                            <Ionicons name="cart-outline" size={14} color="#31603D" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

        </View>
    );
}

export default function VisorProductos({ 
    categoriasFiltradas, 
    modo = 'lectura', // 👈 Por defecto entra en modo pasivo (empleados)
    carrito = [], 
    onActualizarCantidad 
}: VisorProductosProps) {
    
    const { showToast } = useToast();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarProductos = async () => {
            setLoading(true);
            try {
                const data = await ProductoService.obtenerPorCategorias(categoriasFiltradas);
                setProductos(data as Producto[]);
            } catch (error: any) {
                SoundService.reproducir('error');
                showToast("error", "Error de carga", error.message || "No se pudo obtener el menú.");
            } finally {
                setLoading(false);
            }
        };

        cargarProductos();
    }, [categoriasFiltradas]);

    return (
        <View className="flex-1 w-full">
            <LoadingModal visible={loading} message="Cargando carta..." />

            {!loading && (
                productos.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <Ionicons name="fast-food-outline" size={64} color="#31603D" />
                        <Text className="text-secondary font-bold text-center mt-4 text-base uppercase">
                            No hay productos registrados
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={productos}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: modo === 'pedido' ? 140 : 30 }}
                        renderItem={({ item }) => (
                            <TarjetaProducto 
                                item={item} 
                                modo={modo} 
                                carrito={carrito} 
                                onActualizarCantidad={onActualizarCantidad} 
                            />
                        )}
                    />
                )
            )}
        </View>
    );
}