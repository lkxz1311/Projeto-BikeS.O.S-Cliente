import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { Button, Text, TextInput, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

    setLoading(true);
    try {
      const user = await loginService({ email, senha }) as any;

      if (user && user.id) {
        await AsyncStorage.setItem("userId", user.id.toString());
        setLoading(false);
        
        // Tenta a rota padrão do seu Tabs layout
        router.replace("/main/home");
      } else {
        setLoading(false);
        Alert.alert("Erro de Login", "A API não retornou um usuário válido ou as credenciais estão erradas.");
      }
    } catch (error: any) {
      setLoading(false);
      // Mostra o erro exato na tela do seu celular para sabermos se é a API ou a rota
      Alert.alert("Erro de Conexão/Código", error.message || "Erro desconhecido");
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