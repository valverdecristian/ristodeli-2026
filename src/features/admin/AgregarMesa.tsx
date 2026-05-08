import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { globalStyles } from '../../theme/globalStyles';
import { colors } from '../../theme/colors';
import { FotoService } from '../../core/services/FotoService';
import { StorageService } from '../../core/services/StorageService';
import { MesaService } from '../../core/services/MesaService';
import { ToastService } from '../../core/services/ToastService';

export const AgregarMesa = ({ navigation }: any) => {
    const [loading, setLoading] = useState(false);
    const [fotoUri, setFotoUri] = useState<string | null>(null);
    const [form, setForm] = useState({
        numero: '',
        comensales: '',
        tipo: 'Común', 
    });

    const tomarFotoMesa = async () => {
        const uri = await FotoService.sacarFoto();
        if (uri) setFotoUri(uri);
    };

    const guardarMesa = async () => {
        const { numero, comensales, tipo } = form;
    
        if (!numero || !comensales || !fotoUri) {
            ToastService.mostrarError('Completar todos los campos y la foto.');
            return;
        }
    
        setLoading(true);
        try {
            const urlPublica = await StorageService.subirImagen(fotoUri, 'mesas');
            
            if (!urlPublica) throw new Error('Error al subir la imagen');
    
            await MesaService.agregarMesa({
                numero: parseInt(numero),
                comensales: parseInt(comensales),
                tipo,
                foto: urlPublica,
                qr_data: `MESA-${numero}`
            });
    
            ToastService.mostrarExito('Mesa guardada correctamente.');
            
            navigation.replace('ListadoMesas'); 
    
        } catch (error: any) {
            ToastService.mostrarError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={globalStyles.container} contentContainerStyle={{ padding: 20 }}>
        <Text style={globalStyles.title}>Nueva Mesa</Text>

        <TextInput
            style={globalStyles.input}
            placeholder="Número de Mesa"
            placeholderTextColor={colors.russet}
            keyboardType="numeric"
            onChangeText={(val) => setForm({ ...form, numero: val })}
        />

        <TextInput
            style={globalStyles.input}
            placeholder="Cantidad de Comensales"
            placeholderTextColor={colors.russet}
            keyboardType="numeric"
            onChangeText={(val) => setForm({ ...form, comensales: val })}
        />

        <TextInput
            style={globalStyles.input}
            placeholder="Tipo (Común, VIP, Discapacitados)"
            placeholderTextColor={colors.russet}
            onChangeText={(val) => setForm({ ...form, tipo: val })}
        />

        <TouchableOpacity style={[globalStyles.buttonPrimary, { backgroundColor: colors.saffron }]} onPress={tomarFotoMesa}>
            <Text style={globalStyles.buttonTextPrimary}>TOMAR FOTO DE LA MESA</Text>
        </TouchableOpacity>

        {fotoUri && <Image source={{ uri: fotoUri }} style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 10 }} />}

        <TouchableOpacity 
            style={[globalStyles.buttonPrimary, { marginTop: 30 }]} 
            onPress={guardarMesa}
            disabled={loading}
        >
            {loading ? <ActivityIndicator color={colors.russet} /> : <Text style={globalStyles.buttonTextPrimary}>CONFIRMAR MESA</Text>}
        </TouchableOpacity>
        </ScrollView>
    );
};