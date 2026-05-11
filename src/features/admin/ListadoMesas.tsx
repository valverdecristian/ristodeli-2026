import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { globalStyles } from '../../theme/globalStyles';
import { colors } from '../../theme/colors';
import { MesaService } from '../../core/services/MesaService';
import { MyIcon } from '../../shared/components/Icon';

export const ListadoMesas = () => {
    const [mesas, setMesas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const cargarMesas = async () => {
        try {
        const data = await MesaService.listarMesas();
        setMesas(data);
        } catch (error) {
        console.error('Error al cargar mesas:', error);
        } finally {
        setLoading(false);
        setRefreshing(false);
        }
    };

    useEffect(() => {
        cargarMesas();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        cargarMesas();
    };

    const renderMesa = ({ item }: any) => (
        <View style={globalStyles.ristoCard}>
        <View style={styles.headerCard}>
            <Text style={[globalStyles.title, { marginBottom: 0 }]}>Mesa #{item.numero}</Text>
            <View style={[styles.badge, { backgroundColor: item.estado === 'Libre' ? colors.retroGreen : colors.fireRed }]}>
            <Text style={styles.badgeText}>{item.estado.toUpperCase()}</Text>
            </View>
        </View>

        {item.foto && (
            <Image source={{ uri: item.foto }} style={styles.fotoMesa} resizeMode="cover" />
        )}

        <View style={styles.footerCard}>
            <View style={styles.infoItem}>
            <MyIcon name="people-outline" size={18} color={colors.saffron} />
            <Text style={styles.infoText}>{item.comensales} personas</Text>
            </View>
            <View style={styles.infoItem}>
            <MyIcon name="bookmark-outline" size={18} color={colors.saffron} />
            <Text style={styles.infoText}>{item.tipo}</Text>
            </View>
        </View>
        </View>
    );

    return (
        <View style={globalStyles.container}>
        <View style={globalStyles.content}>
            <Text style={globalStyles.title}>Estado del Salón</Text>
            
            {loading ? (
            <ActivityIndicator size="large" color={colors.saffron} style={{ marginTop: 50 }} />
            ) : (
            <FlatList
                data={mesas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMesa}
                refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.saffron} />
                }
                ListEmptyComponent={
                <Text style={[globalStyles.text, { textAlign: 'center', marginTop: 20 }]}>
                    No hay mesas cargadas todavía.
                </Text>
                }
            />
            )}
        </View>
        </View>
    );
    };

    const styles = StyleSheet.create({
    headerCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    badgeText: {
        color: colors.vanillaCream,
        fontSize: 12,
        fontWeight: 'bold',
    },
    fotoMesa: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        marginBottom: 15,
    },
    footerCard: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: 'rgba(248, 238, 203, 0.1)',
        paddingTop: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        color: colors.vanillaCream,
        marginLeft: 8,
        fontSize: 14,
    }
});