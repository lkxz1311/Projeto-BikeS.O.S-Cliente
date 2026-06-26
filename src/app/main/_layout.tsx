import { Tabs, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity, View, StyleSheet } from "react-native";

function BotaoSOS() {
  return (
    <TouchableOpacity
      style={styles.botaoSOS}
      onPress={() => router.push("/main/solicitar?sos=true")}
    >
      <View style={styles.botaoSOSInner}>
        <MaterialCommunityIcons name="alarm-light" size={28} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
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
});