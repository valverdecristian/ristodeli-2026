import HomeBase from '@/src/components/HomeBase';
import { supabase } from '@/src/services/SupabaseClient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

export default function HomeMozo() {
    const router = useRouter();
    const [noLeidos, setNoLeidos] = useState(0);

    const fetchNoLeidos = async () => {
        const { count } = await supabase
            .from('consultas')
            .select('*', { count: 'exact', head: true })
            .eq('leido', false);

        setNoLeidos(count ?? 0);
    };

    useEffect(() => {
        fetchNoLeidos();

        const channel = supabase
            .channel('mozo_badge')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'consultas' }, () => {
                fetchNoLeidos();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const accionesMozo = [
        { title: 'Consultas de clientes', icon: 'chatbubble-ellipses', onPress: () => router.push('/(homes)/mozo/consultasClientes' as any), badge: noLeidos },
        { title: 'Confirmar pedido', icon: 'checkmark-circle', onPress: () => router.push('/(homes)/mozo/confirmarPedido') },
        { title: 'Entregar pedido', icon: 'bicycle', onPress: () => router.push('/(homes)/mozo/entregarPedido' as any) },
        { title: 'Cobrar cuenta', icon: 'cash', onPress: () => console.log('Ir a Cobrar cuenta')},
    ];

    return (
        <HomeBase roleTitle="Mozo" buttons={accionesMozo} />
    );
}
