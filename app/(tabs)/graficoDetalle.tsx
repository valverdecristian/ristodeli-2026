import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/src/services/SupabaseClient';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { SoundService } from '@/src/services/soundService';

const screenWidth = Dimensions.get("window").width;

export default function GraficoDetalleScreen() {
    const router = useRouter();
    const { tipo } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [datosEncuestas, setDatosEncuestas] = useState<any[]>([]);

    useEffect(() => {
        fetchEncuestas();
    }, [tipo]);

    const fetchEncuestas = async () => {
        try {
        setLoading(true);
        const { data, error } = await supabase.from('encuestas').select('*');
        if (error) throw error;
        setDatosEncuestas(data || []);
        } catch (e) {
        console.error("Error cargando estadísticas: ", e);
        } finally {
        setLoading(false);
        }
    };

    // SATISFACCIÓN 
    const renderGraficoSatisfaccion = () => {
        const conteo = [0, 0, 0, 0, 0];
        datosEncuestas.forEach(e => {
        if (e.satisfaccion >= 1 && e.satisfaccion <= 5) conteo[e.satisfaccion - 1]++;
        });

        const barData = [
        { value: conteo[0], label: '1⭐', frontColor: '#F5C065' },
        { value: conteo[1], label: '2⭐', frontColor: '#F5C065' },
        { value: conteo[2], label: '3⭐', frontColor: '#F5C065' },
        { value: conteo[3], label: '4⭐', frontColor: '#F5C065' },
        { value: conteo[4], label: '5⭐', frontColor: '#31603D' },
        ];

        return (
        <View className="bg-secondary p-4 rounded-3xl border border-tertiary/10 shadow-sm items-center">
            <Text className="text-primary font-bold uppercase text-center mb-6">Puntuación de Satisfacción</Text>
            <BarChart
            data={barData}
            barWidth={32}
            capThickness={2}
            capColor={'#1E3D25'}
            rulesColor={'rgba(49, 96, 61, 0.1)'} 
            xAxisLabelTextStyle={{ color: '#31603D', fontWeight: 'bold' }}
            yAxisTextStyle={{ color: '#31603D' }}
            noOfSections={4}
            />
        </View>
        );
    };

    // RECOMENDACIÓN 
    const renderGraficoRecomendacion = () => {
        let siRecomienda = 0;
        let noRecomienda = 0;
        datosEncuestas.forEach(e => {
        if (e.recomienda) siRecomienda++;
        else noRecomienda++;
        });

        const pieData = [
        { value: siRecomienda, color: '#31603D', text: `Sí (${siRecomienda})` },
        { value: noRecomienda, color: '#E76F51', text: `No (${noRecomienda})` }
        ];

        return (
        <View className="bg-secondary p-4 rounded-3xl border border-tertiary/10 shadow-sm items-center">
            <Text className="text-primary font-bold uppercase text-center mb-6">¿Recomendarían el Restaurante?</Text>
            <PieChart
            data={pieData}
            donut
            showText
            textColor="white"
            radius={100}
            innerRadius={60}
            innerCircleColor="#F4F4F9"
            />
            <View className="flex-row justify-center space-x-6 mt-6">
            <View className="flex-row items-center mr-4"><View className="w-3 h-3 bg-primary rounded-full mr-2" /><Text className="text-xs text-primary font-semibold">Recomienda</Text></View>
            <View className="flex-row items-center"><View className="w-3 h-3 bg-red-500 rounded-full mr-2" /><Text className="text-xs text-primary font-semibold">No Recomienda</Text></View>
            </View>
        </View>
        );
    };

    // LIMPIEZA 
    const renderGraficoLimpieza = () => {
        let excelente = 0, bueno = 0, regular = 0;
        datosEncuestas.forEach(e => {
        const limpia = e.limpieza?.toLowerCase().trim();
        if (limpia === "excelente") excelente++;
        else if (limpia === "bueno") bueno++;
        else regular++;
        });

        const barData = [
        { value: excelente, label: 'Excelente', frontColor: '#31603D' },
        { value: bueno, label: 'Bueno', frontColor: '#F5C065' },
        { value: regular, label: 'Regular', frontColor: '#E76F51' }
        ];

        return (
        <View className="bg-secondary p-4 rounded-3xl border border-tertiary/10 shadow-sm items-center">
            <Text className="text-primary font-bold uppercase text-center mb-6">Nivel de Higiene del Salón</Text>
            <BarChart
            data={barData}
            barWidth={40}
            xAxisLabelTextStyle={{ color: '#31603D', fontSize: 11, fontWeight: 'bold' }}
            yAxisTextStyle={{ color: '#31603D' }}
            rulesColor={'rgba(49, 96, 61, 0.1)'}
            />
        </View>
        );
    };

    // PILARES DE SERVICIO
    const renderGraficoPilares = () => {
        const ultimasEncuestas = datosEncuestas.slice(-5);
        
        // Gifted Charts para múltiples líneas requiere un array de objetos por cada línea independiente
        const lineDataAtencion = ultimasEncuestas.map(e => ({ value: Number(e.atencion || 5) }));
        const lineDataComida = ultimasEncuestas.map(e => ({ value: Number(e.comida || 5) }));
        const lineDataAmbiente = ultimasEncuestas.map(e => ({ value: Number(e.ambiente || 5) }));

        return (
        <View className="bg-secondary p-4 rounded-3xl border border-tertiary/10 shadow-sm items-center">
            <Text className="text-primary font-bold uppercase text-center mb-4">Evolución del Servicio</Text>
            <LineChart
            data={lineDataAtencion}      
            data2={lineDataComida}       
            data3={lineDataAmbiente}     
            color1="#F5C065"            
            color2="#E76F51"             
            color3="#4A90E2"             
            thickness={3}
            dataPointsColor1="#F5C065"
            dataPointsColor2="#E76F51"
            dataPointsColor3="#4A90E2"
            noOfSections={4}
            yAxisTextStyle={{ color: '#31603D' }}
            />
            <View className="flex-row justify-center space-x-4 mt-4">
            <Text className="text-[10px] font-bold text-orange-500">● Atención</Text>
            <Text className="text-[10px] font-bold text-red-400">● Comida</Text>
            <Text className="text-[10px] font-bold text-blue-500">● Ambiente</Text>
            </View>
        </View>
        );
    };

    const obtenerContenidoGrafico = () => {
        if (datosEncuestas.length === 0) {
        return (
            <View className="p-8 items-center bg-secondary rounded-2xl">
            <Ionicons name="folder-open-outline" size={40} color="#31603D" />
            <Text className="text-primary font-semibold text-center mt-2">Aún no se registraron encuestas en Supabase.</Text>
            </View>
        );
        }

        switch (tipo) {
        case 'satisfaccion': return renderGraficoSatisfaccion();
        case 'recomendacion': return renderGraficoRecomendacion();
        case 'limpieza': return renderGraficoLimpieza();
        case 'pilares': return renderGraficoPilares();
        default: return null;
        }
    };

    return (
        <ScrollView className="flex-1 bg-primary px-6 pt-12">
        <TouchableOpacity 
            onPress={() => { SoundService.reproducir('exito'); router.back(); }}
            className="flex-row items-center mb-6 bg-secondary py-2 px-4 rounded-full self-start border border-tertiary/20"
        >
            <Ionicons name="arrow-back" size={18} color="#31603D" style={{ marginRight: 6 }} />
            <Text className="text-primary font-bold text-xs uppercase">Volver al Menú</Text>
        </TouchableOpacity>

        {loading ? (
            <View className="flex-1 py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#F5C065" />
            <Text className="text-secondary font-bold uppercase text-xs mt-4">Procesando Métricas...</Text>
            </View>
        ) : (
            <View className="pb-12">
            {obtenerContenidoGrafico()}
            </View>
        )}
        </ScrollView>
    );
}