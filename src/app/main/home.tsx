import { useState, useCallback } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View, Alert, Modal, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Card, Chip, Divider, IconButton, Text, ActivityIndicator, TextInput } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, router } from "expo-router";
import { listarPedidosService } from "../../../services/pedidoService";
import Mapa from './mapa';

type Pedido = {
  id: string;
  codigo: string;
  tipo: string;
  problema: string;
  status: string;
  createdAt: string;
  avaliado?: boolean;
  tecnicoId?: string;
};

type Tecnico = {
  id: string;
  nome: string;
  telefone: string;
  tipo: string;
};

export default function Home() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [loadingTecnicos, setLoadingTecnicos] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("");
  
  // Estados do Modal de Avaliação
  const [modalAvaliacao, setModalAvaliacao] = useState(false);
  const [pedidoParaAvaliar, setPedidoParaAvaliar] = useState<Pedido | null>(null);
  const [avaliacao, setAvaliacao] = useState(0);
  const [observacao, setObservacao] = useState("");
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  async function carregarDados() {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const resUsuario = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/usuarios/${userId}`);
      const usuario = await resUsuario.json();
      setNomeUsuario(usuario.nome?.split(" ")[0] || "");

      const resultado = await listarPedidosService(userId);
      if (resultado.ok && resultado.data) {
        setPedidos(resultado.data);

        // Exibe o modal apenas para pedidos Finalizados que NÃO foram avaliados
        const pendenteAvaliacao = resultado.data.find(
          (p: Pedido) => p.status === "Finalizado" && !p.avaliado
        );
        if (pendenteAvaliacao) {
          setPedidoParaAvaliar(pendenteAvaliacao);
          setModalAvaliacao(true);
        }
      }
    } catch (error) {
      console.log("Erro ao carregar dados:", error);
    } finally {
      setLoadingPedidos(false);
    }

    try {
      const resTecnicos = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/usuarios/tecnicos`);
      const data = await resTecnicos.json();
      setTecnicos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Erro ao carregar técnicos:", error);
    } finally {
      setLoadingTecnicos(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  }, []);

  async function enviarAvaliacaoServico() {
    if (avaliacao === 0 || !pedidoParaAvaliar) return;

    setEnviandoAvaliacao(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      const tecnicoIdFinal = pedidoParaAvaliar.tecnicoId || (pedidoParaAvaliar as any).idTecnico;

      const payload = {
        nota: avaliacao,
        comentario: observacao,
        clienteId: userId,
        tecnicoId: tecnicoIdFinal,
        pedidoId: pedidoParaAvaliar.id,
      };

      // Envia para a rota POST /avaliacoes definida no seu backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/avaliacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert("Obrigado!", "Sua avaliação foi enviada com sucesso!");
        setModalAvaliacao(false);
        setPedidoParaAvaliar(null);
        setAvaliacao(0);
        setObservacao("");
        await carregarDados(); // Recarrega os pedidos para atualizar a flag `avaliado`
      } else {
        const errorData = await response.json().catch(() => ({}));
        const mensagem = errorData.message || errorData.erro || "Erro ao salvar avaliação no servidor.";
        Alert.alert("Erro", mensagem);
      }
    } catch (error) {
      Alert.alert("Erro de Conexão", "Não foi possível conectar ao servidor.");
    } finally {
      setEnviandoAvaliacao(false);
    }
  }

  const pedidosAtivos = pedidos.filter(p => !["Finalizado", "Rejeitado"].includes(p.status)).length;
  const pedidosConcluidos = pedidos.filter(p => p.status === "Finalizado").length;

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function textoStatus(tipo: string, status: string): string {
    if (status === "Aguardando técnico aceitar") return "Aguardando técnico";
    if (status === "SOS enviado") return "SOS enviado";
    if (status === "Agendamento enviado") return "Agendamento enviado";
    if (status === "Técnico aceitou") return "Técnico aceitou";
    if (status === "Técnico a caminho") return "Em andamento";
    if (status === "Em atendimento") return "Em andamento";
    if (status === "Finalizado") return "Finalizado";
    if (status === "Rejeitado") return "Rejeitado";
    return status;
  }

  function corChip(tipo: string, status: string) {
    if (tipo === "sos") return styles.chipSOS;
    if (status === "Finalizado") return styles.chipConcluido;
    if (status === "Rejeitado") return styles.chipRejeitado;
    if (status === "Técnico aceitou" || status === "Técnico a caminho" || status === "Em atendimento") return styles.chipAndamento;
    if (tipo === "agendado") return styles.chipAgendado;
    return styles.chipNormal;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1565C0"]} tintColor="#1565C0" />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerEsquerda}>
            <Avatar.Icon size={52} icon="bike" color="#FFFFFF" style={styles.avatar} />
            <View>
              <Text style={styles.titulo}>Painel do Cliente</Text>
              <Text style={styles.subtitulo}>{nomeUsuario ? `Olá, ${nomeUsuario}! 👋` : "Olá! 👋"}</Text>
            </View>
          </View>
          <IconButton icon="bell-outline" iconColor="#1565C0" size={24} />
        </View>

        {/* MAPA */}
        <View style={styles.mapaContainer}>
          <Mapa />
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

        {loadingTecnicos ? (
          <ActivityIndicator color="#1565C0" style={{ marginVertical: 10 }} />
        ) : tecnicos.length === 0 ? (
          <Card style={styles.cardVazio}>
            <Card.Content style={styles.cardVazioContent}>
              <MaterialCommunityIcons name="account-off-outline" size={40} color="#9E9E9E" />
              <Text style={styles.cardVazioTexto}>Nenhum técnico disponível</Text>
            </Card.Content>
          </Card>
        ) : (
          tecnicos.map((tecnico) => (
            <Card key={tecnico.id} style={styles.cardTecnico}>
              <Card.Content style={styles.cardTecnicoContent}>
                <Avatar.Icon size={52} icon="account" color="#FFFFFF" style={styles.avatarTecnico} />
                <View style={styles.tecnicoInfo}>
                  <View style={styles.tecnicoTopo}>
                    <Text style={styles.tecnicoNome}>{tecnico.nome}</Text>
                    <Chip style={styles.chipOnline} textStyle={{ fontSize: 11, fontWeight: "bold", color: "#2E7D32" }}>
                      ONLINE
                    </Chip>
                  </View>
                  <View style={styles.tecnicoDetalhes}>
                    <MaterialCommunityIcons name="phone-outline" size={14} color="#6B7280" />
                    <Text style={styles.tecnicoTelefone}>{tecnico.telefone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.botaoSolicitar}
                    onPress={() => router.push(`/main/solicitar?tecnicoId=${tecnico.id}&tecnicoNome=${tecnico.nome}`)}
                  >
                    <Text style={styles.botaoSolicitarTexto}>Solicitar</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          ))
        )}

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
                    {textoStatus(pedido.tipo, pedido.status)}
                  </Chip>
                </View>
                <Divider style={styles.divider} />
                <Text style={styles.pedidoInfo}>Problema: {pedido.problema}</Text>
                <Text style={styles.pedidoData}>Data: {formatarData(pedido.createdAt)}</Text>

                {pedido.status === "Finalizado" && !pedido.avaliado && (
                  <TouchableOpacity
                    style={styles.botaoAvaliar}
                    onPress={() => {
                      setPedidoParaAvaliar(pedido);
                      setAvaliacao(0);
                      setObservacao("");
                      setModalAvaliacao(true);
                    }}
                  >
                    <MaterialCommunityIcons name="star-outline" size={16} color="#F59E0B" />
                    <Text style={styles.botaoAvaliarTexto}>Avaliar serviço</Text>
                  </TouchableOpacity>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* MODAL DE AVALIAÇÃO */}
      <Modal visible={modalAvaliacao} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="check-circle" size={52} color="#2E7D32" style={{ alignSelf: "center" }} />
            <Text style={styles.modalTitulo}>Serviço concluído!</Text>
            <Text style={styles.modalSubtitulo}>Como foi o atendimento?</Text>

            <View style={styles.estrelas}>
              {[1, 2, 3, 4, 5].map((estrela) => (
                <TouchableOpacity key={estrela} onPress={() => setAvaliacao(estrela)}>
                  <MaterialCommunityIcons
                    name={avaliacao >= estrela ? "star" : "star-outline"}
                    size={40}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              label="Observações (opcional)"
              mode="outlined"
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={3}
              style={styles.inputObservacao}
              activeOutlineColor="#1565C0"
              placeholder="Conte como foi a sua experiência..."
            />

            <TouchableOpacity
              style={[styles.botaoEnviarAvaliacao, (avaliacao === 0 || enviandoAvaliacao) && styles.botaoDesabilitado]}
              onPress={enviarAvaliacaoServico}
              disabled={avaliacao === 0 || enviandoAvaliacao}
            >
              {enviandoAvaliacao ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.botaoEnviarAvaliacaoTexto}>Enviar avaliação</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalAvaliacao(false)}>
              <Text style={styles.pularAvaliacao}>Pular por agora</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  titulo: { fontSize: 22, fontWeight: "bold", color: "#1E2A38" },
  subtitulo: { color: "#5F6B7A", marginTop: 2 },
  mapaContainer: { height: 280, width: "100%", marginBottom: 16, borderRadius: 18, overflow: "hidden" },
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
  tecnicoDetalhes: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  tecnicoTelefone: { fontSize: 13, color: "#6B7280" },
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
  chipAgendado: { backgroundColor: "#7B61FF" },
  chipConcluido: { backgroundColor: "#2E7D32" },
  chipRejeitado: { backgroundColor: "#9E9E9E" },
  chipAndamento: { backgroundColor: "#F59E0B" },
  chipStatusTexto: { color: "#FFFFFF", fontWeight: "bold" },
  divider: { marginVertical: 14 },
  pedidoInfo: { fontSize: 14, color: "#374151", marginBottom: 4 },
  pedidoData: { fontSize: 13, color: "#6B7280" },
  botaoAvaliar: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, backgroundColor: "#FEF3C7", padding: 8, borderRadius: 8 },
  botaoAvaliarTexto: { color: "#D97706", fontWeight: "bold", fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, width: "88%", alignItems: "center" },
  modalTitulo: { fontSize: 22, fontWeight: "bold", color: "#1E2A38", marginTop: 12, textAlign: "center" },
  modalSubtitulo: { fontSize: 15, color: "#5F6B7A", marginTop: 4, marginBottom: 16, textAlign: "center" },
  estrelas: { flexDirection: "row", gap: 8, marginBottom: 16 },
  inputObservacao: { width: "100%", backgroundColor: "#FFFFFF", marginBottom: 16 },
  botaoEnviarAvaliacao: { backgroundColor: "#1565C0", borderRadius: 12, paddingVertical: 12, width: "100%", alignItems: "center" },
  botaoDesabilitado: { backgroundColor: "#D1D5DB" },
  botaoEnviarAvaliacaoTexto: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
  pularAvaliacao: { color: "#9E9E9E", marginTop: 14, fontSize: 14 },
});