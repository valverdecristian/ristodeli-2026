import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CameraView } from 'expo-camera';

interface ScannerDNIProps {
  onScan: (data: string) => void;
  onCancel: () => void;
}

export default function ScannerDNI({ onScan, onCancel }: ScannerDNIProps) {
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
  };

  return (
    <View className="flex-1 bg-black justify-center items-center">
      <CameraView
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['pdf417', 'qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      
      {/* Guia en pantalla para el DNI */}
      <View className="w-[85%] h-44 border-2 border-tertiary rounded-2xl mb-6 bg-transparent" />
      
      <Text className="text-secondary font-bold text-center mb-8 px-6 bg-black/70 py-3 rounded-2xl mx-4 text-xs uppercase tracking-wider">
        Alineá la barra horizontal del reverso del DNI en el recuadro
      </Text>
      
      <TouchableOpacity
        onPress={onCancel}
        className="bg-tertiary px-10 py-4 rounded-full border-b-4 border-orange"
      >
        <Text className="text-primary font-bold uppercase">Cancelar y Volver</Text>
      </TouchableOpacity>
    </View>
  );
}