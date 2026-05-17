import { TextInput, TextInputProps } from 'react-native';

interface CustomInputProps extends TextInputProps {
  marginBottom?: string; 
}

export default function CustomInput({ marginBottom = 'mb-4', ...props }: CustomInputProps) {
  return (
    <TextInput
      placeholderTextColor="#555"
      className={`w-full bg-secondary rounded-full px-6 py-4 text-center text-lg text-primary font-semibold shadow-sm ${marginBottom}`}
      {...props}
    />
  );
}