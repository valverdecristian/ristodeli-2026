import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Rol {
  id: string;
  label: string;
  emoji: string;
}

interface SelectorDeRolProps {
  roles: Rol[];
  rolSeleccionado: string;
  onSelect: (id: string) => void;
}

export default function SelectorDeRol({ roles, rolSeleccionado, onSelect }: SelectorDeRolProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rolActual = roles.find((r) => r.id === rolSeleccionado);

  return (
    <View className="w-full mb-4">
      {/* BOTÓN DISPARADOR (Se queda fijo en el formulario) */}
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="w-full bg-secondary rounded-full px-6 py-4 flex-row justify-between items-center shadow-md active:opacity-90"
      >
        <Text className="text-primary font-semibold text-lg">
          Puesto: {rolActual?.emoji} {rolActual?.label}
        </Text>
        <Ionicons
          name="chevron-down"
          size={24}
          color="#31603D"
        />
      </TouchableOpacity>

      {/* MODAL SUPERPUESTO */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        {/* Fondo oscuro semi-transparente */}
        <View className="flex-1 justify-end bg-black/70">
          
          {/* Contenedor principal que sube desde abajo */}
          <View className="bg-primary rounded-t-[40px] pt-4 pb-10 px-6 max-h-[85%] shadow-2xl border-t-4 border-secondary">
            
            {/* Cabecera del Modal */}
            <View className="flex-row justify-between items-center mb-6 mt-2">
              <Text className="text-secondary text-2xl font-serif font-bold">Asignar Puesto</Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                className="bg-secondary/20 p-2 rounded-full"
              >
                <Ionicons name="close" size={28} color="#F5C065" />
              </TouchableOpacity>
            </View>

            {/* Lista scrolleable de puestos */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {roles.map((r) => {
                const isSelected = rolSeleccionado === r.id;
                
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => {
                      onSelect(r.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex-row items-center p-4 rounded-3xl mb-3 shadow-md border-b-4 border-gray-300 active:opacity-80 ${
                      isSelected ? 'bg-tertiary' : 'bg-secondary'
                    }`}
                  >
                    {/* Círculo con Emoji */}
                    <View className="bg-primary/10 w-14 h-14 rounded-full items-center justify-center mr-4">
                      <Text className="text-3xl">{r.emoji}</Text>
                    </View>
                    
                    {/* Nombre del puesto */}
                    <Text className="text-primary font-bold text-xl uppercase">
                      {r.label}
                    </Text>

                    {/* Tilde indicador si está seleccionado */}
                    {isSelected && (
                      <View className="flex-1 items-end pr-2">
                        <Ionicons name="checkmark-circle" size={28} color="#31603D" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

          </View>
        </View>
      </Modal>
    </View>
  );
}