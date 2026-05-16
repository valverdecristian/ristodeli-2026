import { useAuth } from '@/src/context/AuthContext';
import { useToast } from "@/src/context/ToastContext";
import { SoundService } from '@/src/services/soundService';
import { supabase } from '@/src/services/SupabaseClient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const Icon = ({ emoji }: { emoji: string }) => (
  <Text className="text-primary text-3xl mb-1">{emoji}</Text>
);

export default function LoginScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { cerrarSesion } = useAuth();
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Accesos rápidos estáticos según la base de datos
  const profiles = [
    { id: "dueño", label: "Dueño", emoji: "👑", email: "admin@ristodeli.com", pass: "12345678" },
    { id: "supervisor", label: "Supervisor", emoji: "🔑", email: "supervisor@ristodeli.com", pass: "12345678" },
    { id: "metre", label: "Metre", emoji: "📋", email: "metre@ristodeli.com", pass: "12345678" },
    { id: "mozo", label: "Mozo", emoji: "🍽️", email: "mozo1@ristodeli.com", pass: "12345678" },
    { id: "Cantinero", label: "Cantinero", emoji: "🍸", email: "cantinero1@ristodeli.com", pass: "12345678" },
    { id: "cocinero", label: "Cocinero", emoji: "👨‍🍳", email: "cocinero1@ristodeli.com", pass: "12345678" },
    // Agregamos un acceso rápido de testeo para verificar el rebote de pendientes
    { id: "pendiente", label: "Pendiente", emoji: "⏳", email: "juan.perez.test@ristodeli.com", pass: "12345678" }
  ];

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  const handleLogin = async () => {
    const emailRegex = /\S+@\S+\.\S+/;

    // 1. VALIDACIONES LOCALES PREVIAS
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
      // 2. LOGUEAR EN AUTH DE SUPABASE
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

      if (!authData?.user) {
        setLoading(false);
        SoundService.reproducir('error');
        showToast("error", "Error inesperado", "No se pudieron obtener los datos de usuario.");
        return;
      }

      // 3. CONSULTAR EL PERFIL EN LA TABLA PUBLIC.USUARIOS usando la FK
      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select('perfil')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !userProfile) {
        setLoading(false);
        SoundService.reproducir('error');
        showToast("error", "Error de perfil", "No se encontró el rol asociado a este usuario.");
        return;
      }

      const currentRole = userProfile.perfil.toLowerCase().trim();

      // 🌟 LÓGICA DE CONTROL EXCLUYENTE PARA REBOTAR SOLICITUDES NO APROBADAS
      if (currentRole === "cliente_pendiente") {
        setLoading(false);
        // Deslogueamos la instancia de Auth inmediatamente para limpiar credenciales
        await supabase.auth.signOut(); 
        SoundService.reproducir('error'); // Activa sonido + vibración por error
        showToast("error", "Acceso Retenido", "Tu cuenta está registrada pero aguarda la aprobación de un Supervisor.");
        return;
      }

      if (currentRole === "cliente_rechazado") {
        setLoading(false);
        await supabase.auth.signOut();
        SoundService.reproducir('error');
        showToast("error", "Acceso Denegado", "Tu solicitud de registro fue rechazada por la empresa.");
        return;
      }

      // Si pasa los bloqueos, apagamos la carga y ejecutamos el bip de éxito
      setLoading(false);

      await SoundService.reproducir('exito');

      // 4. ROUTING DINÁMICO SEGÚN EL ROL AUTORIZADO
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
          // Clientes aprobados van directo al flujo operativo de las mesas
          router.replace("/");
          break;
        default:
          router.replace("/");
          break;
      }

    } catch (error) {
      setLoading(false);
      SoundService.reproducir('error');
      showToast("error", "Error de conexión", "Ocurrió un problema de red inesperado.");
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      {/* Indicador de carga unificado */}
      <Modal transparent={true} visible={loading} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-primary p-10 rounded-3xl items-center border-2 border-tertiary shadow-2xl">
            <View className="bg-secondary rounded-full p-2 mb-4 border border-tertiary">
              <Image
                source={require("../assets/images/icon.png")}
                className="w-12 h-12"
                resizeMode="contain"
              />
            </View>
            <ActivityIndicator size="large" color="#F5C065" />
            <Text className="text-secondary font-bold mt-4 text-lg">
              Verificando credenciales...
            </Text>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-primary">
        <View className="flex-1 items-center justify-center px-10 pt-16">
          <View className="bg-secondary rounded-full p-2 mb-10 shadow-2xl border-4 border-tertiary">
            <Image
              source={require("../assets/images/icon.png")}
              className="w-24 h-24"
              resizeMode="contain"
            />
          </View>

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

            <TouchableOpacity
              onPress={handleLogin}
              className="w-full bg-tertiary rounded-full py-4 shadow-lg border-b-4 border-orange active:opacity-90 mb-6"
            >
              <Text className="text-center font-bold text-primary text-xl uppercase">
                Iniciar sesión
              </Text>
            </TouchableOpacity>

            {/* Botones de Registro requeridos por el TFI */}
            <View className="flex-row justify-between w-full">
              <TouchableOpacity
                onPress={() => router.push("/registro")}
                className="bg-purple w-[48%] rounded-full py-3 shadow-md active:opacity-80"
              >
                <Text className="text-center font-bold text-primary text-sm uppercase">
                  Registro
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => console.log("Ir a Registro Anónimo")}
                className="bg-purple w-[48%] rounded-full py-3 shadow-md active:opacity-80"
              >
                <Text className="text-center font-bold text-primary text-sm uppercase">
                  Registro anónimo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Selector de Acceso Rápido para Testeo */}
          <View className="mt-10 items-center w-full pb-6">
            <View className="flex-row items-center justify-between w-full px-2 mb-2">
              <Text className="text-secondary font-bold text-lg">
                Acceso rápido
              </Text>
              <TouchableOpacity
                onPress={() => setShowQuickAccess(!showQuickAccess)}
                className="bg-secondary rounded-full p-2"
              >
                <Text
                  className="text-primary text-xl font-bold"
                  style={{
                    transform: [
                      { rotate: showQuickAccess ? "180deg" : "0deg" },
                    ],
                  }}
                >
                  ▼
                </Text>
              </TouchableOpacity>
            </View>

            {showQuickAccess && (
              <View className="w-full bg-[#1e3d25] rounded-3xl p-4 shadow-inner border border-secondary/20">
                <View className="flex-row flex-wrap justify-between">
                  {profiles.map((profile) => (
                    <TouchableOpacity
                      key={profile.id}
                      onPress={() =>
                        fillCredentials(profile.email, profile.pass)
                      }
                      className="bg-secondary w-[31%] aspect-square rounded-2xl p-2 items-center justify-center shadow-md mb-3 border-b-2 border-gray-300"
                    >
                      <Icon emoji={profile.emoji} />
                      <Text className="text-primary font-bold text-[9px] uppercase text-center">
                        {profile.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}