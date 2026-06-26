import { useState, useCallback } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Card, Chip, Divider, IconButton, Text, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { listarPedidosService } from "../../../services/pedidoService";
import * as Location from "expo-location";

const tecnicosMock = [
  { id: "1", nome: "Ricardo Silva", avaliacao: 4.8, distancia: "1.2 km", online: true },
  { id: "2", nome: "Carlos Mendes", avaliacao: 4.5, distancia: "2.4 km", online: true },
  { id: "3", nome: "João Pereira", avaliacao: 4.9, distancia: "3.1 km", online: false },
];

type Pedido = {
  id: string;
  codigo: string;
  tipo: string;
  problema: string;
  status: string;
  createdAt: string;
};

type Coordenadas = {
  latitude: number;
  longitude: number;
};

export default function Home() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [mapaExpandido, setMapaExpandido] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarPedidos();
      obterLocalizacao();
    }, [])
  );

  async function obterLocalizacao() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      setCoordenadas({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.log("Erro ao obter localização:", error);
    }
  }

  async function carregarPedidos() {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const resultado = await listarPedidosService(userId);
      if (resultado.ok && resultado.data) {
        setPedidos(resultado.data);
      }
    } catch (error) {
      console.log("Erro ao carregar pedidos:", error);
    } finally {
      setLoadingPedidos(false);
    }
  }

  const pedidosAtivos = pedidos.filter(p => p.status !== "Finalizado" && p.status !== "Rejeitado").length;
  const pedidosConcluidos = pedidos.filter(p => p.status === "Finalizado").length;

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function corChip(tipo: string, status: string) {
    if (tipo === "sos") return styles.chipSOS;
    if (status === "Finalizado") return styles.chipConcluido;
    if (tipo === "agendado") return styles.chipAgendado;
    return styles.chipNormal;
  }

  const regiaoMapa = coordenadas ? {
    latitude: coordenadas.latitude,
    longitude: coordenadas.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : {
    latitude: -15.7801,
    longitude: -47.9292,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerEsquerda}>
            <Avatar.Icon size={52} icon="bike" color="#FFFFFF" style={styles.avatar} />
            <View>
              <Text style={styles.titulo}>BikeS.O.S</Text>
              <Text style={styles.subtitulo}>Suporte rápido para ciclistas</Text>
            </View>
          </View>
          <IconButton icon="bell-outline" iconColor="#1565C0" size={24} />
        </View>

        {/* RESUMO */}
        <View style={styles.grid}>
          <Card style={styles.cardResumo}>
            <Card.Content>
              <View style={styles.iconeBoxAzul}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={26} color="#1565C0" />
              </View>
              <Text style={styles.numero}>{pedidosAtivos}</Text>
              <Text style={styles.label}>Pedidos ativos</Text>
            </Card.Content>
          </Card>

          <Card style={styles.cardResumo}>
            <Card.Content>
              <View style={styles.iconeBoxVerde}>
                <MaterialCommunityIcons name="check-circle-outline" size={26} color="#2E7D32" />
              </View>
              <Text style={styles.numero}>{pedidosConcluidos}</Text>
              <Text style={styles.label}>Concluídos</Text>
            </Card.Content>
          </Card>
        </View>

        {/* TÉCNICOS */}
        <Text style={styles.secaoTitulo}>Técnicos disponíveis</Text>

        {tecnicosMock.map((tecnico) => (
          <Card key={tecnico.id} style={styles.cardTecnico}>
            <Card.Content style={styles.cardTecnicoContent}>
              <Avatar.Icon size={52} icon="account" color="#FFFFFF" style={styles.avatarTecnico} />
              <View style={styles.tecnicoInfo}>
                <View style={styles.tecnicoTopo}>
                  <Text style={styles.tecnicoNome}>{tecnico.nome}</Text>
                  <Chip
                    style={tecnico.online ? styles.chipOnline : styles.chipOffline}
                    textStyle={{ fontSize: 11, fontWeight: "bold", color: tecnico.online ? "#2E7D32" : "#6B7280" }}
                  >
                    {tecnico.online ? "ONLINE" : "OFFLINE"}
                  </Chip>
                </View>
                <View style={styles.tecnicoDetalhes}>
                  <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.tecnicoAvaliacao}>{tecnico.avaliacao}</Text>
                  <MaterialCommunityIcons name="map-marker-outline" size={16} color="#6B7280" style={{ marginLeft: 8 }} />
                  <Text style={styles.tecnicoDistancia}>{tecnico.distancia} de você</Text>
                </View>
                <TouchableOpacity style={styles.botaoSolicitar}>
                  <Text style={styles.botaoSolicitarTexto}>Solicitar</Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        ))}

        {/* HISTÓRICO */}
        <Text style={styles.secaoTitulo}>Histórico de pedidos</Text>

        {loadingPedidos ? (
          <ActivityIndicator color="#1565C0" style={{ marginTop: 20 }} />
        ) : pedidos.length === 0 ? (
          <Card style={styles.cardVazio}>
            <Card.Content style={styles.cardVazioContent}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={40} color="#9E9E9E" />
              <Text style={styles.cardVazioTexto}>Nenhum pedido ainda</Text>
            </Card.Content>
          </Card>
        ) : (
          pedidos.map((pedido) => (
            <Card key={pedido.id} style={styles.cardPedido}>
              <Card.Content>
                <View style={styles.topoPedido}>
                  <View style={styles.codigoBox}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#1565C0" />
                    <Text style={styles.codigo}>#{pedido.codigo}</Text>
                  </View>
                  <Chip style={corChip(pedido.tipo, pedido.status)} textStyle={styles.chipStatusTexto}>
                    {pedido.status}
                  </Chip>
                </View>
                <Divider style={styles.divider} />
                <Text style={styles.pedidoInfo}>Problema: {pedido.problema}</Text>
                <Text style={styles.pedidoData}>Data: {formatarData(pedido.createdAt)}</Text>
              </Card.Content>
            </Card>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F9FF" },
  container: { flex: 1, backgroundColor: "#F5F9FF" },
  content: { padding: 16, paddingBottom: 30 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  headerEsquerda: { flexDirection: "row", alignItems: "center" },
  avatar: { backgroundColor: "#1565C0", marginRight: 12 },
  titulo: { fontSize: 24, fontWeight: "bold", color: "#1E2A38" },
  subtitulo: { color: "#5F6B7A", marginTop: 2 },
  cardMapa: { borderRadius: 20, marginBottom: 14, overflow: "hidden" },
  mapaContainer: { height: 210, position: "relative" },
  mapa: { flex: 1 },
  botaoExpandir: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  botaoFechar: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#1565C0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  botaoFecharTexto: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  grid: { flexDirection: "row", gap: 12, marginBottom: 14 },
  cardResumo: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 18 },
  iconeBoxAzul: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#E8F0FE", justifyContent: "center", alignItems: "center" },
  iconeBoxVerde: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center" },
  numero: { fontSize: 30, fontWeight: "bold", color: "#1E2A38", marginTop: 10 },
  label: { color: "#5F6B7A", marginTop: 2 },
  secaoTitulo: { fontSize: 18, fontWeight: "bold", color: "#1E2A38", marginBottom: 10 },
  cardTecnico: { backgroundColor: "#FFFFFF", borderRadius: 18, marginBottom: 12 },
  cardTecnicoContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarTecnico: { backgroundColor: "#1565C0" },
  tecnicoInfo: { flex: 1 },
  tecnicoTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tecnicoNome: { fontSize: 16, fontWeight: "bold", color: "#1E2A38" },
  chipOnline: { backgroundColor: "#E8F5E9" },
  chipOffline: { backgroundColor: "#F3F4F6" },
  tecnicoDetalhes: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  tecnicoAvaliacao: { fontSize: 13, color: "#374151", marginLeft: 2 },
  tecnicoDistancia: { fontSize: 13, color: "#6B7280", marginLeft: 2 },
  botaoSolicitar: { backgroundColor: "#1565C0", borderRadius: 10, paddingVertical: 8, alignItems: "center", marginTop: 10 },
  botaoSolicitarTexto: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },
  cardVazio: { backgroundColor: "#FFFFFF", borderRadius: 18, marginBottom: 12 },
  cardVazioContent: { alignItems: "center", paddingVertical: 20 },
  cardVazioTexto: { color: "#9E9E9E", marginTop: 8, fontSize: 15 },
  cardPedido: { backgroundColor: "#FFFFFF", borderRadius: 18, marginBottom: 12 },
  topoPedido: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  codigoBox: { flexDirection: "row", alignItems: "center" },
  codigo: { marginLeft: 6, fontSize: 15, fontWeight: "bold", color: "#1565C0" },
  chipNormal: { backgroundColor: "#1565C0" },
  chipSOS: { backgroundColor: "#D32F2F" },
  chipAgendado: { backgroundColor: "#1565C0" },
  chipConcluido: { backgroundColor: "#2E7D32" },
  chipStatusTexto: { color: "#FFFFFF", fontWeight: "bold" },
  divider: { marginVertical: 14 },
  pedidoInfo: { fontSize: 14, color: "#374151", marginBottom: 4 },
  pedidoData: { fontSize: 13, color: "#6B7280" },
});