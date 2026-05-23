import { useToast } from "@/src/context/ToastContext";
import { ProductoService } from '@/src/services/productoService';
import { ImageService } from '@/src/services/imageService';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Image, Modal } from 'react-native';
import LoadingModal from '@/src/components/LoadingModal';

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

    // Estados para el Modal Selector de fotos 
    const [modalVisible, setModalVisible] = useState(false);
    const [indiceFotoSeleccionada, setIndiceFotoSeleccionada] = useState<number | null>(null);

    const dispararError = (titulo: string, mensaje: string) => {
        SoundService.reproducir('error');
        showToast("error", titulo, mensaje);
    };

    const gestionarFoto = (index: number) => {
        setIndiceFotoSeleccionada(index);
        setModalVisible(true);
    };

    const procesarFotoCamara = async () => {
        if (indiceFotoSeleccionada === null) return;
        setModalVisible(false);
        try {
            const foto = await ImageService.takePhoto();
            if (foto) {
                const nuevasFotos = [...fotosUris];
                nuevasFotos[indiceFotoSeleccionada] = foto.uri;
                setFotosUris(nuevasFotos);
                showToast("success", "¡Foto capturada!", "La fotografía se tomó correctamente.");
            }
        } catch (error: any) {
            dispararError("Error de cámara", error.message || "No se pudo acceder a la cámara.");
        }
    };

    const procesarFotoGaleria = async () => {
        if (indiceFotoSeleccionada === null) return;
        setModalVisible(false);
        try {
            const foto = await ImageService.chooseFromGallery();
            if (foto) {
                const nuevasFotos = [...fotosUris];
                nuevasFotos[indiceFotoSeleccionada] = foto.uri;
                setFotosUris(nuevasFotos);
                showToast("success", "¡Foto seleccionada!", "La imagen de la galería se cargó correctamente.");
            }
        } catch (error: any) {
            dispararError("Error de galería", error.message || "No se pudo acceder a la galería.");
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
            try {
                await ProductoService.crear({
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim(),
                    tiempo_elaboracion: tiempoNum,
                    precio: precioNum,
                    fotos: urlsPublicas,
                    tipo: tipoSeleccionado,
                });
            } catch (dbError: any) {
                setLoading(false);
                if (dbError.code === '23505') {
                    dispararError("Producto existente", "Ya existe un producto con ese nombre bajo la misma categoría.");
                } else {
                    dispararError("Error de base de datos", dbError.message);
                }
                return;
            }

            setLoading(false);

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
            {/* SPINNER  */}
            <LoadingModal visible={loading} message={loadingText} />

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

                {/* SECCION MULTIFOTO INDIVIDUAL Y CENTRADA */}
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

            {/* MODAL PERSONALIZADO PARA SELECCION DE IMAGEN */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/60 px-6">
                    <View className="bg-secondary p-6 rounded-[32px] w-full border-2 border-tertiary/40 items-center shadow-2xl">
                        <View className="bg-primary/10 p-3.5 rounded-full mb-4">
                            <Ionicons name="image-outline" size={32} color="#31603D" />
                        </View>

                        <Text className="text-primary font-black text-lg uppercase tracking-tight text-center mb-1">
                            Seleccionar Imagen
                        </Text>
                        <Text className="text-primary/70 font-medium text-xs text-center mb-6 px-4">
                            ¿Cómo deseas cargar la fotografía del producto?
                        </Text>

                        <TouchableOpacity
                            onPress={procesarFotoCamara}
                            className="w-full bg-primary py-4 rounded-full items-center mb-3 shadow-md active:opacity-90"
                        >
                            <View className="flex-row items-center justify-center">
                                <Ionicons name="camera-outline" size={18} color="white" style={{ marginRight: 8 }} />
                                <Text className="text-white font-bold uppercase text-sm">Tomar Fotografía</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={procesarFotoGaleria}
                            className="w-full bg-secondary border-2 border-primary py-4 rounded-full items-center mb-4 shadow-sm active:opacity-90"
                        >
                            <View className="flex-row items-center justify-center">
                                <Ionicons name="images-outline" size={18} color="#31603D" style={{ marginRight: 8 }} />
                                <Text className="text-primary font-bold uppercase text-sm">Elegir de la Galería</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            className="w-full bg-tertiary/20 py-3.5 rounded-full items-center active:opacity-80"
                        >
                            <Text className="text-tertiary font-extrabold uppercase text-xs tracking-wider">
                                Cancelar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}