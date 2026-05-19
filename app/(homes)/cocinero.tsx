import HomeBase from '@/src/components/HomeBase';
import { useRouter } from 'expo-router';

export default function HomeCocinero() {
    const router = useRouter();

    const accionesCocinero = [
        { title: 'Agregar producto', icon: 'fast-food-outline', onPress: () => router.push("/(homes)/cocinero/alta")},
        { title: 'Pedidos pendientes', icon: 'people-outline', onPress: () => router.push("/(tabs)/cocinero/pedidos")},
        { title: 'Catalogo de productos', icon: 'people-outline', onPress: () => router.push("/(homes)/cocinero/menu")},
    ];

    return (
        <HomeBase roleTitle="Cocinero" buttons={accionesCocinero} />
    );
}