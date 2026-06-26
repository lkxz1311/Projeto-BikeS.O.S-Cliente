import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { Button, Text, TextInput, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cadastrarService } from "../../../services/cadastrarService";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  function formatarTelefone(texto: string) {
    const apenasNumeros = texto.replace(/\D/g, "").slice(0, 11);
    if (apenasNumeros.length <= 2) return apenasNumeros;
    if (apenasNumeros.length <= 7) return `(${apenasNumeros.slice(0, 2)})${apenasNumeros.slice(2)}`;
    return `(${apenasNumeros.slice(0, 2)})${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
  }

  async function registrar() {
    if (!nome || !email || !telefone || !senha) {
      Alert.alert("Atenção", "Preencha todos os campos!");
      return;
    }
    if (!email.includes("@")) {
      Alert.alert("Erro", "E-mail inválido");
      return;
    }
    if (telefone.replace(/\D/g, "").length !== 11) {
      Alert.alert("Erro", "Telefone deve ter 11 dígitos");
      return;
    }

    setLoading(true);
    try {
      const resultado = await cadastrarService({ nome, email, telefone, senha });

      if (!resultado.ok) {
        Alert.alert("Erro", resultado.erro || "Falha ao cadastrar");
        return;
      }

      const userId = resultado.data?.id;

      if (!userId) {
        Alert.alert("Erro", "Não foi possível obter ID do usuário");
        return;
      }

      await AsyncStorage.setItem("userId", String(userId));

      setNome("");
      setEmail("");
      setTelefone("");
      setSenha("");

      Alert.alert("Sucesso", "Conta criada com sucesso!", [
        {
          text: "OK",
          onPress: () => router.replace("/main/home"), // ✅ replace para não voltar ao cadastro
        },
      ]);

    } catch (error) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Criar Conta</Text>

        <TextInput
          label="Nome"
          mode="outlined"
          value={nome}
          onChangeText={setNome}
          style={styles.input}
          activeOutlineColor="#1565C0"
          left={<TextInput.Icon icon="account" disabled />}
        />

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
          label="Telefone"
          mode="outlined"
          value={telefone}
          onChangeText={(texto) => setTelefone(formatarTelefone(texto))}
          keyboardType="phone-pad"
          placeholder="(XX)XXXXX-XXXX"
          maxLength={14}
          style={styles.input}
          activeOutlineColor="#1565C0"
          left={<TextInput.Icon icon="phone" disabled />}
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
          onPress={registrar}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : "Cadastrar"}
        </Button>

        <Text style={styles.texto}>
          Já tem conta?{" "}
          <Text style={styles.link} onPress={() => router.push("/auth/login")}>
            Fazer Login
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