import { useToast } from "@/src/context/ToastContext";
import { supabase } from '@/src/services/SupabaseClient';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native';

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

interface VisorProductosProps {
    categoriasFiltradas: ('plato' | 'bebida' | 'postre')[];
}

export default function VisorProductos({ categoriasFiltradas }: VisorProductosProps) {
    const { showToast } = useToast();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarProductos = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
            .from('productos')
            .select('*')
            .in('tipo', categoriasFiltradas);

            if (error) throw error;
            setProductos((data as Producto[]) || []);
        } catch (error: any) {
            SoundService.reproducir('error');
            showToast("error", "Error de carga", error.message || "No se pudo obtener el menú.");
        } finally {
            setLoading(false);
        }
        };

        cargarProductos();
    }, [categoriasFiltradas]);

    if (loading) {
        return (
        <View className="flex-1 justify-center items-center bg-primary">
            <ActivityIndicator size="large" color="#F5C065" />
            <Text className="text-secondary font-bold mt-2 uppercase tracking-tight">Cargando carta...</Text>
        </View>
        );
    }

    return (
        <View className="flex-1 w-full">
        {productos.length === 0 ? (
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
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => (
                <View className="bg-secondary rounded-[25px] p-5 mb-5 border border-tertiary/20 shadow-md w-full">
                
                {/* Encabezado: Nombre y Precio */}
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-primary font-bold text-lg uppercase flex-1 mr-2" numberOfLines={1}>
                    {item.nombre}
                    </Text>
                    <Text className="text-tertiary font-extrabold text-lg">
                    ${item.precio}
                    </Text>
                </View>

                {/* Descripción */}
                <Text className="text-gray-700 font-medium text-sm mb-3 text-justify">
                    {item.descripcion}
                </Text>

                {/* Detalles de Elaboración y Estado */}
                <View className="flex-row flex-wrap gap-2 mb-4">
                    <View className="flex-row items-center bg-primary/30 px-3 py-1.5 rounded-full">
                    <Ionicons name="time-outline" size={16} color="#31603D" style={{ marginRight: 5 }} />
                    <Text className="text-primary font-bold text-xs uppercase">
                        Elaboración: {item.tiempo_elaboracion} minutos
                    </Text>
                    </View>

                    {/* Badge para el estado */}
                    <View className={`flex-row items-center px-3 py-1.5 rounded-full ${item.estado === 'disponible' ? 'bg-green-100' : 'bg-red-100'}`}>
                    <View className={`w-2 h-2 rounded-full mr-2 ${item.estado === 'disponible' ? 'bg-green-600' : 'bg-red-600'}`} />
                    <Text className={`font-bold text-xs uppercase ${item.estado === 'disponible' ? 'text-green-800' : 'text-red-800'}`}>
                        {item.estado}
                    </Text>
                    </View>
                </View>

                {/* 📸 Galería de imágenes individuales mapeadas desde el array */}
                <Text className="text-primary/70 font-bold text-[10px] uppercase tracking-wider mb-2">
                    Galería de imágenes individuales
                </Text>
                
                <View className="flex-row justify-between w-full">
                    {item.fotos && item.fotos.map((url, index) => (
                    <View 
                        key={index} 
                        className="w-[31%] aspect-square bg-primary rounded-xl border border-tertiary/30 overflow-hidden shadow-inner justify-center items-center"
                    >
                        <Image 
                        source={{ uri: url }} 
                        className="w-full h-full" 
                        resizeMode="cover" 
                        />
                    </View>
                    ))}
                </View>
                </View>
            )}
            />
        )}
        </View>
    );
}