import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { supabase } from '../../core/services/supabase';
import { colors } from '../../theme/colors';
import { globalStyles } from '../../theme/globalStyles';
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
    { label: 'Agregar Mesa', icon: 'add-circle-outline', roles: ['admin', 'supervisor'], onPress: () => { } },
    { label: 'Lista de Mesas', icon: 'list-outline', roles: ['admin', 'supervisor'], onPress: () => { } },
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
    { label: 'Lista de Mesas', icon: 'list-outline', roles: ['metre'], onPress: () => { } },

    // Acciones de Mozo
    { label: 'Lista de Pedidos', icon: 'clipboard-outline', roles: ['mozo'], onPress: () => { } },
    { label: 'Consultas', icon: 'help-circle-outline', roles: ['mozo'], onPress: () => { } },
    
  ];

  // useEffect(() => {
  //   const fetchUser = async () => {
  //     const { data: { user } } = await supabase.auth.getUser();
  //     if (user) {
  //       setUser(user);
  //     } else {
  //       // Si no hay sesión, volver al login (protección de ruta básica)
  //       navigation.replace('Login');
  //     }
  //     setLoading(false);
  //   };

  //   fetchUser();
  // }, []);

  // const handleLogout = async () => {
  //   await supabase.auth.signOut();
  //   navigation.replace('Login');
  // };

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
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.saffron} />
      </View>
    );
  }

  // return (
  //   <View style={[globalStyles.container, styles.center]}>
  //     <Text style={styles.title}>¡Bienvenido!</Text>
  //     <Text style={styles.subtitle}>Conexión con Supabase exitosa</Text>
      
  //     <View style={styles.card}>
  //       <Text style={styles.infoText}>Has ingresado con la cuenta:</Text>
  //       <Text style={styles.emailText}>{user?.email}</Text>
  //       <Text style={styles.infoText}>ID (UUID):</Text>
  //       <Text style={styles.uuidText}>{user?.id}</Text>
  //     </View>

  //     <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
  //       <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
  //     </TouchableOpacity>
  //   </View>
  // );

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.roleTitle}>Panel: {userRole.toUpperCase()}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <MyIcon name="log-out-outline" color={colors.vanillaCream} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.menuGrid}>
        {filteredActions.map((action, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.actionButton} 
            onPress={action.onPress}
          >
            <View style={styles.iconCircle}>
              <MyIcon name={action.icon} size={35} color={colors.russet} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  roleTitle: {
    color: colors.vanillaCream,
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  actionButton: {
    width: '45%',
    backgroundColor: colors.vanillaCream,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.saffron,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    color: colors.russet,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.vanillaCream,
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.saffron,
    marginBottom: 40,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.vanillaCream,
    padding: 20,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.saffron,
  },
  infoText: {
    color: colors.russet,
    fontSize: 14,
    marginBottom: 5,
  },
  emailText: {
    color: colors.retroGreen,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  uuidText: {
    color: colors.purple,
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: colors.fireRed,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 3,
  },
  logoutText: {
    color: colors.vanillaCream,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  }
});
