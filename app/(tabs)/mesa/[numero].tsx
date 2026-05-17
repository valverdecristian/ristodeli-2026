import { useRouter, useLocalSearchParams } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function VistaMesa() {
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 justify-between px-6 py-10">
        <View className="items-center pt-20">
          <Text className="text-tertiary font-bold text-lg uppercase tracking-widest">
            Mesa
          </Text>
          <Text className="text-white font-black text-7xl mt-2">
            N° {numero}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-tertiary rounded-full py-5 items-center mx-10"
        >
          <View className="flex-row items-center">
            <Ionicons name="arrow-back" size={22} color="#31603D" />
            <Text className="text-primary font-bold text-lg uppercase ml-2">
              Volver
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
