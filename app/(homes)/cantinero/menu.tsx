import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductoService } from '@/src/services/productoService';
import { useToast } from "@/src/context/ToastContext";
import { SoundService } from '@/src/services/soundService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEADER_HEIGHT = 80;
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - 120; // safe space calculation to avoid overflow/scroll

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

function TarjetaMenuBebida({ item, cardHeight }: { item: Producto; cardHeight: number }) {
    const [fotoIndex, setFotoIndex] = useState(0);

    const cambiarFoto = (direccion: 'next' | 'prev') => {
        if (!item.fotos || item.fotos.length <= 1) return;
        if (direccion === 'next') {
            setFotoIndex((prev) => (prev + 1) % item.fotos.length);
        } else {
            setFotoIndex((prev) => (prev - 1 + item.fotos.length) % item.fotos.length);
        }
    };

    const tieneMultiplesFotos = item.fotos && item.fotos.length > 1;
    const esAgotado = item.estado === 'agotado';

    return (
        <View style={{ width: SCREEN_WIDTH, height: AVAILABLE_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
            <View className="bg-primary rounded-[30px] p-6 shadow-2xl border border-tertiary/20 justify-between animate-fade-in" style={{ width: SCREEN_WIDTH - 48, height: cardHeight }}>

                {/* PARTE SUPERIOR: NOMBRE Y PRECIO */}
                <View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-secondary font-black text-2xl uppercase tracking-tighter flex-1 mr-2" numberOfLines={1}>
                            {item.nombre}
                        </Text>
                        <Text className="text-tertiary font-black text-2xl">
                            ${item.precio}
                        </Text>
                    </View>

                    <Text className="text-secondary/80 font-semibold text-sm mt-2 leading-relaxed" numberOfLines={3}>
                        {item.descripcion || 'Sin descripción disponible.'}
                    </Text>

                    {/* BADGES */}
                    <View className="flex-row flex-wrap gap-2 mt-3">
                        <View className="flex-row items-center bg-secondary/10 px-3 py-1.5 rounded-full">
                            <Ionicons name="time-outline" size={16} color="#F5C065" style={{ marginRight: 6 }} />
                            <Text className="text-secondary font-bold text-xs uppercase">
                                Elaboración: {item.tiempo_elaboracion} min
                            </Text>
                        </View>

                        <View className={`flex-row items-center px-3 py-1.5 rounded-full ${!esAgotado ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                            <View className={`w-2 h-2 rounded-full mr-2 ${!esAgotado ? 'bg-green-400' : 'bg-red-400'}`} />
                            <Text className={`font-black text-xs uppercase ${!esAgotado ? 'text-green-300' : 'text-red-300'}`}>
                                {item.estado}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* PARTE INFERIOR / IMAGEN EXPANDIDA (FLEX-1) */}
                <View className="flex-1 w-full bg-white rounded-2xl overflow-hidden border border-secondary/15 relative justify-center items-center mt-4">
                    {item.fotos && item.fotos.length > 0 ? (
                        <View className="w-full h-full justify-center items-center">
                            <Image
                                source={{ uri: item.fotos[fotoIndex] }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                            {tieneMultiplesFotos && (
                                <>
                                    <TouchableOpacity
                                        onPress={() => cambiarFoto('prev')}
                                        className="absolute left-3 bg-black/50 p-2 rounded-full justify-center items-center active:opacity-75"
                                    >
                                        <Ionicons name="chevron-back" size={20} color="white" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => cambiarFoto('next')}
                                        className="absolute right-3 bg-black/50 p-2 rounded-full justify-center items-center active:opacity-75"
                                    >
                                        <Ionicons name="chevron-forward" size={20} color="white" />
                                    </TouchableOpacity>

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
                        <View className="items-center justify-center py-8">
                            <Ionicons name="beer-outline" size={64} color="#F5C065" style={{ opacity: 0.3 }} />
                            <Text className="text-secondary/50 font-bold text-xs uppercase mt-2">Sin imagen cargada</Text>
                        </View>
                    )}
                </View>

            </View>
        </View>
    );
}

export default function MenuCantineroScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);

    const cargarBebidas = async () => {
        setLoading(true);
        try {
            const data = await ProductoService.obtenerPorCategorias(['bebida']);
            setProductos(data as Producto[]);
        } catch (error: any) {
            SoundService.reproducir('error');
            showToast("error", "Error de carga", error.message || "No se pudo obtener las bebidas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarBebidas();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-primary">
            {/* ENCABEZADO PREMIUM INTEGRADO */}
            <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center justify-between shadow-2xl">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1 active:opacity-75">
                        <Ionicons name="arrow-back" size={30} color="#31603D" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-primary font-black text-2xl uppercase tracking-tighter leading-none">Sector Barra</Text>
                        <Text className="text-primary/70 font-bold text-[9px] uppercase tracking-widest mt-1">Catálogo de Bebidas</Text>
                    </View>
                </View>
            </View>

            {/* CONTENIDO PRINCIPAL */}
            <View className="flex-1 bg-secondary rounded-t-[32px] border-t border-tertiary/20 pt-6">
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#31603D" />
                        <Text className="text-primary/60 font-bold text-sm uppercase mt-4">Obteniendo catálogo...</Text>
                    </View>
                ) : productos.length === 0 ? (
                    <View className="flex-1 justify-center items-center px-8">
                        <Ionicons name="beer-outline" size={72} color="#31603D" style={{ opacity: 0.4 }} />
                        <Text className="text-primary font-black text-xl uppercase tracking-tighter text-center mt-4">Sin Bebidas</Text>
                        <Text className="text-primary/60 font-medium text-sm text-center mt-2 leading-relaxed">
                            No se encontraron bebidas registradas en la carta del establecimiento.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={productos}
                        keyExtractor={(item) => item.id}
                        horizontal
                        pagingEnabled
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TarjetaMenuBebida item={item} cardHeight={AVAILABLE_HEIGHT - 32} />
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}