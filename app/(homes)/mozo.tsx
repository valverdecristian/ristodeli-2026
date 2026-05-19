import HomeBase from '@/src/components/HomeBase';
import { useRouter } from 'expo-router';

export default function HomeMozo() {
    const router = useRouter();

    const accionesMozo = [
        { title: 'Consultas de clientes', icon: 'person-add-outline', onPress: () => router.push('/(homes)/mozo/consultasClientes' as any) },
        { title: 'Confirmar pedido', icon: 'person-add-outline', onPress: () => router.push('/(homes)/mozo/confirmarPedido') },
        { title: 'Entregar pedido', icon: 'people-outline', onPress: () => router.push('/(homes)/mozo/entregarPedido' as any) },
        { title: 'Cobrar cuenta', icon: 'people-outline', onPress: () => console.log('Ir a Cobrar cuenta')},
    ];

    return (
        <HomeBase roleTitle="Mozo" buttons={accionesMozo} />
    );
}