import { useState, useCallback, useRef } from "react";
import {
  ScrollView, StyleSheet, TouchableOpacity, View, Alert, Animated, TextInput, Keyboard, TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Avatar, Card, Chip, Divider, IconButton, Text, ActivityIndicator,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, router } from "expo-router";
import { listarPedidosService } from "../../../services/pedidoService";

type Pedido = {
  id: string;
  codigo: string;
  tipo: string;
  problema: string;
  status: string;
  createdAt: string;
  tecnicoId?: string;
};

type Tecnico = {
  id: string;
  nome: string;
  telefone: string;
  tipo: string;
};

const PROXIMO_STATUS: Record<string, string> = {
  "Técnico aceitou": "Em atendimento",
  "Aceito pelo técnico": "Em atendimento",
  "Em atendimento": "Finalizado",
};

const LABEL_BOTAO: Record<string, string> = {
  "Técnico aceitou": "Iniciar Serviço",
  "Aceito pelo técnico": "Iniciar Serviço",
  "Em atendimento": "Finalizar Serviço",
};

export default function Home() {
  const [pedidos, setPedidos]                 = useState<Pedido[]>([]);
  const [tecnicos, setTecnicos]               = useState<Tecnico[]>([]);
  const [loadingPedidos, setLoadingPedidos]   = useState(true);
  const [loadingTecnicos, setLoadingTecnicos] = useState(true);
  const [nomeUsuario, setNomeUsuario]         = useState("");
  const [userId, setUserId]                   = useState("");

  const [sheetPedido, setSheetPedido]         = useState<Pedido | null>(null);
  const [sheetVisivel, setSheetVisivel]       = useState(false);
  const slideAnim                             = useRef(new Animated.Value(400)).current;

  const [nota, setNota]                       = useState(0);
  const [comentario, setComentario]           = useState("");
  const [enviandoAv, setEnviandoAv]           = useState(false);
  const [avEnviada, setAvEnviada]             = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  async function carregarDados() {
    try {
      const uid = await AsyncStorage.getItem("userId");
      if (!uid) return;
      setUserId(uid);

      const resUsuario = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/usuarios/${uid}`);
      const usuario = await resUsuario.json();
      setNomeUsuario(usuario.nome?.split(" ")[0] || "");

      const resultado = await listarPedidosService(uid);
      if (resultado.ok && resultado.data) setPedidos(resultado.data);
    } catch (e) {
      console.log("Erro ao carregar dados:", e);
    } finally {
      setLoadingPedidos(false);
    }

    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/usuarios/tecnicos`);
      const data = await res.json();
      setTecnicos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Erro ao carregar técnicos:", e);
    } finally {
      setLoadingTecnicos(false);
    }
  }

  function abrirSheet(pedido: Pedido) {
    if (sheetVisivel && sheetPedido?.id === pedido.id) {
      fecharSheet();
      return;
    }
    setSheetPedido(pedido);
    setNota(0);
    setComentario("");
    setSheetVisivel(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }

  function fecharSheet() {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      setSheetVisivel(false);
      setSheetPedido(null);
    });
  }

  async function avancarStatus(pedido: Pedido) {
    const novoStatus = PROXIMO_STATUS[pedido.status];
    if (!novoStatus) return;

    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/pedidos/${pedido.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: novoStatus }),
        }
      );

      if (!res.ok) throw new Error("Falha ao atualizar status");

      // Atualiza o estado da lista local e do BottomSheet no app
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedido.id ? { ...p, status: novoStatus } : p))
      );
      setSheetPedido((prev) => (prev ? { ...prev, status: novoStatus } : prev));

      if (novoStatus === "Finalizado") {
        Alert.alert("Serviço Concluído", "O serviço foi finalizado! Deixe sua avaliação abaixo.");
      }
    } catch (e) {
      console.log("Erro ao avançar status:", e);
      Alert.alert("Erro", "Não foi possível atualizar o status.");
    }
  }

  async function enviarAvaliacao() {
    if (!sheetPedido || nota === 0) {
      Alert.alert("Atenção", "Selecione pelo menos 1 estrela para enviar.");
      return;
    }

    setEnviandoAv(true);
    try {
      // Ajustado para rota/payload compatível com a criação de avaliação
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/avaliacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota,
          comentario: comentario.trim() || undefined,
          clienteId: userId,
          tecnicoId: sheetPedido.tecnicoId || "",
          pedidoId: sheetPedido.id,
        }),
      });

      if (!res.ok) {
        // Tenta rota secundária caso seu backend use /pedidos/avaliar
        const resAlt = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/pedidos/avaliar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nota,
            comentario: comentario.trim() || undefined,
            clienteId: userId,
            tecnicoId: sheetPedido.tecnicoId || "",
            pedidoId: sheetPedido.id,
          }),
        });

        if (!resAlt.ok) throw new Error("Falha ao enviar avaliação");
      }

      setAvEnviada((prev) => [...prev, sheetPedido.id]);
      Alert.alert("Obrigado!", "Avaliação enviada com sucesso! 🌟");
      
      // Atualiza os dados gerais e fecha o sheet
      await carregarDados();
      fecharSheet();
    } catch (e) {
      console.log("Erro ao enviar avaliação:", e);
      Alert.alert("Erro", "Não foi possível enviar a avaliação.");
    } finally {
      setEnviandoAv(false);
    }
  }

  const pedidosAtivos     = pedidos.filter((p) => !["Finalizado", "Rejeitado"].includes(p.status)).length;
  const pedidosConcluidos = pedidos.filter((p) => p.status === "Finalizado").length;

  function formatarData(d: string) {
    return new Date(d).toLocaleDateString("pt-BR");
  }

  function textoStatus(tipo: string, status: string) {
    if (status === "Aguardando técnico aceitar") return "Aguardando";
    if (status === "Técnico aceitou" || status === "Aceito pelo técnico") return "Aceito pelo técnico";
    if (status === "Em atendimento")             return "Em andamento";
    if (status === "Finalizado")                 return "Finalizado";
    if (status === "Rejeitado")                  return "Rejeitado";
    if (status === "SOS enviado")                return "SOS enviado";
    if (status === "Agendamento enviado")        return "Agendado";
    return status;
  }

  function corChip(tipo: string, status: string) {
    if (tipo === "sos")                                                      return styles.chipSOS;
    if (status === "Finalizado")                                             return styles.chipConcluido;
    if (status === "Rejeitado")                                              return styles.chipRejeitado;
    if (["Técnico aceitou", "Aceito pelo técnico", "Em atendimento"].includes(status)) return styles.chipAndamento;
    if (tipo === "agendado")                                                 return styles.chipAgendado;
    return styles.chipNormal;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>

      {/* BACKDROP */}
      {sheetVisivel && (
        <TouchableWithoutFeedback onPress={fecharSheet}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerEsquerda}>
            <Avatar.Icon size={52} icon="bike" color="#FFFFFF" style={styles.avatar} />
            <View>
              <Text style={styles.titulo}>Painel do Cliente</Text>
              <Text style={styles.subtitulo}>
                {nomeUsuario ? `Olá, ${nomeUsuario}! 👋` : "Olá! 👋"}
              </Text>
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
            <TouchableOpacity key={pedido.id} onPress={() => abrirSheet(pedido)} activeOpacity={0.85}>
              <Card style={[styles.cardPedido, sheetPedido?.id === pedido.id && styles.cardPedidoAtivo]}>
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
                  <View style={styles.hintToque}>
                    <MaterialCommunityIcons
                      name={sheetPedido?.id === pedido.id ? "chevron-down" : "chevron-up"}
                      size={16}
                      color="#9CA3AF"
                    />
                    <Text style={styles.hintTexto}>
                      {sheetPedido?.id === pedido.id ? "Fechar" : "Toque para detalhes"}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* BOTTOM SHEET */}
      {sheetVisivel && sheetPedido && (
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetAlca} />

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* cabeçalho */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitulo}>#{sheetPedido.codigo}</Text>
              <TouchableOpacity onPress={fecharSheet}>
                <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetProblema}>{sheetPedido.problema}</Text>
            <Text style={styles.sheetData}>{formatarData(sheetPedido.createdAt)}</Text>

            <Divider style={{ marginVertical: 16 }} />

            {/* fluxo de status */}
            {["Técnico aceitou", "Aceito pelo técnico", "Em atendimento", "Finalizado"].includes(sheetPedido.status) && (
              <>
                <PassosStatus status={sheetPedido.status} />

                {/* botão de avanço */}
                {LABEL_BOTAO[sheetPedido.status] && (
                  <TouchableOpacity
                    style={[
                      styles.btnStatus,
                      sheetPedido.status === "Em atendimento" && styles.btnFinalizar,
                    ]}
                    onPress={() => avancarStatus(sheetPedido)}
                  >
                    <Text style={styles.btnStatusTexto}>
                      {LABEL_BOTAO[sheetPedido.status]}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* avaliação — só aparece após finalizado */}
                {sheetPedido.status === "Finalizado" && (
                  avEnviada.includes(sheetPedido.id) ? (
                    <View style={styles.avEnviadaBox}>
                      <MaterialCommunityIcons name="check-circle" size={28} color="#2E7D32" />
                      <Text style={styles.avEnviadaTexto}>Avaliação enviada!</Text>
                    </View>
                  ) : (
                    <View style={styles.avaliacaoBox}>
                      <View style={styles.avCabecalho}>
                        <MaterialCommunityIcons name="star-circle" size={24} color="#F59E0B" />
                        <Text style={styles.avTitulo}>Como foi o atendimento?</Text>
                      </View>
                      <View style={styles.estrelas}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <TouchableOpacity key={n} onPress={() => setNota(n)}>
                            <MaterialCommunityIcons
                              name={nota >= n ? "star" : "star-outline"}
                              size={38}
                              color="#F59E0B"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TextInput
                        style={styles.inputComentario}
                        placeholder="Deixe um comentário (opcional)"
                        placeholderTextColor="#9CA3AF"
                        value={comentario}
                        onChangeText={setComentario}
                        multiline
                        maxLength={200}
                      />
                      <TouchableOpacity
                        style={[styles.btnEnviarAv, nota === 0 && styles.btnDesabilitado]}
                        onPress={enviarAvaliacao}
                        disabled={nota === 0 || enviandoAv}
                      >
                        {enviandoAv ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.btnEnviarAvTexto}>Enviar avaliação</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity onPress={fecharSheet}>
                        <Text style={styles.pularTexto}>Pular por agora</Text>
                      </TouchableOpacity>
                    </View>
                  )
                )}
              </>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const PASSOS = [
  { key: "Técnico aceitou", label: "Aceito pelo técnico" },
  { key: "Em atendimento",  label: "Em andamento"        },
  { key: "Finalizado",      label: "Finalizado"          },
];

function PassosStatus({ status }: { status: string }) {
  const statusNormalizado = status === "Aceito pelo técnico" ? "Técnico aceitou" : status;
  const ordemAtual = PASSOS.findIndex((p) => p.key === statusNormalizado);
  
  return (
    <View style={styles.passosRow}>
      {PASSOS.map((passo, i) => {
        const concluido = i <= ordemAtual;
        const atual     = i === ordemAtual;
        return (
          <View key={passo.key} style={styles.passoItem}>
            <View style={[styles.passoBolinha, concluido && styles.passoConcluido, atual && styles.passoAtual]}>
              {concluido ? (
                <MaterialCommunityIcons name="check" size={14} color="#fff" />
              ) : (
                <Text style={styles.passoBolinhNum}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.passoLabel, atual && styles.passoLabelAtual, concluido && styles.passoLabelConcluido]}>
              {passo.label}
            </Text>
            {i < PASSOS.length - 1 && (
              <View style={[styles.passoLinha, concluido && styles.passoLinhaConcluida]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({

  safeArea:  { flex: 1, backgroundColor: "#F5F9FF" },
  container: { flex: 1, backgroundColor: "#F5F9FF" },
  content:   { padding: 16, paddingBottom: 220 },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 10 },

  header:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  headerEsquerda: { flexDirection: "row", alignItems: "center" },
  avatar:         { backgroundColor: "#1565C0", marginRight: 12 },
  titulo:         { fontSize: 22, fontWeight: "bold", color: "#1E2A38" },
  subtitulo:      { color: "#5F6B7A", marginTop: 2 },

  grid:          { flexDirection: "row", gap: 12, marginBottom: 14 },
  cardResumo:    { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 18 },
  iconeBoxAzul:  { width: 46, height: 46, borderRadius: 14, backgroundColor: "#E8F0FE", justifyContent: "center", alignItems: "center" },
  iconeBoxVerde: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center" },
  numero:        { fontSize: 30, fontWeight: "bold", color: "#1E2A38", marginTop: 10 },
  label:         { color: "#5F6B7A", marginTop: 2 },

  secaoTitulo:        { fontSize: 18, fontWeight: "bold", color: "#1E2A38", marginBottom: 10 },
  cardTecnico:        { backgroundColor: "#FFFFFF", borderRadius: 18, marginBottom: 12 },
  cardTecnicoContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarTecnico:      { backgroundColor: "#1565C0" },
  tecnicoInfo:        { flex: 1 },
  tecnicoTopo:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tecnicoNome:        { fontSize: 16, fontWeight: "bold", color: "#1E2A38" },
  chipOnline:         { backgroundColor: "#E8F5E9" },
  tecnicoDetalhes:    { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  tecnicoTelefone:    { fontSize: 13, color: "#6B7280" },
  botaoSolicitar:     { backgroundColor: "#1565C0", borderRadius: 10, paddingVertical: 8, alignItems: "center", marginTop: 10 },
  botaoSolicitarTexto:{ color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },

  cardVazio:        { backgroundColor: "#FFFFFF", borderRadius: 18, marginBottom: 12 },
  cardVazioContent: { alignItems: "center", paddingVertical: 20 },
  cardVazioTexto:   { color: "#9E9E9E", marginTop: 8, fontSize: 15 },

  cardPedido:      { backgroundColor: "#FFFFFF", borderRadius: 18, marginBottom: 12 },
  cardPedidoAtivo: { borderWidth: 2, borderColor: "#1565C0" },
  topoPedido:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  codigoBox:       { flexDirection: "row", alignItems: "center" },
  codigo:          { marginLeft: 6, fontSize: 15, fontWeight: "bold", color: "#1565C0" },
  divider:         { marginVertical: 14 },
  pedidoInfo:      { fontSize: 14, color: "#374151", marginBottom: 4 },
  pedidoData:      { fontSize: 13, color: "#6B7280" },
  hintToque:       { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
  hintTexto:       { fontSize: 12, color: "#9CA3AF" },

  chipNormal:     { backgroundColor: "#1565C0" },
  chipSOS:        { backgroundColor: "#D32F2F" },
  chipAgendado:   { backgroundColor: "#7B61FF" },
  chipConcluido:  { backgroundColor: "#2E7D32" },
  chipRejeitado:  { backgroundColor: "#D32F2F" },
  chipAndamento:  { backgroundColor: "#ffa500" },
  chipStatusTexto:{ color: "#FFFFFF", fontWeight: "bold" },

  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
    maxHeight: "75%",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  sheetAlca:    { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 16 },
  sheetHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetTitulo:  { fontSize: 18, fontWeight: "bold", color: "#1E2A38" },
  sheetProblema:{ fontSize: 14, color: "#374151", marginTop: 6 },
  sheetData:    { fontSize: 13, color: "#9CA3AF", marginTop: 2 },

  passosRow:           { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  passoItem:           { flex: 1, alignItems: "center", position: "relative" },
  passoBolinha:        { width: 28, height: 28, borderRadius: 14, backgroundColor: "#E5E7EB", justifyContent: "center", alignItems: "center", marginBottom: 6 },
  passoConcluido:      { backgroundColor: "#1565C0" },
  passoAtual:          { backgroundColor: "#1565C0" },
  passoBolinhNum:      { fontSize: 12, fontWeight: "bold", color: "#6B7280" },
  passoLabel:          { fontSize: 11, color: "#9CA3AF", textAlign: "center" },
  passoLabelAtual:     { color: "#1565C0", fontWeight: "bold" },
  passoLabelConcluido: { color: "#1565C0" },
  passoLinha:          { position: "absolute", top: 14, left: "55%", right: "-55%", height: 2, backgroundColor: "#E5E7EB", zIndex: -1 },
  passoLinhaConcluida: { backgroundColor: "#1565C0" },

  btnStatus:     { backgroundColor: "#1565c0", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 16 },
  btnFinalizar:  { backgroundColor: "#2E7D32" },
  btnStatusTexto:{ color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },

  avaliacaoBox:    { backgroundColor: "#FFFBEB", borderRadius: 16, padding: 16, marginTop: 4 },
  avCabecalho:     { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  avTitulo:        { fontSize: 15, fontWeight: "bold", color: "#1E2A38" },
  estrelas:        { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 16 },
  inputComentario: { backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", padding: 12, fontSize: 14, color: "#1E2A38", minHeight: 70, textAlignVertical: "top", marginBottom: 14 },
  btnEnviarAv:     { backgroundColor: "#1565C0", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  btnDesabilitado: { backgroundColor: "#D1D5DB" },
  btnEnviarAvTexto:{ color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
  pularTexto:      { color: "#9CA3AF", textAlign: "center", marginTop: 12, fontSize: 14 },
  avEnviadaBox:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  avEnviadaTexto:  { fontSize: 15, fontWeight: "bold", color: "#2E7D32" },
});