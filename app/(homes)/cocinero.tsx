import HomeBase from '@/src/components/HomeBase';
import { useRouter } from 'expo-router';

export default function HomeCocinero() {
    const router = useRouter();

    const accionesCocinero = [
        { title: 'Agregar plato', icon: 'fast-food-outline', onPress: () => console.log('Navegar a Agregar plato') },
        { title: 'Pedidos pendientes', icon: 'people-outline', onPress: () => console.log('Navegar a ver pedidos pendientes') },
    ];

    return (
        <HomeBase roleTitle="Cocinero" buttons={accionesCocinero} />
    );
}