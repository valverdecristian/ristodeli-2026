import HomeClienteBase from '@/src/components/HomeClienteBase';
import { useToast } from "@/src/context/ToastContext";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function PanelAccionesAnonimoScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { anonimoId, anonimoNombre, anonimoFoto } = useLocalSearchParams();

    const handleEscanearMesaAsignada = () => {
        // Al estar en esta pantalla, el flag enListaEspera va true porque ya pasó el control del QR de entrada
        showToast("info", "Escáner de Mesa", "Abriendo escáner para vincularse a la mesa asignada por el Metre.");
        // router.push("/(tabs)/escanerMesaReal");
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