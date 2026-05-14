import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    // Usamos el vainilla de fondo que definiste
    <View className="flex-1 items-center justify-center bg-background px-6">
      
      {/* Tu verde retro para el título principal */}
      <Text className="text-4xl font-bold text-primary mb-4 text-center">
        Comanda
      </Text>
      
      {/* El color russet para el texto de lectura */}
      <Text className="text-lg text-dark text-center mb-8">
        Sistema de gestión interna del restaurante.
      </Text>

      {/* Una tarjetita de estado usando el amarillo azafrán */}
      <View className="bg-tertiary w-full p-6 rounded-2xl shadow-sm">
        <Text className="text-dark font-bold text-xl mb-2">
          Estado Actual
        </Text>
        <Text className="text-dark text-base">
          Mesas ocupadas: 0 / 5
        </Text>
        <Text className="text-dark text-base">
          Pedidos pendientes: 0
        </Text>
      </View>

    </View>
  );
}