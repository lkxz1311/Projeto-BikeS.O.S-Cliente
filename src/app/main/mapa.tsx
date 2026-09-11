import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Text } from "react-native-paper";

import cleanMapStyle from "../../constants/mapStyle.json";
import {
  CATEGORY_META,
  JARDIM_REGION,
  POINTS_OF_INTEREST,
  type PointOfInterest,
} from "../../constants/mapPoints";

export default function Mapa() {
  const mapRef = useRef<MapView>(null);
  const modalMapRef = useRef<MapView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [selecionado, setSelecionado] = useState<PointOfInterest | null>(null);
  const [permissao, setPermissao] = useState<Location.PermissionResponse | null>(null);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    let ativo = true;

    (async () => {
      const atual = await Location.getForegroundPermissionsAsync();
      if (!ativo) return;

      if (!atual.granted && atual.canAskAgain) {
        const pedida = await Location.requestForegroundPermissionsAsync();
        if (ativo) setPermissao(pedida);
      } else {
        setPermissao(atual);
      }
    })().catch(() => {});

    return () => {
      ativo = false;
    };
  }, []);

  const temPermissao = !!permissao?.granted;
  const mostrarAvisoLocalizacao = !!permissao && !permissao.granted;

  const pedirLocalizacao = useCallback(async () => {
    if (permissao?.canAskAgain) {
      const pedida = await Location.requestForegroundPermissionsAsync().catch(() => null);
      if (pedida) setPermissao(pedida);
    } else {
      await Linking.openSettings().catch(() => {});
    }
  }, [permissao]);

  const selecionarPonto = useCallback(
    (poi: PointOfInterest) => {
      setSelecionado(poi);

      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();

      mapRef.current?.animateToRegion(
        {
          latitude: poi.latitude,
          longitude: poi.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        450,
      );
    },
    [fadeAnim],
  );

  const selecionarPontoNoModal = useCallback((poi: PointOfInterest) => {
    setSelecionado(poi);
    modalMapRef.current?.animateToRegion(
      {
        latitude: poi.latitude,
        longitude: poi.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      },
      450,
    );
  }, []);

  const fecharDetalhes = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setSelecionado(null);
    });
  }, [fadeAnim]);

  const ligar = useCallback(async (telefone: string) => {
    const numero = telefone.replace(/[^0-9+]/g, "");
    try {
      await Linking.openURL(`tel:${numero}`);
    } catch {
      Alert.alert("Não foi possível abrir", `Tente discar manualmente: ${telefone}`);
    }
  }, []);

  const comoChegar = useCallback(async (poi: PointOfInterest) => {
    const coords = `${poi.latitude},${poi.longitude}`;
    const url = Platform.select({
      ios: `maps://?daddr=${coords}&dirflg=d`,
      android: `google.navigation:q=${coords}`,
    });

    try {
      await Linking.openURL(url!);
    } catch {
      await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${coords}`);
    }
  }, []);

  return (
    <View style={styles.container}>
      <MapaErrorBoundary>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          initialRegion={JARDIM_REGION}
          showsUserLocation={temPermissao}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          customMapStyle={cleanMapStyle}
        >
          {POINTS_OF_INTEREST.map((poi) => (
            <Marker
              key={poi.id}
              identifier={poi.id}
              coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
              title={poi.name}
              description={CATEGORY_META[poi.category]?.label ?? "Técnico"}
              pinColor={CATEGORY_META[poi.category]?.color ?? "#1565C0"}
              onPress={() => selecionarPonto(poi)}
            />
          ))}
        </MapView>
      </MapaErrorBoundary>

      <SafeAreaView style={styles.topo} edges={["top"]} pointerEvents="box-none">
        <View style={styles.topoLinha}>
          <View style={styles.tituloBox}>
            <MaterialCommunityIcons name="account-wrench" size={18} color="#1565C0" />
            <Text style={styles.tituloTexto}>Técnicos da Região</Text>
          </View>

          <TouchableOpacity
            style={styles.botaoExpandir}
            onPress={() => setExpandido(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="fullscreen" size={20} color="#1565C0" />
          </TouchableOpacity>
        </View>

        {mostrarAvisoLocalizacao && (
          <AvisoLocalizacao
            podePerguntar={!!permissao?.canAskAgain}
            onPress={pedirLocalizacao}
          />
        )}
      </SafeAreaView>

      {selecionado && !expandido && (
        <Animated.View style={[styles.painelFlutuante, { opacity: fadeAnim }]}>
          <DetalhesPonto
            poi={selecionado}
            onFechar={fecharDetalhes}
            onLigar={ligar}
            onComoChegar={comoChegar}
          />
        </Animated.View>
      )}

      {/* MODAL EXPANDIDO COM MAPA E LISTA */}
      <Modal visible={expandido} animationType="slide" onRequestClose={() => setExpandido(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalBotaoFechar} onPress={() => setExpandido(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#1E2A38" />
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>Técnicos na Região</Text>
          </View>

          {/* PARTE SUPERIOR: MAPA NO MODAL */}
          <View style={styles.modalMapaBox}>
            <MapView
              ref={modalMapRef}
              style={StyleSheet.absoluteFillObject}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={JARDIM_REGION}
              showsUserLocation={temPermissao}
              customMapStyle={cleanMapStyle}
            >
              {POINTS_OF_INTEREST.map((poi) => (
                <Marker
                  key={poi.id}
                  coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
                  title={poi.name}
                  pinColor={CATEGORY_META[poi.category]?.color ?? "#1565C0"}
                  onPress={() => selecionarPontoNoModal(poi)}
                />
              ))}
            </MapView>
          </View>

          {/* PARTE INFERIOR: LISTA DE TÉCNICOS */}
          <View style={styles.listaContainer}>
            <Text style={styles.listaTitulo}>Técnicos Disponíveis</Text>
            <FlatList
              data={POINTS_OF_INTEREST}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.tecnicoCard}
                  activeOpacity={0.7}
                  onPress={() => selecionarPontoNoModal(item)}
                >
                  <View style={styles.tecnicoIcone}>
                    <MaterialCommunityIcons name="wrench" size={20} color="#1565C0" />
                  </View>
                  <View style={styles.tecnicoInfo}>
                    <Text style={styles.tecnicoNome}>{item.name}</Text>
                    <Text style={styles.tecnicoEndereco}>{item.address}</Text>
                    {item.hours && <Text style={styles.tecnicoHorario}>🕒 {item.hours}</Text>}
                  </View>
                  {item.phone && (
                    <TouchableOpacity
                      style={styles.tecnicoBotaoLigar}
                      onPress={(e) => {
                        e.stopPropagation();
                        ligar(item.phone!);
                      }}
                    >
                      <MaterialCommunityIcons name="phone" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

class MapaErrorBoundary extends Component<{ children: ReactNode }, { erro: boolean }> {
  state = { erro: false };

  static getDerivedStateFromError() {
    return { erro: true };
  }

  componentDidCatch(error: unknown) {
    console.log("[Mapa] o mapa falhou ao renderizar:", error);
  }

  render() {
    if (this.state.erro) {
      return <MapaIndisponivel message="Não foi possível carregar o mapa agora." />;
    }
    return <>{this.props.children}</>;
  }
}

function MapaIndisponivel({ message }: { message: string }) {
  return (
    <View style={[StyleSheet.absoluteFillObject, styles.indisponivel]}>
      <MaterialCommunityIcons name="map-outline" size={48} color="#1565C0" />
      <Text style={styles.indisponivelTexto}>{message}</Text>
    </View>
  );
}

function AvisoLocalizacao({
  podePerguntar,
  onPress,
}: {
  podePerguntar: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.aviso, pressed && styles.pressionado]}
    >
      <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#1565C0" />
      <Text style={styles.avisoTexto} numberOfLines={1}>
        {podePerguntar
          ? "Ative a localização para ver sua posição."
          : "GPS desativado. Toque para configurar."}
      </Text>
      <Text style={styles.avisoCta}>{podePerguntar ? "Permitir" : "Abrir"}</Text>
    </Pressable>
  );
}

function DetalhesPonto({
  poi,
  onFechar,
  onLigar,
  onComoChegar,
}: {
  poi: PointOfInterest;
  onFechar: () => void;
  onLigar: (telefone: string) => void;
  onComoChegar: (poi: PointOfInterest) => void;
}) {
  const meta = CATEGORY_META[poi.category] ?? { label: "TÉCNICO", color: "#1565C0" };

  return (
    <View style={styles.detalhes}>
      <View style={styles.detalhesTopo}>
        <View style={styles.categoriaLinha}>
          <View style={[styles.categoriaBolinha, { backgroundColor: meta.color }]} />
          <Text style={[styles.categoriaLabel, { color: meta.color }]}>
            {meta.label.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity onPress={onFechar} hitSlop={10}>
          <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <Text style={styles.nome} numberOfLines={1}>
        {poi.name}
      </Text>
      <Text style={styles.descricao} numberOfLines={2}>
        {poi.description}
      </Text>

      <View style={styles.infoLinha}>
        <MaterialCommunityIcons name="map-marker-outline" size={16} color="#1565C0" />
        <Text style={styles.infoTexto} numberOfLines={1}>
          {poi.address}
        </Text>
      </View>

      {poi.hours && (
        <View style={styles.infoLinha}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#1565C0" />
          <Text style={styles.infoTexto} numberOfLines={1}>
            {poi.hours}
          </Text>
        </View>
      )}

      <View style={styles.acoes}>
        {poi.phone && (
          <Pressable
            onPress={() => onLigar(poi.phone!)}
            style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
          >
            <MaterialCommunityIcons name="phone" size={16} color="#FFFFFF" />
            <Text style={styles.botaoTexto}>Ligar</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => onComoChegar(poi)}
          style={({ pressed }) => [
            styles.botao,
            styles.botaoSecundario,
            pressed && styles.pressionado,
          ]}
        >
          <MaterialCommunityIcons name="navigation-variant" size={16} color="#1565C0" />
          <Text style={[styles.botaoTexto, styles.botaoTextoSecundario]}>Como chegar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9FF" },

  topo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  topoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tituloBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tituloTexto: { fontSize: 13, fontWeight: "bold", color: "#1E2A38" },

  botaoExpandir: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avisoTexto: { flex: 1, fontSize: 12, color: "#374151" },
  avisoCta: { fontSize: 12, fontWeight: "bold", color: "#1565C0" },

  indisponivel: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
    backgroundColor: "#F5F9FF",
  },
  indisponivelTexto: { fontSize: 14, color: "#5F6B7A", textAlign: "center", lineHeight: 20 },

  painelFlutuante: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  detalhes: { gap: 6 },
  detalhesTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoriaLinha: { flexDirection: "row", alignItems: "center", gap: 6 },
  categoriaBolinha: { width: 8, height: 8, borderRadius: 4 },
  categoriaLabel: { fontSize: 10, fontWeight: "bold", letterSpacing: 0.8 },

  nome: { fontSize: 16, fontWeight: "bold", color: "#1E2A38" },
  descricao: { fontSize: 13, color: "#374151", lineHeight: 18 },

  infoLinha: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  infoTexto: { flex: 1, fontSize: 12, color: "#374151" },

  acoes: { flexDirection: "row", gap: 8, marginTop: 10 },
  botao: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#1565C0",
  },
  botaoSecundario: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#1565C0" },
  botaoTexto: { color: "#FFFFFF", fontWeight: "bold", fontSize: 13 },
  botaoTextoSecundario: { color: "#1565C0" },
  pressionado: { opacity: 0.75, transform: [{ scale: 0.98 }] },

  /* ESTILOS DO MODAL EXPANDIDO */
  modalContainer: { flex: 1, backgroundColor: "#F5F9FF" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalBotaoFechar: { padding: 4 },
  modalTitulo: { fontSize: 16, fontWeight: "bold", color: "#1E2A38" },
  modalMapaBox: { height: "40%", width: "100%" },

  listaContainer: { flex: 1, padding: 16 },
  listaTitulo: { fontSize: 15, fontWeight: "bold", color: "#1E2A38", marginBottom: 12 },
  tecnicoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tecnicoIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F0FE",
    alignItems: "center",
    justifyContent: "center",
  },
  tecnicoInfo: { flex: 1 },
  tecnicoNome: { fontSize: 14, fontWeight: "bold", color: "#1E2A38" },
  tecnicoEndereco: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  tecnicoHorario: { fontSize: 11, color: "#1565C0", marginTop: 2 },
  tecnicoBotaoLigar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1565C0",
    alignItems: "center",
    justifyContent: "center",
  },
});