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
        // router.push("/(tabs)/escanerMesaReal");
    };

    const handleIrAJuegos = () => {
        showToast("success", "Módulo Juegos", "Redirigiendo a la zona de juegos para conseguir descuentos.");
        // router.push("/(tabs)/juegos");
    };

    return (
        <HomeClienteBase
        nombre={usuarioNombre as string}
        fotoUrl={usuarioFoto as string}
        tipoCliente="registrado" // 🌟 Cambia a registrado para prender las opciones extra si las necesitás
        enListaEspera={true}      // Si está acá, ya escaneó el QR de entrada
        onEscanearEntrada={() => showToast("info", "Ya registrado", "Ya te encuentras en la lista de espera del local.")}
        onEscanearMesa={handleEscanearMesaCliente}
        onVerEncuestas={() => router.push("/(tabs)/encuestasPrevias")}
        
        // 🌟 BOTÓN EXTRA EXCLUSIVO: Solo visible para clientes normales gracias a la arquitectura que armamos
        onAccionAdicional={handleIrAJuegos}
        textoAccionAdicional="Sección de Juegos"
        iconoAccionAdicional="game-controller-outline"
        />
    );
}