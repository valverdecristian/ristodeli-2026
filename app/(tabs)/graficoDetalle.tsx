import { supabase } from '@/src/services/SupabaseClient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
// import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { SoundService } from '@/src/services/soundService';
import { Ionicons } from '@expo/vector-icons';

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
        const { data, error } = await supabase
            .from('encuestas')
            .select('*');
        if (error) throw error;
        setDatosEncuestas(data || []);
        } catch (e) {
        console.error("Error cargando estadísticas: ", e);
        } finally {
        setLoading(false);
        }
    };

    // --- 🌟 CONFIGURACIÓN DE LOS GRÁFICOS DE RISTODELI ---
    const chartConfig = {
        backgroundGradientFrom: "#31603D", // Tu verde 'primary' institucional
        backgroundGradientTo: "#1E3D25",
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(245, 192, 101, ${opacity})`, // Tu ocre/amarillo 'tertiary'
        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: "6", strokeWidth: "2", stroke: "#F5C065" }
    };

    // --- 🛠️ 1. PROCESADOR DATA: SATISFACCIÓN (BarChart) ---
    const renderGraficoSatisfaccion = () => {
        const conteo = [0, 0, 0, 0, 0]; // Para niveles del 1 al 5
        datosEncuestas.forEach(e => {
        if (e.satisfaccion >= 1 && e.satisfaccion <= 5) conteo[e.satisfaccion - 1]++;
        });

        const data = {
        labels: ["1⭐", "2⭐", "3⭐", "4⭐", "5⭐"],
        datasets: [{ data: conteo }]
        };

        return (
        <View className="items-center bg-secondary p-4 rounded-3xl border border-tertiary/10 shadow-sm">
            <Text className="text-primary font-bold uppercase text-center mb-4">Puntuación General de Satisfacción</Text>
            <BarChart
            data={data}
            width={screenWidth - 64}
            height={240}
            yAxisLabel=""
            yAxisSuffix=" v"
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            style={{ borderRadius: 16 }}
            />
        </View>
        );
    };

    // --- 🛠️ 2. PROCESADOR DATA: RECOMENDACIÓN (PieChart) ---
    const renderGraficoRecomendacion = () => {
        let siRecomienda = 0;
        let noRecomienda = 0;
        datosEncuestas.forEach(e => {
        if (e.recomienda) siRecomienda++;
        else noRecomienda++;
        });

        const data = [
        { name: "Sí Recomienda", population: siRecomienda, color: "#F5C065", legendFontColor: "#31603D", legendFontSize: 12 },
        { name: "No Recomienda", population: noRecomienda, color: "#E76F51", legendFontColor: "#31603D", legendFontSize: 12 }
        ];

        return (
        <View className="bg-secondary p-4 rounded-3xl border border-tertiary/10 shadow-sm">
            <Text className="text-primary font-bold uppercase text-center mb-4">¿Recomendarían Ristodeli?</Text>
            <PieChart
            data={data}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
            />
        </View>
        );
    };

    // --- 🛠️ 3. PROCESADOR DATA: LIMPIEZA (BarChart Adaptado) ---
    const renderGraficoLimpieza = () => {
        let excelente = 0, bueno = 0, regular = 0;
        datosEncuestas.forEach(e => {
        const limpia = e.limpieza?.toLowerCase().trim();
        if (limpia === "excelente") excelente++;
        else if (limpia === "bueno") bueno++;
        else regular++;
        });

        const data = {
        labels: ["Excelente", "Bueno", "Regular"],
        datasets: [{ data: [excelente, bueno, regular] }]
        };

        return (
        <View className="items-center bg-secondary p-4 rounded-3xl border border-tertiary/10 shadow-sm">
            <Text className="text-primary font-bold uppercase text-center mb-4">Nivel de Higiene del Salón</Text>
            <BarChart
            data={data}
            width={screenWidth - 64}
            height={240}
            yAxisLabel=""
            yAxisSuffix=" respuestas"
            chartConfig={chartConfig}
            style={{ borderRadius: 16 }}
            />
        </View>
        );
    };

    // --- 🛠️ 4. PROCESADOR DATA: PILARES DE SERVICIO (LineChart) ---
    const renderGraficoPilares = () => {
        // Promediamos las últimas 5 encuestas cargadas para ver la evolución del servicio
        const ultimasEncuestas = datosEncuestas.slice(-5);
        const labels = ultimasEncuestas.map((_, index) => `E${index + 1}`);
        const dataAtencion = ultimasEncuestas.map(e => Number(e.atencion || 5));
        const dataComida = ultimasEncuestas.map(e => Number(e.comida || 5));
        const dataAmbiente = ultimasEncuestas.map(e => Number(e.ambiente || 5));

        const data = {
        labels: labels.length > 0 ? labels : ["Sin datos"],
        datasets: [
            { data: dataAtencion.length > 0 ? dataAtencion : [5], color: (opacity = 1) => `rgba(245, 192, 101, ${opacity})` }, // Atención (Ocre)
            { data: dataComida.length > 0 ? dataComida : [5], color: (opacity = 1) => `rgba(231, 111, 81, ${opacity})` },   // Comida (Naranja)
            { data: dataAmbiente.length > 0 ? dataAmbiente : [5], color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})` }   // Ambiente (Azul)
        ],
        legend: ["Atención", "Comida", "Ambiente"]
        };

        return (
        <View className="items-center bg-secondary p-4 rounded-3xl border border-tertiary/10 shadow-sm">
            <Text className="text-primary font-bold uppercase text-center mb-4">Historial Operativo (Escala 1-5)</Text>
            <LineChart
            data={data}
            width={screenWidth - 64}
            height={250}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 16 }}
            />
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