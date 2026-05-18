import { useAuth } from '@/src/context/AuthContext';
import { useToast } from "@/src/context/ToastContext";
import HomeClienteBase from '@/src/components/HomeClienteBase';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function PanelAccionesAnonimoScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { currentUser } = useAuth();

    if (!currentUser) {
        return (
            <View className="flex-1 bg-primary justify-center items-center">
                <ActivityIndicator size="large" color="#F5C065" />
            </View>
        );
    }

    const handleEscanearMesaAsignada = () => {
        showToast("info", "Escáner de Mesa", "Abriendo cámara para vincular tu usuario a la mesa asignada por el Metre.");

        router.push({
            pathname: "/(tabs)/mesa/escanearMesa",
            params: { clienteAnonimoId: currentUser.id }
        });
    };

    return (
        <HomeClienteBase
            nombre={currentUser.nombres}
            fotoUrl={currentUser.foto_url || ''}
            tipoCliente="anonimo"
            enListaEspera={true}
            onEscanearEntrada={() => showToast("info", "Ya registrado", "Ya te encuentras anotado en la lista de espera.")}
            onEscanearMesa={handleEscanearMesaAsignada}
            onVerEncuestas={() => router.push("/(tabs)/encuestasPrevias")}
        />
    );
}