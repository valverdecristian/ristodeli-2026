import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useToast } from "@/src/context/ToastContext";
import { SoundService } from '@/src/services/soundService';
import { supabase } from '@/src/services/SupabaseClient';
import AccesosRapidos from '@/src/components/AccesosRapidos'; 
import LoadingModal from '@/src/components/LoadingModal';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  const handleLogin = async () => {
    const emailRegex = /\S+@\S+\.\S+/;

    if (!email || !password) {
      SoundService.reproducir('error');
      showToast("error", "Campos incompletos", "Por favor, completa todos los campos.");
      return;
    }

    if (!emailRegex.test(email)) {
      SoundService.reproducir('error');
      showToast("error", "Email inválido", "El formato del correo electrónico no es válido.");
      return;
    }

    if (password.length < 6) {
      SoundService.reproducir('error');
      showToast("error", "Contraseña débil", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setLoading(false);
        SoundService.reproducir('error');
        showToast("error", "Error de autenticación", "Correo o contraseña incorrectos.");
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select('id, perfil, nombres, foto_url') // 🌟 AGREGAMOS 'id, nombre, foto' para poder pasárselos al Home
        .eq('id', authData.user.id)
        .single();

      if (profileError || !userProfile) {
        setLoading(false);
        SoundService.reproducir('error');
        showToast("error", "Error de perfil", "No se encontró el rol asociado a este usuario.");
        return;
      }

      const currentRole = userProfile.perfil.toLowerCase().trim();

      if (currentRole === "cliente_pendiente" || currentRole === "cliente_rechazado") {
        setLoading(false);
        await supabase.auth.signOut(); 

        SoundService.reproducir('error');
        showToast("error", "Acceso Retenido", "Tu cuenta está registrada pero aguarda la aprobación de un Supervisor.");
        return;
      }

      if (currentRole === "cliente_rechazado") {
        setLoading(false);
        await supabase.auth.signOut();
        SoundService.reproducir('error');
        showToast("error", "Acceso Retenido", "Tu cuenta requiere aprobación o fue denegada.");
        return;
      }

      setLoading(false);
      await SoundService.reproducir('exito');

      // Redirección por roles
      switch (currentRole) {
        case "dueño":
        case "admin": 
          router.replace("/(homes)/duenio");
          break;
        case "supervisor":
          router.replace("/(homes)/supervisor");
          break;
        case "metre":
          router.replace("/(homes)/metre");
          break;
        case "mozo":
          router.replace("/(homes)/mozo");
          break;
        case "cantinero":
          router.replace("/(homes)/cantinero");
          break;
        case "cocinero":
          router.replace("/(homes)/cocinero");
          break;
        case "cliente":
          router.replace({
            pathname: "/home",
            params: {
              usuarioId: userProfile.id,       
              usuarioNombre: userProfile.nombres,
              usuarioFoto: userProfile.foto_url || ''
            }
          });
          break;
        default:
          router.replace("/");
          break;
      }

    } catch (error) {
      setLoading(false);
      SoundService.reproducir('error');
      showToast("error", "Error de conexión", "Ocurrió un problema de red inesperado.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      {/* 2. Inyectamos el Modal de Carga Reutilizable */}
      <LoadingModal visible={loading} message="Verificando credenciales..." />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-primary">
        <View className="flex-1 items-center justify-center px-10 pt-16">
          
          {/* LOGO */}
        <View className="bg-transparent rounded-full p-1 mb-8 shadow-2xl border-4 border-tertiary">
          <Image
            source={require("../assets/images/icon.png")}
            className="w-40 h-40" 
            resizeMode="contain"
          />
        </View>

          {/* FORMULARIO */}
          <View className="w-full">
            <TextInput
              placeholder="Correo electrónico"
              placeholderTextColor="#555"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg shadow-md mb-6 text-primary font-semibold"
            />
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#555"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              className="w-full bg-secondary rounded-full px-6 py-4 text-center text-lg shadow-md mb-8 text-primary font-semibold"
            />

            {/* BOTÓN PRINCIPAL */}
            <TouchableOpacity
              onPress={handleLogin}
              className="w-full bg-tertiary rounded-full py-4 shadow-lg border-b-4 border-orange active:opacity-90 mb-6"
            >
              <Text className="text-center font-bold text-primary text-xl uppercase">
                Iniciar sesión
              </Text>
            </TouchableOpacity>

            {/* BOTONES SECUNDARIOS */}
            <View className="flex-row justify-between w-full mt-2">
              <TouchableOpacity
                onPress={() => router.push("/registro")}
                className="bg-purple w-[48%] rounded-full py-4 shadow-md active:opacity-80"
              >
                <Text className="text-center font-bold text-primary text-lg uppercase">
                  Registro
                </Text>
              </TouchableOpacity>

              <TouchableOpacity

                onPress={() => router.push('/registroAnonimo')}
                className="bg-purple w-[48%] rounded-full py-3 shadow-md active:opacity-80"
              >
                <Text className="text-center font-bold text-primary text-lg uppercase">
                  Registro anónimo
                </Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* ACCESOS RÁPIDOS */}
          <AccesosRapidos onSelect={fillCredentials} />

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}