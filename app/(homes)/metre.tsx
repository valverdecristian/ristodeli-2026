import React from 'react';
import HomeBase from '../../src/components/HomeBase';
import { useRouter } from 'expo-router';

export default function HomeMetre() {
    const router = useRouter();

    const accionesMetre = [
        { title: 'Lista de espera', icon: 'people-outline', onPress: () => console.log('Navegar a Lista de espera') },
        { title: 'Asignar mesa', icon: 'person-add-outline', onPress: () => console.log('Navegar a Asignar mesa') },
        { title: 'Estado de mesas', icon: 'person-add-outline', onPress: () => console.log('Ver Estado de mesas') },
    ];

    return (
        <HomeBase roleTitle="Metre" buttons={accionesMetre} />
    );
}