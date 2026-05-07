import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Centralizamos el uso de íconos aquí. Si en el futuro cambias Ionicons 
// por MaterialIcons u otra librería, solo lo cambias en este archivo.
export const MyIcon = ({ name, size = 24, color = '#000', style }: IconProps) => {
  return <Ionicons name={name} size={size} color={color} style={style} />;
};
