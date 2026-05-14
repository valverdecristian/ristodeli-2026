import { View, Text } from 'react-native';

export default function TabTwoScreen() {
  return (
    // bg-background aplica tu color vanilla-cream
    <View className="flex-1 items-center justify-center bg-background px-6">
      
      {/* text-primary aplica tu retro-green */}
      <Text className="text-3xl font-bold text-primary mb-6 text-center">
        Opciones
      </Text>
      
      {/* text-dark aplica tu russet para un contraste perfecto */}
      <Text className="text-base text-dark text-center mb-8">
        Acá vas a poder agregar la lógica de los menús, el escaneo de DNI para los empleados y la gestión de mesas.
      </Text>

      {/* Tarjeta de prueba combinando secondary y primary */}
      <View className="bg-secondary border-2 border-primary w-full p-5 rounded-xl shadow-sm">
        <Text className="text-primary font-bold text-lg mb-1">
          Módulo en construcción
        </Text>
        <Text className="text-dark">
          Próximamente: Lector de código QR.
        </Text>
      </View>

    </View>
  );
}