import { useToast } from "@/src/context/ToastContext";
import { supabase } from '@/src/services/SupabaseClient';
import { ImageService } from '@/src/services/imageService';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface FormularioProductoProps {
    tiposPermitidos: ('plato' | 'bebida' | 'postre')[];
    onExito: () => void;
    }

    export default function FormularioProducto({ tiposPermitidos, onExito }: FormularioProductoProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');

    // Estados del formulario
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tiempo, setTiempo] = useState('');
    const [precio, setPrecio] = useState('');
    const [tipoSeleccionado, setTipoSeleccionado] = useState<'plato' | 'bebida' | 'postre'>(tiposPermitidos[0]);
    
    // Array de 3 posiciones para controlar las 3 fotos individuales individuales
    const [fotosUris, setFotosUris] = useState<(string | null)[]>([null, null, null]);

    const dispararError = (titulo: string, mensaje: string) => {
        SoundService.reproducir('error');
        showToast("error", titulo, mensaje);
    };

    // Captura de foto individual (0, 1 o 2) permitiendo camara o galería
    const gestionarFoto = async (index: number) => {
        try {
        const foto = await ImageService.takePhoto();
        if (foto) {
            const nuevasFotos = [...fotosUris];
            nuevasFotos[index] = foto.uri;
            setFotosUris(nuevasFotos);
        }
        } catch (error) {
        dispararError("Error de imagen", "No se pudo cargar la fotografía.");
        }
    };

    const handleGuardarProducto = async () => {
        // VALIDACIONES 
        if (!nombre.trim() || !descripcion.trim() || !tiempo || !precio || !tipoSeleccionado) {
        dispararError("Campos incompletos", "Por favor, completa toda la información básica.");
        return;
        }

        if (fotosUris.some(f => f === null)) {
        dispararError("Fotos faltantes", "Es obligatorio cargar las tres (3) fotos del producto.");
        return;
        }

        const tiempoNum = parseInt(tiempo);
        const precioNum = parseFloat(precio);

        if (isNaN(tiempoNum) || tiempoNum <= 0) {
        dispararError("Tiempo inválido", "El tiempo de elaboración debe ser un número entero mayor a 0.");
        return;
        }

        if (isNaN(precioNum) || precioNum <= 0) {
        dispararError("Precio inválido", "El precio del producto debe ser un número válido.");
        return;
        }

        setLoading(true);
        const urlsPublicas: string[] = [];

        try {
        for (let i = 0; i < fotosUris.length; i++) {
            setLoadingText(`Subiendo imagen ${i + 1} de 3...`);
            const uri = fotosUris[i]!;
            
            const nombreArchivo = `prod_${nombre.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${i}`;
            const resultadoSubida = await ImageService.uploadToSupabase(uri, "avatares", "productos", nombreArchivo);

            if (!resultadoSubida.success || !resultadoSubida.url) {
            throw new Error(`Falló la subida de la imagen ${i + 1}`);
            }
            urlsPublicas.push(resultadoSubida.url);
        }

        setLoadingText('Registrando producto en la carta...');
        const { error: dbError } = await supabase
            .from('productos')
            .insert([
            {
                nombre: nombre.trim(),
                descripcion: descripcion.trim(),
                tiempo_elaboracion: tiempoNum,
                precio: precioNum,
                fotos: urlsPublicas,
                tipo: tipoSeleccionado,
                estado: 'disponible'
            }
            ]);

        setLoading(false);

        if (dbError) {
            if (dbError.code === '23505') {
            dispararError("Producto existente", "Ya existe un producto con ese nombre bajo la misma categoría.");
            } else {
            dispararError("Error de base de datos", dbError.message);
            }
            return;
        }

        await SoundService.reproducir('exito');
        showToast("success", "¡Alta exitosa!", `${nombre} se agregó correctamente al menú.`);
        onExito();

        } catch (error: any) {
        setLoading(false);
        dispararError("Error crítico", error.message || "Ocurrió un problema durante el guardado.");
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* SPINNER OBLIGATORIO CON LOGO EN LAS ESPERAS */}
        <Modal transparent={true} visible={loading} animationType="fade">
            <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-primary p-10 rounded-3xl items-center border-2 border-tertiary shadow-2xl w-[80%]">
                <View className="bg-secondary rounded-full p-2 mb-4 border border-tertiary">
                <Image source={require('../../assets/images/icon.png')} className="w-12 h-12" resizeMode="contain" />
                </View>
                <ActivityIndicator size="large" color="#F5C065" />
                <Text className="text-secondary font-bold mt-4 text-base text-center">{loadingText}</Text>
            </View>
            </View>
        </Modal>

        {/* Inputs del formulario */}
        <View className="w-full pt-4">
            <TextInput
            placeholder="Nombre del Producto"
            placeholderTextColor="#555"
            value={nombre}
            onChangeText={setNombre}
            className="w-full bg-secondary rounded-full px-6 py-3.5 text-center text-base shadow-sm mb-4 text-primary font-semibold"
            />

            <TextInput
            placeholder="Descripción / Ingredientes"
            placeholderTextColor="#555"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={2}
            className="w-full bg-secondary rounded-[25px] px-6 py-3.5 text-center text-base shadow-sm mb-4 text-primary font-semibold"
            />

            <TextInput
            placeholder="Tiempo de elaboración (minutos)"
            placeholderTextColor="#555"
            value={tiempo}
            onChangeText={setTiempo}
            keyboardType="numeric"
            className="w-full bg-secondary rounded-full px-6 py-3.5 text-center text-base shadow-sm mb-4 text-primary font-semibold"
            />

            <TextInput
            placeholder="Precio ($)"
            placeholderTextColor="#555"
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
            className="w-full bg-secondary rounded-full px-6 py-3.5 text-center text-base shadow-sm mb-4 text-primary font-semibold"
            />

            {/* Selector de tipo (Solo si tiene más de un rol permitido, como el cocinero) */}
            {tiposPermitidos.length > 1 && (
            <View className="flex-row justify-between mb-6 px-2">
                {tiposPermitidos.map((t) => (
                <TouchableOpacity
                    key={t}
                    onPress={() => setTipoSeleccionado(t)}
                    className={`w-[48%] py-2.5 rounded-full border ${tipoSeleccionado === t ? 'bg-secondary border-tertiary' : 'bg-primary border-secondary'}`}
                >
                    <Text className={`text-center font-bold uppercase text-xs ${tipoSeleccionado === t ? 'text-tertiary' : 'text-secondary'}`}>
                    {t}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>
            )}

            {/* SECCIÓN MULTIFOTO INDIVIDUAL Y CENTRADA */}
            <Text className="text-secondary font-bold text-xs uppercase tracking-wider mb-3 px-2">
            Fotos obligatorias del producto (3)
            </Text>
            
            <View className="flex-row justify-between mb-8">
            {fotosUris.map((uri, index) => (
                <TouchableOpacity
                key={index}
                onPress={() => gestionarFoto(index)}
                className="w-[31%] aspect-square bg-secondary rounded-2xl items-center justify-center border-2 border-dashed border-tertiary overflow-hidden shadow-sm"
                >
                {uri ? (
                    <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="items-center">
                    <Ionicons name="camera-outline" size={24} color="#31603D" />
                    <Text className="text-[9px] text-primary font-bold uppercase mt-1">Foto {index + 1}</Text>
                    </View>
                )}
                </TouchableOpacity>
            ))}
            </View>

            <TouchableOpacity
            onPress={handleGuardarProducto}
            className="w-full bg-tertiary rounded-full py-4 shadow-lg border-b-4 border-orange active:opacity-90 mb-6"
            >
            <Text className="text-center font-bold text-primary text-lg uppercase">Guardar en la Carta</Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
    );
}