import React from 'react';
import HomeBase from '../../src/components/HomeBase';
import { useRouter } from 'expo-router';

export default function HomeMozo() {
    const router = useRouter();

    const accionesMozo = [
        { title: 'Consultas de clientes', icon: 'person-add-outline', onPress: () => console.log('Navegar a Consultas de clientes') },
        { title: 'Confirmar pedido', icon: 'person-add-outline', onPress: () => console.log('Navegar a Confirmar pedido') },
        { title: 'Entregar pedido', icon: 'people-outline', onPress: () => console.log('ir a Entregar pedido') },
        { title: 'Cobrar cuenta', icon: 'people-outline', onPress: () => console.log('Ir a Cobrar cuenta')},
    ];

    return (
        <HomeBase roleTitle="Mozo" buttons={accionesMozo} />
    );
}