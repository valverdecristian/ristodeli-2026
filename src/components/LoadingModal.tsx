import { View, Text, Modal, ActivityIndicator, Image } from 'react-native';

interface LoadingModalProps {
  visible: boolean;
  message: string;
}

export default function LoadingModal({ visible, message }: LoadingModalProps) {
  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/60">
        <View className="bg-primary p-10 rounded-3xl items-center border-2 border-tertiary shadow-2xl">
          <View className="bg-secondary rounded-full p-2 mb-4 border border-tertiary">
            <Image
              source={require("@/assets/images/icon.png")}
              className="w-12 h-12"
              resizeMode="contain"
            />
          </View>
          <ActivityIndicator size="large" color="#F5C065" />
          <Text className="text-secondary font-bold mt-4 text-lg text-center">
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}