import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Card, IconButton, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Home() {
  const pedidosAtivos = 0;
  const pedidosConcluidos = 0;
  const tecnicosAprovados: any[] = [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerEsquerda}>
            <Avatar.Icon
              size={52}
              icon="bike"
              color="#FFFFFF"
              style={styles.avatar}
            />

            <View>
              <Text style={styles.titulo}>BikeS.O.S</Text>
              <Text style={styles.subtitulo}>Suporte rápido para ciclistas</Text>
            </View>
          </View>

          <IconButton icon="bell-outline" iconColor="#1565C0" size={24} />
        </View>

        <Card style={styles.cardMapa}>
          <Card.Content>
            <View style={styles.mapaVisual}>
              <View style={styles.linhaMapa1} />
              <View style={styles.linhaMapa2} />
              <View style={styles.linhaMapa3} />

              <View style={styles.pinUsuario}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={32}
                  color="#1565C0"
                />
              </View>

              <View style={styles.openStreetBox}>
                <Text style={styles.openStreetText}>OpenStreetMap</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.grid}>
          <Card style={styles.cardResumo}>
            <Card.Content>
              <View style={styles.iconeBoxAzul}>
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={26}
                  color="#1565C0"
                />
              </View>

              <Text style={styles.numero}>{pedidosAtivos}</Text>
              <Text style={styles.label}>Pedido ativo</Text>
            </Card.Content>
          </Card>

          <Card style={styles.cardResumo}>
            <Card.Content>
              <View style={styles.iconeBoxVerde}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={26}
                  color="#2E7D32"
                />
              </View>

              <Text style={styles.numero}>{pedidosConcluidos}</Text>
              <Text style={styles.label}>Concluídos</Text>
            </Card.Content>
          </Card>
        </View>

        <Text style={styles.secaoTitulo}>Técnicos disponíveis</Text>

        <View style={styles.areaTecnicos}>
          {tecnicosAprovados.map((tecnico) => (
            <Card key={tecnico.id} style={styles.cardTecnico}>
              <Card.Content>
                <Text>{tecnico.nome}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>
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
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  headerEsquerda: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    backgroundColor: "#1565C0",
    marginRight: 12,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E2A38",
  },

  subtitulo: {
    color: "#5F6B7A",
    marginTop: 2,
  },

  cardMapa: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 14,
  },

  mapaVisual: {
    height: 210,
    backgroundColor: "#E8EEF3",
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
  },

  linhaMapa1: {
    position: "absolute",
    width: 150,
    height: 6,
    backgroundColor: "#9FB6C8",
    top: 92,
    left: 34,
    borderRadius: 20,
    transform: [{ rotate: "28deg" }],
  },

  linhaMapa2: {
    position: "absolute",
    width: 145,
    height: 6,
    backgroundColor: "#9FB6C8",
    top: 88,
    right: 38,
    borderRadius: 20,
    transform: [{ rotate: "-22deg" }],
  },

  linhaMapa3: {
    position: "absolute",
    width: 120,
    height: 6,
    backgroundColor: "#9FB6C8",
    bottom: 56,
    left: 104,
    borderRadius: 20,
    transform: [{ rotate: "-12deg" }],
  },

  pinUsuario: {
    position: "absolute",
    left: 34,
    top: 72,
  },

  openStreetBox: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  openStreetText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1565C0",
  },

  grid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },

  cardResumo: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
  },

  iconeBoxAzul: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
  },

  iconeBoxVerde: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },

  numero: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1E2A38",
    marginTop: 10,
  },

  label: {
    color: "#5F6B7A",
    marginTop: 2,
  },

  secaoTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E2A38",
    marginBottom: 10,
  },

  areaTecnicos: {
    minHeight: 120,
  },

  cardTecnico: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 12,
  },
});