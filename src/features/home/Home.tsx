import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { supabase } from '../../core/services/supabase';
import { colors } from '../../theme/colors';
import { MyIcon } from '../../shared/components/Icon';
import { ToastService } from '../../core/services/ToastService';

// 1. Definimos la estructura de una "Acción"
interface Action {
  label: string;
  icon: string;
  onPress: () => void;
  roles: string[]; // Qué roles pueden ver este botón
}

export const Home = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('cliente');

  // 2. Mapa de todas las acciones según tu diagrama
  const allActions: Action[] = [
    // Acciones de Gestión (Admin y Supervisor)
    { label: 'Agregar Empleado', icon: 'person-add-outline', roles: ['admin', 'supervisor'], onPress: () => { } },
    { label: 'Agregar Mesa', icon: 'add-circle-outline', roles: ['admin', 'supervisor'], onPress: () => navigation.navigate('AgregarMesa') },
    { label: 'Lista de Mesas', icon: 'list-outline', roles: ['admin', 'supervisor'], onPress: () => navigation.navigate('ListadoMesas') },
    { label: 'Gestión de Clientes', icon: 'people-outline', roles: ['admin', 'supervisor'], onPress: () => { } },

    // Acciones de Cocina
    { label: 'Alta Plato', icon: 'restaurant-outline', roles: ['cocinero'], onPress: () => { } },
    { label: 'Alta Postre', icon: 'ice-cream-outline', roles: ['cocinero'], onPress: () => { } },
    { label: 'Menú Platos', icon: 'fast-food-outline', roles: ['cocinero'], onPress: () => { } },
    { label: 'Menú Postres', icon: 'ice-cream-outline', roles: ['cocinero'], onPress: () => { } },
    // Acciones de Cantina
    { label: 'Alta Bebida', icon: 'wine-outline', roles: ['cantinero'], onPress: () => { } },
    { label: 'Menú Bebidas', icon: 'beer-outline', roles: ['cantinero'], onPress: () => { } },
    { label: 'Pedidos Pendientes', icon: 'clipboard-outline', roles: ['cocinero', 'cantinero'], onPress: () => { } },

    // Acciones de Metre
    { label: 'Crear Cliente', icon: 'person-add-outline', roles: ['metre'], onPress: () => { } },
    { label: 'Lista de Espera', icon: 'people-outline', roles: ['metre'], onPress: () => { } },
    { label: 'Lista de Mesas', icon: 'list-outline', roles: ['metre'], onPress: () => navigation.navigate('ListadoMesas') },

    // Acciones de Mozo
    { label: 'Lista de Pedidos', icon: 'clipboard-outline', roles: ['mozo'], onPress: () => { } },
    { label: 'Consultas', icon: 'help-circle-outline', roles: ['mozo'], onPress: () => { } },

    // Acciones de Cliente Registrado
    { label: 'Escanear QR de Entrada', icon: 'qr-code-outline', roles: ['cliente_reg', 'cliente_anon'], onPress: () => { } },
    { label: 'Ver Menú', icon: 'restaurant-outline', roles: ['cliente_reg', 'cliente_anon'], onPress: () => { } },
    { label: 'Consultar al Mozo', icon: 'help-circle-outline', roles: ['cliente_reg', 'cliente_anon'], onPress: () => { } },
  ];

  useEffect(() => {
    obtenerPerfil();
  }, []);

  const obtenerPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Consultamos el rol en la tabla usuarios de Supabase
        const { data: usuarioData, error } = await supabase
          .from('usuarios')
          .select('perfil')
          .eq('email', user.email)
          .single();

        if (usuarioData && usuarioData.perfil) {
          setUserRole(usuarioData.perfil);
        } else {
          // Si no está en la tabla usuarios, caemos al user_metadata por precaución
          const role = user.user_metadata?.role || 'cliente_reg'; 
          setUserRole(role);
        }
      }
    } catch (e) {
      console.log('Error obteniendo perfil:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    ToastService.mostrarExito('Sesión cerrada');
    navigation.replace('Login');
  };

  // 3. Filtramos las acciones según el rol actual
  const filteredActions = allActions.filter(action => action.roles.includes(userRole));

  if (loading) {
    return (
      <View className="flex-1 bg-retro-green justify-center items-center p-5">
        <ActivityIndicator size="large" color={colors.saffron} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-retro-green">
      <View className="flex-row justify-between p-5 bg-black/20">
        <Text className="text-vanilla-cream text-lg font-bold">Panel: {userRole.toUpperCase()}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <MyIcon name="log-out-outline" color={colors.vanillaCream} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerClassName="flex-row flex-wrap justify-around p-2.5">
        {filteredActions.map((action, index) => (
          <TouchableOpacity 
            key={index} 
            className="w-[45%] bg-vanilla-cream rounded-2xl p-5 items-center mb-5 shadow-sm elevation-4" 
            onPress={action.onPress}
          >
            <View className="w-[70px] h-[70px] rounded-full bg-saffron justify-center items-center mb-2.5">
              <MyIcon name={action.icon} size={35} color={colors.russet} />
            </View>
            <Text className="text-russet font-bold text-center text-sm">{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};


