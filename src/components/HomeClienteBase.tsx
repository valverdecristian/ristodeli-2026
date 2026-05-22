import { Ionicons } from "@expo/vector-icons";
import React, { ComponentProps } from "react";
import { Image, Text, TouchableOpacity, View, ScrollView } from "react-native";
// 🌟 IMPORTANTE: SafeAreaView es lo que evita que se pegue al borde superior
import { SafeAreaView } from "react-native-safe-area-context"; 

interface HomeClienteBaseProps {
  nombre: string;
  fotoUrl: string;
  tipoCliente: "registrado" | "anonimo";
  enListaEspera: boolean;
  onEscanearEntrada: () => void;
  onEscanearMesa: () => void;
  onVerEncuestas: () => void;
  onJuegos: () => void;
  onLogout: () => void;
  onAccionAdicional?: () => void;
  textoAccionAdicional?: string;
  iconoAccionAdicional?: ComponentProps<typeof Ionicons>["name"];
}

export default function HomeClienteBase({
  nombre,
  fotoUrl,
  tipoCliente,
  enListaEspera,
  onEscanearEntrada,
  onEscanearMesa,
  onVerEncuestas,
  onJuegos,
  onLogout,
  onAccionAdicional,
  textoAccionAdicional,
  iconoAccionAdicional,
}: HomeClienteBaseProps) {
  return (
    <SafeAreaView className="flex-1 bg-primary">
      
      {/* 🌟 HEADER TIPO "DUEÑO" 🌟 */}
      {/* Usamos bg-tertiary para emular la barra superior de la otra vista */}
      <View className="bg-tertiary px-6 pt-4 pb-5 flex-row items-center justify-between shadow-2xl z-10">
        <Text className="text-primary font-bold text-2xl uppercase tracking-tighter">
          {tipoCliente === 'anonimo' ? 'Modo Anónimo' : 'Cliente'}
        </Text>
        <TouchableOpacity onPress={onLogout} className="active:opacity-70 p-1">
          <Ionicons name="log-out-outline" size={32} color="#31603D" />
        </TouchableOpacity>
      </View>

      {/* 🌟 SCROLLVIEW: Protege la vista en celulares más chicos 🌟 */}
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de perfil grande y prominente */}
        <View className="bg-secondary rounded-[30px] p-8 w-full items-center mb-10 border border-tertiary/20 shadow-md">
          <View className="w-32 h-32 rounded-full border-4 border-tertiary overflow-hidden bg-primary justify-center items-center mb-6">
            {fotoUrl ? (
              <Image
                source={{ uri: fotoUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person-outline" size={48} color="#31603D" />
            )}
          </View>
          <Text className="text-primary font-extrabold text-xl uppercase tracking-tight text-center mb-1">
            Bienvenido
          </Text>
          <Text
            className="text-primary font-bold text-lg uppercase tracking-tight text-center"
            numberOfLines={2}
          >
            {nombre || "Cliente"}
          </Text>
          <View className="bg-tertiary/30 self-center px-4 py-1.5 rounded-full mt-4">
            <Text className="text-primary font-bold text-xs uppercase tracking-widest">
              Perfil {tipoCliente}
            </Text>
          </View>
        </View>

        {/* Botones de Acción */}
        <View className="w-full space-y-5">
          <TouchableOpacity
            onPress={onEscanearMesa}
            className={`w-full py-5 rounded-[25px] flex-row items-center justify-center border shadow-md ${enListaEspera ? "bg-secondary border-tertiary/20 active:opacity-90" : "bg-gray-400 border-gray-500 active:opacity-100"}`}
          >
            <Ionicons
              name="restaurant-outline"
              size={24}
              color={enListaEspera ? "#31603D" : "#777"}
              style={{ marginRight: 12 }}
            />
            <Text
              className={`font-bold uppercase text-sm tracking-wide ${enListaEspera ? "text-primary" : "text-gray-600"}`}
            >
              Escanear QR de Mesa
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onVerEncuestas}
            className="w-full bg-secondary py-5 rounded-[25px] flex-row items-center justify-center border border-tertiary/20 shadow-md active:opacity-90"
          >
            <Ionicons
              name="bar-chart-outline"
              size={24}
              color="#31603D"
              style={{ marginRight: 12 }}
            />
            <Text className="text-primary font-bold uppercase text-sm tracking-wide">
              Resultados de Encuestas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onJuegos}
            className="w-full bg-secondary py-5 rounded-[25px] flex-row items-center justify-center border border-tertiary/20 shadow-md active:opacity-90"
          >
            <Ionicons
              name="game-controller-outline"
              size={24}
              color="#31603D"
              style={{ marginRight: 12 }}
            />
            <Text className="text-primary font-bold uppercase text-sm tracking-wide">
              Juegos
            </Text>
          </TouchableOpacity>

          {tipoCliente === "registrado" && onAccionAdicional && (
            <TouchableOpacity
              onPress={onAccionAdicional}
              className="w-full bg-tertiary py-5 rounded-[25px] flex-row items-center justify-center border-b-4 border-orange active:opacity-90 mt-2"
            >
              <Ionicons
                name={(iconoAccionAdicional as any) || "star-outline"}
                size={24}
                color="#31603D"
                style={{ marginRight: 12 }}
              />
              <Text className="text-primary font-bold uppercase text-sm tracking-wide">
                {textoAccionAdicional || "Acción Adicional"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}