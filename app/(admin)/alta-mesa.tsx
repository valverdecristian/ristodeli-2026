import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function AltaMesa() {
  const router = useRouter();
  const [numeroMesa, setNumeroMesa] = useState('');
  const [cantidadComensales, setCantidadComensales] = useState('');
  const [tipoMesa, setTipoMesa] = useState('estandar');

  const handleGenerarMesa = () => {
    if (!numeroMesa || !cantidadComensales) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(admin)/listado-mesas'); 
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        
        <View className="bg-tertiary px-6 pt-12 pb-5 flex-row items-center shadow-2xl">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={30} color="#31603D" />
          </TouchableOpacity>
          <Text className="text-primary font-bold text-2xl uppercase tracking-tighter">
            Alta De Mesa
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-10 pt-12">
          
          <View className="mb-8">
            <TextInput
              value={numeroMesa}
              onChangeText={setNumeroMesa}
              placeholder="NÚMERO DE MESA"
              placeholderTextColor="#6E433D"
              keyboardType="numeric"
              className="bg-secondary rounded-full px-8 py-5 text-primary text-center text-xl font-bold shadow-lg"
            />
          </View>

          <View className="mb-8">
            <TextInput
              value={cantidadComensales}
              onChangeText={setCantidadComensales}
              placeholder="CANTIDAD DE COMENSALES"
              placeholderTextColor="#6E433D"
              keyboardType="numeric"
              className="bg-secondary rounded-full px-8 py-5 text-primary text-center text-xl font-bold shadow-lg"
            />
          </View>

          <View className="mb-12">
            <View className="bg-secondary rounded-3xl p-2 flex-row justify-around items-center shadow-md">
                {['Estándar', 'VIP', 'Discapacidad'].map((tipo) => (
                    <TouchableOpacity 
                        key={tipo}
                        onPress={() => setTipoMesa(tipo.toLowerCase())}
                        className={`px-4 py-3 rounded-2xl ${tipoMesa === tipo.toLowerCase() ? 'bg-tertiary shadow-sm' : ''}`}
                    >
                        <Text className={`font-bold text-[11px] uppercase ${tipoMesa === tipo.toLowerCase() ? 'text-primary' : 'text-primary/40'}`}>
                            {tipo}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleGenerarMesa}
            style={{ elevation: 15 }}
            className="bg-tertiary rounded-full py-6 shadow-2xl border-b-[6px] border-orange active:mt-1 active:border-b-0"
          >
            <View className="flex-row justify-center items-center">
              <Ionicons name="qr-code" size={28} color="#31603D" />
              <Text className="text-primary font-black text-xl uppercase ml-3">
                Generar Mesa Y QR
              </Text>
            </View>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}