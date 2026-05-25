import HomeBase from '@/src/components/HomeBase';
import { useRouter } from 'expo-router';

export default function HomeMetre() {
    const router = useRouter();

    const accionesMetre = [
        { title: 'Asignar mesa', icon: 'people-outline', onPress: () => router.push('/(tabs)/metre/asignarMesa')},
        { title: 'Estado de mesas', icon: 'grid-outline', onPress: () => router.push('/(tabs)/metre/estadoMesas')},
        { title: 'Registrar Cliente', icon: 'person-add-outline', onPress: () => router.push('/(tabs)/metre/agregarCliente')},
    ];

    return (
        <HomeBase roleTitle="Metre" buttons={accionesMetre} />
    );
}