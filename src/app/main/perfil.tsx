import { useState, useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Button, Card, IconButton, Text, TextInput, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Perfil() {
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    try {
      const id = await AsyncStorage.getItem("userId");
      if (!id) return sair();

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/usuarios/${id}`);
      const data = await response.json();

      setNome(data.nome);
      setEmail(data.email);
      setTelefone(data.telefone);
    } catch (e) {
      setErro("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  async function salvarDados() {
    try {
      const id = await AsyncStorage.getItem("userId");
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone }),
      });

      if (response.ok) {
        setEditando(false);
        setErro("");
      } else {
        setErro("Falha ao salvar.");
      }
    } catch (e) {
      setErro("Erro ao conectar.");
    }
  }

  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);
    if (numeros.length <= 2) return `(${numeros}`;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  }

  async function escolherFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return setErro("Permita o acesso à galeria.");
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!resultado.canceled) setFoto(resultado.assets[0].uri);
  }

  async function sair() {
    await AsyncStorage.removeItem("userId"); // ✅ await adicionado
    router.replace("/auth/login");
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.fotoArea}>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.foto} />
            ) : (
              <Avatar.Icon size={96} icon="account" color="#FFFFFF" style={styles.avatar} />
            )}
            <IconButton icon="camera" size={20} iconColor="#FFFFFF" containerColor="#1565C0" style={styles.botaoFoto} onPress={escolherFoto} />
          </View>
          <Text style={styles.nome}>{nome}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <Card style={styles.card}>
          <Card.Title title="Dados do cliente" titleStyle={styles.cardTitle} right={() => (
            <IconButton icon={editando ? "check" : "pencil"} iconColor="#1565C0" onPress={editando ? salvarDados : () => setEditando(true)} />
          )} />
          <Card.Content>
            {editando ? (
              <>
                <TextInput label="Nome" mode="outlined" value={nome} onChangeText={setNome} style={styles.input} activeOutlineColor="#1565C0" />
                <TextInput label="Telefone" mode="outlined" value={telefone} onChangeText={(t) => setTelefone(formatarTelefone(t))} keyboardType="phone-pad" style={styles.input} activeOutlineColor="#1565C0" />
                <Button mode="contained" buttonColor="#1565C0" style={styles.botaoSalvar} onPress={salvarDados}>Salvar alterações</Button>
              </>
            ) : (
              <>
                <View style={styles.infoLinha}><View style={styles.iconeBox}><MaterialCommunityIcons name="account-outline" size={23} color="#1565C0" /></View><View style={styles.infoTextoBox}><Text style={styles.label}>Nome</Text><Text style={styles.value}>{nome}</Text></View></View>
                <View style={styles.infoLinha}><View style={styles.iconeBox}><MaterialCommunityIcons name="email-outline" size={23} color="#1565C0" /></View><View style={styles.infoTextoBox}><Text style={styles.label}>Email</Text><Text style={styles.value}>{email}</Text></View></View>
                <View style={styles.infoLinha}><View style={styles.iconeBox}><MaterialCommunityIcons name="phone-outline" size={23} color="#1565C0" /></View><View style={styles.infoTextoBox}><Text style={styles.label}>Telefone</Text><Text style={styles.value}>{telefone}</Text></View></View>
              </>
            )}
          </Card.Content>
        </Card>

        {erro !== "" && <View style={styles.erroBox}><Text style={styles.erroTexto}>{erro}</Text></View>}

        <Button mode="outlined" textColor="#1565C0" style={styles.botaoSair} icon="logout" onPress={sair}>Sair da conta</Button>
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
    backgroundColor: "#F5F9FF",
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 18,
  },
  fotoArea: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: "#1565C0",
  },
  foto: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#D1D5DB",
  },
  botaoFoto: {
    position: "absolute",
    right: -8,
    bottom: -8,
  },
  nome: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E2A38",
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    color: "#5F6B7A",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 14,
  },
  cardTitle: {
    color: "#1E2A38",
    fontWeight: "bold",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  botaoSalvar: {
    borderRadius: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  infoLinha: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  iconeBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextoBox: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
  },
  value: {
    fontSize: 16,
    color: "#1E2A38",
    fontWeight: "600",
    marginTop: 2,
  },
  erroBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  erroTexto: {
    flex: 1,
    color: "#D32F2F",
    fontWeight: "600",
  },
  botaoSair: {
    borderColor: "#1565C0",
    borderRadius: 12,
    paddingVertical: 3,
  },
});