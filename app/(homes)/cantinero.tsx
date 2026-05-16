import HomeBase from '@/src/components/HomeBase';
import { useRouter } from 'expo-router';

export default function HomeCantinero() {
    const router = useRouter();

    const accionesCantinero = [
        { title: 'Agregar bebida', icon: 'wine-outline', onPress: () => router.push("/(homes)/cantinero/alta")},
        { title: 'Pedidos pendientes', icon: 'people-outline', onPress: () => console.log('Navegar a Pedidos pendientes') },
        { title: 'Menu bebidas', icon: 'people-outline', onPress: () => router.push("/(homes)/cantinero/menu")},
    ];

    return (
        <HomeBase roleTitle="Cantinero" buttons={accionesCantinero} />
    );
}