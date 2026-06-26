import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginService } from "../../../services/loginService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  async function entrar() {
    if (!email || !senha) {
      Alert.alert("Atenção", "Preencha todos os campos!");
      return;
    }
    if (!email.includes("@")) {
      Alert.alert("Erro", "E-mail inválido");
      return;
    }

    setLoading(true);
    try {
      const resultado = await loginService({ email, senha });

      if (!resultado.ok) {
        Alert.alert("Erro", resultado.erro || "Falha ao fazer login");
        return;
      }

      const userId = resultado.data?.id;

      if (!userId) {
        Alert.alert("Erro", "Não foi possível obter ID do usuário");
        return;
      }

      await AsyncStorage.setItem("userId", String(userId));

      setEmail("");
      setSenha("");

      router.replace("/main/home");

    } catch (error: any) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Login do Cliente</Text>

        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          activeOutlineColor="#1565C0"
          left={<TextInput.Icon icon="email" disabled />}
        />

        <TextInput
          label="Senha"
          mode="outlined"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry={!mostrarSenha}
          style={styles.input}
          activeOutlineColor="#1565C0"
          left={<TextInput.Icon icon="lock" disabled />}
          right={
            <TextInput.Icon
              icon={mostrarSenha ? "eye-off" : "eye"}
              onPress={() => setMostrarSenha(!mostrarSenha)}
              color="#1565C0"
            />
          }
        />

        <Button
          mode="contained"
          buttonColor="#1565C0"
          style={styles.botao}
          onPress={entrar}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : "Entrar"}
        </Button>

        <Text style={styles.texto}>
          Não tem conta?{" "}
          <Text style={styles.link} onPress={() => router.push("/auth/cadastro")}>
            Criar conta
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F9FF",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F5F9FF",
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1565C0",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
  },
  botao: {
    marginTop: 10,
    paddingVertical: 5,
  },
  texto: {
    marginTop: 16,
    textAlign: "center",
  },
  link: {
    color: "#1565C0",
    fontWeight: "bold",
  },
});