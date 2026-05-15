import HomeBase from '@/src/components/HomeBase';
import { useRouter } from 'expo-router';

export default function HomeDuenio() {
    const router = useRouter();

    const accionesDueno = [
        { title: 'Agregar Empleado', icon: 'person-add-outline', onPress: () => router.push('/agregar-empleado') },
        { title: 'Alta mesa', icon: 'grid-outline', onPress: () => router.push('/alta-mesa') },
        { title: 'Listado de mesas', icon: 'grid-outline',  onPress: () => router.push('/listado-mesas') },
        { title: 'Aprobar clientes', icon: 'people-outline', onPress: () => router.push('/aprobar-clientes')  },
        { title: 'Visualizar encuestas', icon: 'people-outline', onPress: () => router.push('/visualizar-encuestas') },
    ];

    return (
        <HomeBase roleTitle="Dueño" buttons={accionesDueno} />
    );
}