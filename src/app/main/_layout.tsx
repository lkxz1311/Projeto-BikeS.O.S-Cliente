import { Tabs, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

function BotaoSOS() {
  const [loading, setLoading] = useState(false);

  function darCliqueRapido() {
    router.push("/main/solicitar");
  }

  async function segurarCliqueLongo() {
    if (loading) return;
    
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Erro", "Usuário não encontrado.");
        return;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "sos",
          userId,
          telefone: "Urgente",
          problema: "Solicitação prioritária via botão SOS",
          bike: "Não informada",
          localizacao: "Localização atual",
          pagamento: "Emergência",
        }),
      });

      if (response.ok) {
        Alert.alert("SOS Enviado!", "Os técnicos foram notificados imediatamente!", [
          { text: "OK", onPress: () => router.replace("/main/home") }
        ]);
      } else {
        Alert.alert("Erro", "Falha ao enviar o sinal de SOS.");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      onPress={darCliqueRapido}
      onLongPress={segurarCliqueLongo}
      delayLongPress={2500}
      style={styles.botaoSOS}
      disabled={loading}
    >
      {({ pressed }) => (
        <View style={[
          styles.botaoSOSInner, 
          (pressed || loading) && styles.botaoSOSPressionado
        ]}>
          <MaterialCommunityIcons name="alarm-light" size={28} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1565C0",
        tabBarInactiveTintColor: "#9E9E9E",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          height: 65,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          href: null,
          title: "Mapa",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-radius" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="solicitar"
        options={{
          title: "SOS",
          tabBarButton: () => <BotaoSOS />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  botaoSOS: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoSOSInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#D32F2F",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  botaoSOSPressionado: {
    backgroundColor: "#9A0007",
    transform: [{ scale: 0.95 }],
  },
});