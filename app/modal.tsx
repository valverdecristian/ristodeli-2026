import { Link } from 'expo-router';
import { View, Text } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      
      {/* text-primary aplica el retro-green. text-3xl aumenta el tamaño. */}
      <Text className="text-3xl font-bold text-primary mb-2 text-center">
        Menú de Comanda
      </Text>
      
      {/* text-dark aplica el russet para un contraste de lectura perfecto */}
      <Text className="text-base text-dark mb-10 text-center">
        Ejemplo de la paleta de colores aplicada a la vista.
      </Text>

      {/* Botón usando bg-tertiary (saffron) */}
      <Link href="/" className="bg-tertiary px-8 py-4 rounded-2xl active:opacity-80">
        <Text className="text-dark font-bold text-lg">
          Volver al Inicio
        </Text>
      </Link>

      {/* Una tarjeta de alerta para probar el color danger y orange */}
      <View className="mt-12 p-5 border-2 border-danger rounded-xl bg-secondary w-full">
          <Text className="text-danger font-bold text-lg text-center mb-1">
            ¡Atención!
          </Text>
          <Text className="text-orange font-semibold text-center">
            No te olvides del 20% de descuento en los juegos.
          </Text>
      </View>

    </View>
  );
}