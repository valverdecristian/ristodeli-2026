import { Stack } from 'expo-router';

export default function HomesLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false // Esto quita el texto "(homes)" de la parte superior
      }} 
    />
  );
}