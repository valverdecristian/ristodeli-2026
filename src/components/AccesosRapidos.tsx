import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Para el ícono de cerrar

interface AccesosRapidosProps {
  onSelect: (email: string, pass: string) => void;
}

export default function AccesosRapidos({ onSelect }: AccesosRapidosProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const profiles = [
    { id: "dueño", label: "Dueño", emoji: "👑", email: "admin@ristodeli.com", pass: "12345678", desc: "Control total" },
    { id: "supervisor", label: "Supervisor", emoji: "🔑", email: "supervisor@ristodeli.com", pass: "12345678", desc: "Gestión de personal" },
    { id: "metre", label: "Metre", emoji: "📋", email: "metre@ristodeli.com", pass: "12345678", desc: "Asignación de mesas" },
    { id: "mozo", label: "Mozo", emoji: "🍽️", email: "mozo1@ristodeli.com", pass: "12345678", desc: "Atención al cliente" },
    { id: "Cantinero", label: "Cantinero", emoji: "🍸", email: "cantinero1@ristodeli.com", pass: "12345678", desc: "Preparación de bebidas" },
    { id: "cocinero", label: "Cocinero", emoji: "👨‍🍳", email: "cocinero1@ristodeli.com", pass: "12345678", desc: "Gestión de pedidos" }
  ];

  const handleSelection = (email: string, pass: string) => {
    onSelect(email, pass);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="mt-8 flex-row items-center justify-center bg-secondary/10 border border-secondary/30 rounded-full py-4 px-6 shadow-md active:bg-secondary/20"
      >
        <Text className="text-secondary text-xl font-bold tracking-wider">ACCESOS RÁPIDOS</Text>
      </TouchableOpacity>

      {/* MODAL SUPERPUESTO (Bottom Sheet) */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide" // Hace que suba desde abajo
        onRequestClose={() => setModalVisible(false)} // Para el botón de retroceso en Android
      >
        {/* Fondo oscuro semi-transparente */}
        <View className="flex-1 justify-end bg-black/70">
          
          {/* Contenedor principal del Modal (Bordes redondeados arriba) */}
          <View className="bg-primary rounded-t-[40px] pt-4 pb-10 px-6 h-[90%] shadow-2xl border-t-4 border-secondary">
            
            {/* Cabecera del Modal */}
            <View className="flex-row justify-between items-center mb-6 mt-2">
              <Text className="text-secondary text-3xl font-serif font-bold">Perfiles</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                className="bg-secondary/20 p-2 rounded-full"
              >
                <Ionicons name="close" size={28} color="#F5C065" />
              </TouchableOpacity>
            </View>

            {/* Lista scrolleable de botones GRANDES */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {profiles.map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  onPress={() => handleSelection(profile.email, profile.pass)}
                  className="bg-secondary flex-row items-center p-4 rounded-3xl mb-4 shadow-lg border-b-4 border-gray-300 active:opacity-80"
                >
                  {/* Círculo con Emoji gigante */}
                  <View className="bg-primary/10 w-16 h-16 rounded-full items-center justify-center mr-4">
                    <Text className="text-4xl">{profile.emoji}</Text>
                  </View>

                  {/* Textos grandes y legibles */}
                  <View className="flex-1">
                    <Text className="text-primary text-2xl font-bold uppercase">{profile.label}</Text>
                    <Text className="text-primary/70 text-sm font-semibold">{profile.desc}</Text>
                  </View>

                  {/* Flechita indicadora */}
                  <Ionicons name="chevron-forward" size={24} color="#31603D" />
                </TouchableOpacity>
              ))}
            </ScrollView>

          </View>
        </View>
      </Modal>
    </>
  );
}