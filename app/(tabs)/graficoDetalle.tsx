import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EncuestaService } from '@/src/services/encuestaService';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { SoundService } from '@/src/services/soundService';
import LoadingModal from '@/src/components/LoadingModal';
import { SafeAreaView } from 'react-native-safe-area-context';

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
            const data = await EncuestaService.obtenerTodas();
            setDatosEncuestas(data);
        } catch (e) {
            console.error("Error cargando estadísticas: ", e);
        } finally {
            setLoading(false);
        }
    };

    // SATISFACCION 
    const renderGraficoSatisfaccion = () => {
        const total = datosEncuestas.length;
        const conteo = [0, 0, 0, 0, 0];
        let suma = 0;

        datosEncuestas.forEach(e => {
            if (e.satisfaccion >= 1 && e.satisfaccion <= 5) {
                conteo[e.satisfaccion - 1]++;
                suma += e.satisfaccion;
            }
        });

        const promedio = total > 0 ? (suma / total).toFixed(1) : '0';

        const barData = [
            { value: conteo[0], label: '1⭐', frontColor: '#E76F51' },
            { value: conteo[1], label: '2⭐', frontColor: '#F5C065' },
            { value: conteo[2], label: '3⭐', frontColor: '#F5C065' },
            { value: conteo[3], label: '4⭐', frontColor: '#31603D', opacity: 0.7 },
            { value: conteo[4], label: '5⭐', frontColor: '#31603D' },
        ];

        return (
            <View className="space-y-6">
                {/* Contenedor del Gráfico */}
                <View className="bg-secondary p-5 rounded-[30px] border border-tertiary/10 shadow-xl items-center mb-6">
                    <Text className="text-primary font-black text-lg uppercase text-center mb-6 tracking-tight">Puntuación de Satisfacción</Text>
                    <BarChart
                        data={barData}
                        barWidth={36}
                        capThickness={2}
                        capColor={'#1E3D25'}
                        rulesColor={'rgba(49, 96, 61, 0.1)'}
                        xAxisLabelTextStyle={{ color: '#31603D', fontWeight: 'bold', fontSize: 12 }}
                        yAxisTextStyle={{ color: '#31603D' }}
                        noOfSections={4}
                        width={screenWidth - 120}
                        height={200}
                    />
                </View>

                {/* Tarjetas de Resumen */}
                <View className="flex-row justify-between gap-4 mb-6">
                    <View className="flex-1 bg-secondary p-5 rounded-[24px] border border-tertiary/10 shadow-md items-center">
                        <Ionicons name="star" size={28} color="#F5C065" />
                        <Text className="text-primary font-black text-3xl mt-2">{promedio}</Text>
                        <Text className="text-primary/50 text-[10px] uppercase font-bold mt-1 text-center">Puntaje Promedio</Text>
                    </View>

                    <View className="flex-1 bg-secondary p-5 rounded-[24px] border border-tertiary/10 shadow-md items-center">
                        <Ionicons name="people-outline" size={28} color="#31603D" />
                        <Text className="text-primary font-black text-3xl mt-2">{total}</Text>
                        <Text className="text-primary/50 text-[10px] uppercase font-bold mt-1 text-center">Opiniones Totales</Text>
                    </View>
                </View>

                {/* Desglose de Calificaciones */}
                <View className="bg-secondary p-6 rounded-[30px] border border-tertiary/10 shadow-xl">
                    <Text className="text-primary font-bold text-sm uppercase mb-4 tracking-wider">Desglose de Calificaciones</Text>
                    {[5, 4, 3, 2, 1].map((estrellas) => {
                        const cant = conteo[estrellas - 1];
                        const porcentaje = total > 0 ? (cant / total) * 100 : 0;
                        return (
                            <View key={estrellas} className="flex-row items-center mb-3.5">
                                <Text className="text-primary font-bold text-xs w-8">{estrellas} ⭐</Text>
                                <View className="flex-1 h-3 bg-primary/10 rounded-full mx-3 overflow-hidden">
                                    <View style={{ width: `${porcentaje}%` }} className="h-full bg-primary rounded-full" />
                                </View>
                                <Text className="text-primary font-bold text-xs w-10 text-right">{cant}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    // RECOMENDACION 
    const renderGraficoRecomendacion = () => {
        let siRecomienda = 0;
        let noRecomienda = 0;
        datosEncuestas.forEach(e => {
            if (e.recomienda) siRecomienda++;
            else noRecomienda++;
        });

        const total = siRecomienda + noRecomienda;
        const porcentajeSi = total > 0 ? ((siRecomienda / total) * 100).toFixed(0) : '0';

        const pieData = [
            { value: siRecomienda, color: '#31603D', text: `${porcentajeSi}%` },
            { value: noRecomienda || 0.0001, color: '#E76F51', text: noRecomienda > 0 ? `${(100 - Number(porcentajeSi))}%` : '' }
        ];

        return (
            <View className="space-y-6">
                {/* Contenedor del Gráfico */}
                <View className="bg-secondary p-5 rounded-[30px] border border-tertiary/10 shadow-xl items-center mb-6">
                    <Text className="text-primary font-black text-lg uppercase text-center mb-6 tracking-tight">Índice de Recomendación</Text>
                    <PieChart
                        data={pieData}
                        donut
                        showText
                        textColor="white"
                        textSize={14}
                        radius={110}
                        innerRadius={70}
                        innerCircleColor="#F4F4F9"
                        focusOnPress
                    />
                    <View className="flex-row justify-center mt-6 gap-6">
                        <View className="flex-row items-center">
                            <View className="w-3.5 h-3.5 bg-primary rounded-full mr-2" />
                            <Text className="text-xs text-primary font-bold uppercase">Recomienda ({siRecomienda})</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="w-3.5 h-3.5 bg-[#E76F51] rounded-full mr-2" />
                            <Text className="text-xs text-primary font-bold uppercase">No Recomienda ({noRecomienda})</Text>
                        </View>
                    </View>
                </View>

                {/* Tarjeta de Destacado / Insight */}
                <View className="bg-secondary p-6 rounded-[30px] border border-tertiary/10 shadow-xl items-center">
                    <View className="bg-primary/10 p-4 rounded-full mb-3">
                        <Ionicons name="bulb-outline" size={32} color="#31603D" />
                    </View>
                    <Text className="text-primary font-black text-3xl text-center">{porcentajeSi}%</Text>
                    <Text className="text-primary/50 text-[10px] uppercase font-bold mt-1 mb-3 text-center">Tasa de Aprobación de Clientes</Text>
                    <Text className="text-primary/85 font-semibold text-xs text-center px-4 leading-relaxed">
                        {Number(porcentajeSi) >= 80
                            ? "¡Excelente índice! La gran mayoría de tus clientes recomendaría el restaurante a sus amigos."
                            : "Atención: hay un porcentaje significativo de clientes insatisfechos. Se recomienda evaluar sus comentarios."}
                    </Text>
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

        const total = excelente + bueno + regular;
        const tasaAceptacion = total > 0 ? (((excelente + bueno) / total) * 100).toFixed(0) : '0';

        const barData = [
            { value: excelente, label: 'Excelente', frontColor: '#31603D' },
            { value: bueno, label: 'Bueno', frontColor: '#F5C065' },
            { value: regular, label: 'Regular', frontColor: '#E76F51' }
        ];

        return (
            <View className="space-y-6">
                {/* Contenedor del Gráfico */}
                <View className="bg-secondary p-5 rounded-[30px] border border-tertiary/10 shadow-xl items-center mb-6">
                    <Text className="text-primary font-black text-lg uppercase text-center mb-6 tracking-tight">Higiene y Limpieza del Salón</Text>
                    <BarChart
                        data={barData}
                        barWidth={44}
                        xAxisLabelTextStyle={{ color: '#31603D', fontSize: 11, fontWeight: 'bold' }}
                        yAxisTextStyle={{ color: '#31603D' }}
                        rulesColor={'rgba(49, 96, 61, 0.1)'}
                        width={screenWidth - 120}
                        height={200}
                    />
                </View>

                {/* Tarjetas de Resumen */}
                <View className="flex-row justify-between gap-4 mb-6">
                    <View className="flex-1 bg-secondary p-5 rounded-[24px] border border-tertiary/10 shadow-md items-center">
                        <Ionicons name="shield-checkmark-outline" size={28} color="#10B981" />
                        <Text className="text-primary font-black text-3xl mt-2">{tasaAceptacion}%</Text>
                        <Text className="text-primary/50 text-[10px] uppercase font-bold mt-1 text-center">Tasa Limpieza Aceptable</Text>
                    </View>

                    <View className="flex-1 bg-secondary p-5 rounded-[24px] border border-tertiary/10 shadow-md items-center">
                        <Ionicons name="sparkles-outline" size={28} color="#F5C065" />
                        <Text className="text-primary font-black text-3xl mt-2">{excelente}</Text>
                        <Text className="text-primary/50 text-[10px] uppercase font-bold mt-1 text-center">Votos Excelente</Text>
                    </View>
                </View>

                {/* Desglose */}
                <View className="bg-secondary p-6 rounded-[30px] border border-tertiary/10 shadow-xl">
                    <Text className="text-primary font-bold text-sm uppercase mb-4 tracking-wider">Desglose de Respuestas</Text>
                    {[
                        { label: 'Excelente ✨', cant: excelente, color: '#31603D' },
                        { label: 'Bueno 👍', cant: bueno, color: '#F5C065' },
                        { label: 'Regular ⚠️', cant: regular, color: '#E76F51' }
                    ].map((item) => {
                        const porcentaje = total > 0 ? (item.cant / total) * 100 : 0;
                        return (
                            <View key={item.label} className="flex-row items-center mb-3.5">
                                <Text className="text-primary font-bold text-xs w-24">{item.label}</Text>
                                <View className="flex-1 h-3 bg-primary/10 rounded-full mx-3 overflow-hidden">
                                    <View style={{ width: `${porcentaje}%`, backgroundColor: item.color }} className="h-full rounded-full" />
                                </View>
                                <Text className="text-primary font-bold text-xs w-10 text-right">{item.cant}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderGraficoPilares = () => {
        const ultimasEncuestas = datosEncuestas.slice(-5);

        const lineDataAtencion = ultimasEncuestas.map(e => ({ value: Number(e.atencion || 5) }));
        const lineDataComida = ultimasEncuestas.map(e => ({ value: Number(e.comida || 5) }));
        const lineDataAmbiente = ultimasEncuestas.map(e => ({ value: Number(e.ambiente || 5) }));

        // Calcular promedios de pilares
        const total = datosEncuestas.length;
        const promedioAtencion = total > 0 ? (datosEncuestas.reduce((acc, e) => acc + Number(e.atencion || 5), 0) / total).toFixed(1) : '0';
        const promedioComida = total > 0 ? (datosEncuestas.reduce((acc, e) => acc + Number(e.comida || 5), 0) / total).toFixed(1) : '0';
        const promedioAmbiente = total > 0 ? (datosEncuestas.reduce((acc, e) => acc + Number(e.ambiente || 5), 0) / total).toFixed(1) : '0';

        return (
            <View className="space-y-6">
                {/* Contenedor del Gráfico */}
                <View className="bg-secondary p-5 rounded-[30px] border border-tertiary/10 shadow-xl items-center mb-6">
                    <Text className="text-primary font-black text-lg uppercase text-center mb-6 tracking-tight">Evolución de Pilares (Últimas 5)</Text>
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
                        width={screenWidth - 120}
                        height={180}
                    />
                    <View className="flex-row justify-center gap-4 mt-6">
                        <Text className="text-[10px] font-black text-amber-500 uppercase">● Atención</Text>
                        <Text className="text-[10px] font-black text-red-500 uppercase">● Comida</Text>
                        <Text className="text-[10px] font-black text-blue-500 uppercase">● Ambiente</Text>
                    </View>
                </View>

                {/* Tarjetas de Promedios por Pilar */}
                <View className="bg-secondary p-6 rounded-[30px] border border-tertiary/10 shadow-xl">
                    <Text className="text-primary font-bold text-sm uppercase mb-4 tracking-wider">Promedio de los Pilares</Text>

                    {/* Pilar 1: Atención */}
                    <View className="mb-4">
                        <View className="flex-row justify-between mb-1.5">
                            <Text className="text-primary font-bold text-xs uppercase">Atención y Servicio</Text>
                            <Text className="text-primary font-black text-xs">{promedioAtencion} / 10</Text>
                        </View>
                        <View className="h-3 bg-primary/10 rounded-full overflow-hidden">
                            <View style={{ width: `${Number(promedioAtencion) * 10}%` }} className="h-full bg-amber-400 rounded-full" />
                        </View>
                    </View>

                    {/* Pilar 2: Comida */}
                    <View className="mb-4">
                        <View className="flex-row justify-between mb-1.5">
                            <Text className="text-primary font-bold text-xs uppercase">Calidad de la Comida</Text>
                            <Text className="text-primary font-black text-xs">{promedioComida} / 10</Text>
                        </View>
                        <View className="h-3 bg-primary/10 rounded-full overflow-hidden">
                            <View style={{ width: `${Number(promedioComida) * 10}%` }} className="h-full bg-red-400 rounded-full" />
                        </View>
                    </View>

                    {/* Pilar 3: Ambiente */}
                    <View className="mb-2">
                        <View className="flex-row justify-between mb-1.5">
                            <Text className="text-primary font-bold text-xs uppercase">Ambiente y Música</Text>
                            <Text className="text-primary font-black text-xs">{promedioAmbiente} / 10</Text>
                        </View>
                        <View className="h-3 bg-primary/10 rounded-full overflow-hidden">
                            <View style={{ width: `${Number(promedioAmbiente) * 10}%` }} className="h-full bg-blue-400 rounded-full" />
                        </View>
                    </View>
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
        <SafeAreaView className="flex-1 bg-primary">
            {/* Cabecera / Botón Volver */}
            <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center justify-between shadow-2xl">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={async () => {
                            await SoundService.reproducir('exito');
                            router.back();
                        }}
                        className="mr-3"
                    >
                        <Ionicons name="arrow-back" size={30} color="#31603D" />
                    </TouchableOpacity>
                    <Text className="text-primary font-bold text-2xl uppercase tracking-tighter">Métricas</Text>
                </View>
                <Ionicons name="analytics-outline" size={28} color="#31603D" />
            </View>

            <ScrollView className="flex-1 px-6 mt-4" showsVerticalScrollIndicator={false}>
                <LoadingModal visible={loading} message="Procesando Métricas..." />

                {!loading && (
                    <View className="pb-12">
                        {obtenerContenidoGrafico()}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}