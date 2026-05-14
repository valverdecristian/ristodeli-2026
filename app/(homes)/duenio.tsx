import React from 'react';
import HomeBase from '../../src/components/HomeBase';
import { useRouter } from 'expo-router';

export default function HomeDuenio() {
    const router = useRouter();

    const accionesDueno = [
        { title: 'Agregar Empleado', icon: 'person-add-outline', onPress: () => router.push('/(admin)/agregar-empleado') },
        { title: 'Alta mesa', icon: 'grid-outline', onPress: () => router.push('/(admin)/alta-mesa') },
        { title: 'Listado de mesas', icon: 'grid-outline',  onPress: () => router.push('/(admin)/listado-mesas') },
        { title: 'Aprobar clientes', icon: 'people-outline', onPress: () => router.push('/(admin)/aprobar-clientes')  },
        { title: 'Visualizar encuestas', icon: 'people-outline', onPress: () => router.push('/(admin)/visualizar-encuestas') },
    ];

    return (
        <HomeBase roleTitle="Dueño" buttons={accionesDueno} />
    );
}