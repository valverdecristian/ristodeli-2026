import React from 'react';
import HomeBase from '../../src/components/HomeBase';
import { useRouter } from 'expo-router';

export default function HomeCantinero() {
    const router = useRouter();

    const accionesCantinero = [
        { title: 'Agregar bebida', icon: 'wine-outline', onPress: () => console.log('Navegar a Agregar bebida') },
        { title: 'Pedidos pendientes', icon: 'people-outline', onPress: () => console.log('Navegar a Pedidos pendientes') },
    ];

    return (
        <HomeBase roleTitle="Cantinero" buttons={accionesCantinero} />
    );
}