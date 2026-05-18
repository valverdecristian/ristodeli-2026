import { View, Text } from 'react-native';

export default function TabTwoScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      
      <Text className="text-3xl font-bold text-primary mb-6 text-center uppercase">
        Opciones
      </Text>
      
      <Text className="text-base text-dark text-center mb-10 leading-6">
        Desde este panel podrás gestionar los menús, realizar el escaneo de documentos para empleados y administrar la configuración de las mesas.
      </Text>

      <View 
        style={{ elevation: 5 }}
        className="bg-secondary border-2 border-primary w-full p-6 rounded-[30px] shadow-lg"
      >
        <View className="flex-row items-center mb-2">
          <Text className="text-2xl mr-3">🏗️</Text>
          <Text className="text-primary font-bold text-xl uppercase">
            Módulo en obra
          </Text>
        </View>
        
        <Text className="text-dark font-medium">
          Próxima actualización: Integración con lector de código QR y escaneo de DNI.
        </Text>
      </View>

    </View>
  );
}