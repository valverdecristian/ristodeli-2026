import HomeClienteBase from '@/src/components/HomeClienteBase';
import { useToast } from "@/src/context/ToastContext";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function PanelAccionesAnonimoScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { anonimoId, anonimoNombre, anonimoFoto } = useLocalSearchParams();

    const handleEscanearMesaAsignada = () => {
        showToast("info", "Escáner de Mesa", "Abriendo cámara para vincular tu usuario a la mesa asignada por el Metre.");
    
        router.push({
            pathname: "/(tabs)/mesa/escanearMesa",
            params: { clienteAnonimoId: anonimoId } 
        });
    };

    return (
        <HomeClienteBase
        nombre={anonimoNombre as string}
        fotoUrl={anonimoFoto as string}
        tipoCliente="anonimo"
        enListaEspera={true} 
        onEscanearEntrada={() => showToast("info", "Ya registrado", "Ya te encuentras anotado en la lista de espera.")}
        onEscanearMesa={handleEscanearMesaAsignada}
        onVerEncuestas={() => router.push("/(tabs)/encuestasPrevias")}
        />
    );
}