import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Chip,
  Divider,
  RadioButton,
  Text,
  TextInput,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

type TipoPedido = "normal" | "agendado" | "sos";

type Pedido = {
  codigo: string;
  tipo: TipoPedido;
  problema: string;
  bike: string;
  localizacao: string;
  telefone: string;
  pagamento: string;
  dataAgendada?: string;
  horarioAgendado?: string;
  status: string;
};

export default function Solicitar() {
  const { sos } = useLocalSearchParams();

  const [agendar, setAgendar] = useState(false);

  const [problema, setProblema] = useState("");
  const [bike, setBike] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pagamento, setPagamento] = useState("Pix");

  const [dataAgendada, setDataAgendada] = useState("");
  const [horarioAgendado, setHorarioAgendado] = useState("");

  const [pedidoCriado, setPedidoCriado] = useState<Pedido | null>(null);
  const [sosJaCriado, setSosJaCriado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (sos === "true" && !sosJaCriado) {
      criarPedidoSOS();
      setSosJaCriado(true);
    }
  }, [sos, sosJaCriado]);

  function gerarCodigoPedido() {
    return `BS${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function formatarTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 2) {
      return `(${numeros}`;
    }

    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(
      7,
      11
    )}`;
  }

  function formatarData(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 8);

    if (numeros.length <= 2) {
      return numeros;
    }

    if (numeros.length <= 4) {
      return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    }

    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(
      4,
      8
    )}`;
  }

  function formatarHorario(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 4);

    if (numeros.length <= 2) {
      return numeros;
    }

    return `${numeros.slice(0, 2)}:${numeros.slice(2, 4)}`;
  }

  function validarCamposBase() {
    if (!problema || !bike || !localizacao || !telefone) {
      setErro("Preencha os dados do atendimento.");
      return false;
    }

    if (telefone.replace(/\D/g, "").length < 11) {
      setErro("Digite o telefone com DDD e 9 dígitos.");
      return false;
    }

    setErro("");
    return true;
  }

  function criarPedidoNormal() {
    if (!validarCamposBase()) return;

    setPedidoCriado({
      codigo: gerarCodigoPedido(),
      tipo: "normal",
      problema,
      bike,
      localizacao,
      telefone,
      pagamento,
      status: "Aguardando técnico aceitar",
    });
  }

  function criarPedidoAgendado() {
    if (!validarCamposBase()) return;

    if (dataAgendada.length !== 10 || horarioAgendado.length !== 5) {
      setErro(
        "Informe a data no formato 00/00/0000 e o horário no formato 00:00."
      );
      return;
    }

    setErro("");

    setPedidoCriado({
      codigo: gerarCodigoPedido(),
      tipo: "agendado",
      problema,
      bike,
      localizacao,
      telefone,
      pagamento,
      dataAgendada,
      horarioAgendado,
      status: "Agendamento enviado",
    });
  }

  function criarPedidoSOS() {
    setErro("");

    setPedidoCriado({
      codigo: gerarCodigoPedido(),
      tipo: "sos",
      problema: "Solicitação urgente de socorro",
      bike: "Não informado",
      localizacao: "Localização atual do cliente",
      telefone: "Telefone do perfil",
      pagamento: "Atendimento prioritário",
      status: "SOS enviado",
    });
  }

  function confirmarPedido() {
    if (agendar) {
      criarPedidoAgendado();
    } else {
      criarPedidoNormal();
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.titulo}>Solicitar serviço</Text>
            <Text style={styles.subtitulo}>
              Preencha os dados para pedir atendimento.
            </Text>
          </View>

          <View style={styles.headerIcone}>
            <MaterialCommunityIcons name="bike-fast" size={28} color="#1565C0" />
          </View>
        </View>

        <Card
          style={[styles.cardAgendarBotao, agendar && styles.cardAgendarAtivo]}
          onPress={() => setAgendar(!agendar)}
        >
          <Card.Content style={styles.agendarBotaoContent}>
            <View
              style={[styles.agendarIcone, agendar && styles.agendarIconeAtivo]}
            >
              <MaterialCommunityIcons
                name={agendar ? "calendar-check" : "calendar-clock"}
                size={30}
                color={agendar ? "#FFFFFF" : "#1565C0"}
              />
            </View>

            <View style={styles.agendarTextoBox}>
              <Text
                style={[
                  styles.agendarTitulo,
                  agendar && styles.agendarTituloAtivo,
                ]}
              >
                {agendar ? "Agendamento ativado" : "Agendar serviço"}
              </Text>

              <Text
                style={[
                  styles.agendarTexto,
                  agendar && styles.agendarTextoAtivo,
                ]}
              >
                {agendar
                  ? "Escolha a data e o horário do atendimento."
                  : "Use essa opção se o atendimento não for urgente."}
              </Text>
            </View>

            <MaterialCommunityIcons
              name={agendar ? "chevron-up" : "chevron-down"}
              size={26}
              color={agendar ? "#FFFFFF" : "#1565C0"}
            />
          </Card.Content>
        </Card>

        {agendar && (
          <Card style={styles.cardAgendamento}>
            <Card.Content>
              <View style={styles.agendamentoTopo}>
                <View style={styles.agendamentoIcone}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={30}
                    color="#1565C0"
                  />
                </View>

                <View style={styles.agendamentoTextoBox}>
                  <Text style={styles.agendamentoTitulo}>
                    Dados do agendamento
                  </Text>

                  <Text style={styles.agendamentoTexto}>
                    Informe apenas números. O app formata automaticamente.
                  </Text>
                </View>
              </View>

              <View style={styles.linhaDataHora}>
                <TextInput
                  label="Data"
                  mode="outlined"
                  value={dataAgendada}
                  onChangeText={(text) => setDataAgendada(formatarData(text))}
                  keyboardType="number-pad"
                  placeholder="00/00/0000"
                  maxLength={10}
                  style={styles.inputMetade}
                  activeOutlineColor="#1565C0"
                  left={<TextInput.Icon icon="calendar" color="#1565C0" />}
                />

                <TextInput
                  label="Horário"
                  mode="outlined"
                  value={horarioAgendado}
                  onChangeText={(text) =>
                    setHorarioAgendado(formatarHorario(text))
                  }
                  keyboardType="number-pad"
                  placeholder="00:00"
                  maxLength={5}
                  style={styles.inputMetade}
                  activeOutlineColor="#1565C0"
                  left={<TextInput.Icon icon="clock-outline" color="#1565C0" />}
                />
              </View>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitulo}>Dados do atendimento</Text>

            <TextInput
              label="Tipo de problema"
              mode="outlined"
              value={problema}
              onChangeText={setProblema}
              style={styles.input}
              activeOutlineColor="#1565C0"
              left={
                <TextInput.Icon
                  icon="alert-circle-outline"
                  color="#1565C0"
                />
              }
            />

            <TextInput
              label="Modelo ou tipo da bike"
              mode="outlined"
              value={bike}
              onChangeText={setBike}
              style={styles.input}
              activeOutlineColor="#1565C0"
              left={<TextInput.Icon icon="bike" color="#1565C0" />}
            />

            <TextInput
              label="Localização"
              mode="outlined"
              value={localizacao}
              onChangeText={setLocalizacao}
              style={styles.input}
              activeOutlineColor="#1565C0"
              placeholder="Digite sua localização"
              left={
                <TextInput.Icon icon="map-marker-outline" color="#1565C0" />
              }
            />

            <TextInput
              label="Telefone para contato"
              mode="outlined"
              value={telefone}
              onChangeText={(text) => setTelefone(formatarTelefone(text))}
              keyboardType="phone-pad"
              placeholder="(67) 99999-9999"
              style={styles.input}
              activeOutlineColor="#1565C0"
              left={<TextInput.Icon icon="phone-outline" color="#1565C0" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Forma de pagamento" />

          <Card.Content>
            <RadioButton.Group value={pagamento} onValueChange={setPagamento}>
              <RadioButton.Item label="Pix" value="Pix" />
              <RadioButton.Item label="Dinheiro" value="Dinheiro" />
              <RadioButton.Item label="Cartão" value="Cartão" />
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {erro !== "" && (
          <View style={styles.erroBox}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={22}
              color="#D32F2F"
            />

            <Text style={styles.erroTexto}>{erro}</Text>
          </View>
        )}

        <Button
          mode="contained"
          buttonColor="#1565C0"
          style={styles.botaoConfirmar}
          icon={agendar ? "calendar-check" : "send"}
          onPress={confirmarPedido}
        >
          {agendar ? "Confirmar agendamento" : "Confirmar solicitação"}
        </Button>

        {pedidoCriado && (
          <Card style={styles.cardPedido}>
            <Card.Content>
              <View style={styles.topoPedido}>
                <View style={styles.codigoBox}>
                  <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={20}
                    color="#1565C0"
                  />

                  <Text style={styles.codigo}>#{pedidoCriado.codigo}</Text>
                </View>

                <Chip
                  style={[
                    styles.chipStatus,
                    pedidoCriado.tipo === "sos" && styles.chipSOS,
                    pedidoCriado.tipo === "agendado" && styles.chipAgendado,
                  ]}
                  textStyle={styles.chipStatusTexto}
                >
                  {pedidoCriado.status}
                </Chip>
              </View>

              <Divider style={styles.divider} />

              <Text style={styles.info}>Problema: {pedidoCriado.problema}</Text>
              <Text style={styles.info}>Bike: {pedidoCriado.bike}</Text>
              <Text style={styles.info}>
                Localização: {pedidoCriado.localizacao}
              </Text>
              <Text style={styles.info}>Telefone: {pedidoCriado.telefone}</Text>
              <Text style={styles.info}>Pagamento: {pedidoCriado.pagamento}</Text>
              <Text style={styles.info}>
                Status: aguardando um técnico aceitar
              </Text>

              {pedidoCriado.tipo === "agendado" && (
                <View style={styles.resumoAgendamento}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={22}
                    color="#1565C0"
                  />

                  <View>
                    <Text style={styles.resumoAgendamentoTitulo}>
                      Agendado para:
                    </Text>
                    <Text style={styles.resumoAgendamentoTexto}>
                      {pedidoCriado.dataAgendada} às{" "}
                      {pedidoCriado.horarioAgendado}
                    </Text>
                  </View>
                </View>
              )}

              {pedidoCriado.tipo === "sos" && (
                <View style={styles.sosBox}>
                  <MaterialCommunityIcons
                    name="alarm-light-outline"
                    size={22}
                    color="#D32F2F"
                  />

                  <Text style={styles.sosTexto}>
                    Chamado urgente enviado para técnicos disponíveis.
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
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
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E2A38",
  },

  subtitulo: {
    color: "#5F6B7A",
    marginTop: 3,
  },

  headerIcone: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
  },

  cardAgendarBotao: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardAgendarAtivo: {
    backgroundColor: "#1565C0",
    borderColor: "#1565C0",
  },

  agendarBotaoContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  agendarIcone: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  agendarIconeAtivo: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  agendarTextoBox: {
    flex: 1,
  },

  agendarTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1E2A38",
  },

  agendarTituloAtivo: {
    color: "#FFFFFF",
  },

  agendarTexto: {
    color: "#5F6B7A",
    marginTop: 3,
    lineHeight: 19,
  },

  agendarTextoAtivo: {
    color: "#E8F0FE",
  },

  cardAgendamento: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: "#1565C0",
  },

  agendamentoTopo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  agendamentoIcone: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  agendamentoTextoBox: {
    flex: 1,
  },

  agendamentoTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1E2A38",
  },

  agendamentoTexto: {
    color: "#5F6B7A",
    marginTop: 3,
    lineHeight: 19,
  },

  linhaDataHora: {
    flexDirection: "row",
    gap: 10,
  },

  inputMetade: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 14,
  },

  cardTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1E2A38",
    marginBottom: 12,
  },

  input: {
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },

  erroBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },

  erroTexto: {
    flex: 1,
    color: "#D32F2F",
    fontWeight: "600",
  },

  botaoConfirmar: {
    borderRadius: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },

  cardPedido: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
  },

  topoPedido: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  codigoBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  codigo: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "bold",
    color: "#1565C0",
  },

  chipStatus: {
    backgroundColor: "#1565C0",
  },

  chipSOS: {
    backgroundColor: "#D32F2F",
  },

  chipAgendado: {
    backgroundColor: "#1565C0",
  },

  chipStatusTexto: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  divider: {
    marginVertical: 14,
  },

  info: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 7,
  },

  resumoAgendamento: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F0FE",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },

  resumoAgendamentoTitulo: {
    color: "#1565C0",
    fontWeight: "bold",
  },

  resumoAgendamentoTexto: {
    color: "#374151",
    marginTop: 2,
  },

  sosBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },

  sosTexto: {
    flex: 1,
    color: "#D32F2F",
    fontWeight: "bold",
  },
});