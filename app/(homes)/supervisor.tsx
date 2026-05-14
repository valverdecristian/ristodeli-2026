import React from 'react';
import HomeBase from '../../src/components/HomeBase';
import { useRouter } from 'expo-router';

export default function HomeSupervisor() {
    const router = useRouter();

    const accionesSupervisor = [
        { title: 'Agregar Empleado', icon: 'people-outline', onPress: () => router.push('/(admin)/agregar-empleado')},
        { title: 'Alta mesa', icon: 'people-outline', onPress: () => router.push('/(admin)/alta-mesa') },
        { title: 'Listado de mesas', icon: 'people-outline', onPress: () => router.push('/(admin)/listado-mesas')  },
        { title: 'Aprobar clientes', icon: 'person-add-outline',onPress: () => router.push('/(admin)/aprobar-clientes') },
        { title: 'Visualizar encuestas', icon: 'person-add-outline', onPress: () => router.push('/(admin)/visualizar-encuestas')},
    ];

    return (
        <HomeBase roleTitle="Supervisor" buttons={accionesSupervisor} />
    );
}