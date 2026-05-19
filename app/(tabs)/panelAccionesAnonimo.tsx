import HomeClienteBase from '@/src/components/HomeClienteBase';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from "@/src/context/ToastContext";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
// 🌟 CORRECCIÓN 1: Importamos 'Text' que faltaba de react-native
import { ActivityIndicator, Text, View } from 'react-native';

export default function PanelAccionesAnonimoScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { currentUser } = useAuth();
    
    // 🌟 Capturamos el clienteId y el nombre que arrastramos desde el escáner de entrada
    const { clienteId, nombre } = useLocalSearchParams<{ clienteId?: string; nombre?: string }>();

    // Control de seguridad por si se pierde el ID en el enrutamiento
    if (!clienteId) {
        return (
            <View className="flex-1 bg-primary justify-center items-center">
                <ActivityIndicator size="large" color="#F5C065" />
                <Text className="text-white mt-2 text-xs uppercase">Cargando perfil temporal...</Text>
            </View>
        );
    }

    const handleEscanearMesaAsignada = () => {
        showToast("info", "Escáner de Mesa", "Abriendo cámara para vincular tu usuario a la mesa asignada por el Metre.");

        // 🌟 CORRECCIÓN 3: Mandamos el 'clienteId' correcto y 'tipoCliente' para el escáner de mesa
        router.push({
            pathname: "/(tabs)/mesa/escanearMesa" as any,
            params: { 
                clienteId: clienteId,
                tipoCliente: 'anonimo'
            }
        });
    };

    return (
        <HomeClienteBase
            // 🌟 CORRECCIÓN 2: Usamos el nombre que vino por params para no depender de currentUser
            nombre={nombre || currentUser?.nombres || 'Cliente Express'}
            fotoUrl={currentUser?.foto_url || ''}
            tipoCliente="anonimo"
            enListaEspera={true}
            onEscanearEntrada={() => showToast("info", "Ya registrado", "Ya te encuentras anotado en la lista de espera.")}
            onEscanearMesa={handleEscanearMesaAsignada}
            onVerEncuestas={() => router.push("/(tabs)/encuestasPrevias" as any)}
        />
    );
}