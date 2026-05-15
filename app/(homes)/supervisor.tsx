import HomeBase from '@/src/components/HomeBase';
import { useRouter } from 'expo-router';

export default function HomeSupervisor() {
    const router = useRouter();

    const accionesSupervisor = [
        { title: 'Agregar Empleado', icon: 'people-outline', onPress: () => router.push('/agregar-empleado')},
        { title: 'Alta mesa', icon: 'people-outline', onPress: () => router.push('/alta-mesa') },
        { title: 'Listado de mesas', icon: 'people-outline', onPress: () => router.push('/listado-mesas')  },
        { title: 'Aprobar clientes', icon: 'person-add-outline',onPress: () => router.push('/aprobar-clientes') },
        { title: 'Visualizar encuestas', icon: 'person-add-outline', onPress: () => router.push('/visualizar-encuestas')},
    ];

    return (
        <HomeBase roleTitle="Supervisor" buttons={accionesSupervisor} />
    );
}