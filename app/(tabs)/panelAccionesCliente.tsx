import HomeClienteBase from '@/src/components/HomeClienteBase';
import { useToast } from "@/src/context/ToastContext";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function PanelAccionesClienteScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { usuarioId, usuarioNombre, usuarioFoto } = useLocalSearchParams();

    const handleEscanearMesaCliente = () => {
        showToast("info", "Escáner de Mesa", "Abriendo cámara para vincular tu usuario a la mesa asignada por el Metre.");
        router.push("/(tabs)/mesa/escanearMesa"); 
    };

    return (
        <HomeClienteBase
        nombre={usuarioNombre as string}
        fotoUrl={usuarioFoto as string}
        tipoCliente="registrado"
        enListaEspera={true}     
        onEscanearEntrada={() => showToast("info", "Ya registrado", "Ya te encuentras en la lista de espera del local.")}
        onEscanearMesa={handleEscanearMesaCliente}
        onVerEncuestas={() => router.push("/(tabs)/encuestasPrevias")}
        
        />
    );
}