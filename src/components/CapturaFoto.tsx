import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CapturaFotoProps {
  fotoUri: string | null;
  onPress: () => void;
  textoInferior?: string;
  size?: 'normal' | 'grande';
}

export default function CapturaFoto({ 
  fotoUri, 
  onPress, 
  textoInferior,
  size = 'normal' 
}: CapturaFotoProps) {
  
  const circleSizeClass = size === 'grande' ? 'w-56 h-56' : 'w-28 h-28';
  const iconSize = size === 'grande' ? 52 : 42;

  return (
    <View className="items-center mb-6">
      <TouchableOpacity 
        onPress={onPress} 
        className={`bg-secondary ${circleSizeClass} rounded-full items-center justify-center border-4 border-tertiary overflow-hidden shadow-md mb-2 active:opacity-80`}
      >
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Ionicons name="camera-outline" size={iconSize} color="#31603D" />
        )}
      </TouchableOpacity>
      
      {textoInferior && (
        <TouchableOpacity onPress={onPress}>
          <Text className="text-tertiary font-bold text-xs uppercase tracking-tight">
            {fotoUri ? "Cambiar foto" : textoInferior}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}