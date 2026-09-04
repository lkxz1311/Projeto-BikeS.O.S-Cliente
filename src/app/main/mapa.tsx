import { Component, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert, Animated, Linking, Platform, Pressable, StyleSheet, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";

import {
  CATEGORY_META,
  JARDIM_REGION,
  POINTS_OF_INTEREST,
  type PointOfInterest,
} from "../../constants/mapPoints";

export default function Mapa() {
  const mapRef = useRef<MapView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [selecionado, setSelecionado] = useState<PointOfInterest | null>(null);
  const [permissao, setPermissao] = useState<Location.PermissionResponse | null>(null);

  // Pede a permissao uma vez ao montar. Sem isso, ligar "minha localizacao" no
  // mapa dispara SecurityException no Android (ACCESS_FINE/COARSE_LOCATION).
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
    })().catch(() => {
      /* usuario pode negar — seguimos sem "minha localizacao" */
    });

    return () => {
      ativo = false;
    };
  }, []);

  const temPermissao = !!permissao?.granted;
  // So avisamos depois que o status carregou e a permissao nao foi concedida.
  const mostrarAvisoLocalizacao = !!permissao && !permissao.granted;

  const pedirLocalizacao = useCallback(async () => {
    // Ainda da pra pedir no app? Reabre o prompt nativo. Senao, manda as
    // configuracoes do sistema (usuario ja negou "para sempre").
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
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        450,
      );
    },
    [fadeAnim],
  );

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
    // URLs de direcao (nao de busca): omitir a origem faz o app de mapas usar a
    // localizacao atual do usuario como ponto de partida automaticamente.
    const url = Platform.select({
      // Apple Maps: daddr = destino, saddr ausente = "minha localizacao", dirflg=d (dirigindo).
      ios: `maps://?daddr=${coords}&dirflg=d`,
      // Google Maps (Android): navegacao a partir da localizacao atual.
      android: `google.navigation:q=${coords}`,
    });

    try {
      await Linking.openURL(url!);
    } catch {
      // Fallback web: directions com destino; origem padrao = localizacao atual.
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
          showsMyLocationButton={temPermissao}
          toolbarEnabled={false}
        >
          {POINTS_OF_INTEREST.map((poi) => (
            <Marker
              key={poi.id}
              identifier={poi.id}
              coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
              title={poi.name}
              description={CATEGORY_META[poi.category].label}
              pinColor={CATEGORY_META[poi.category].color}
              onPress={() => selecionarPonto(poi)}
            />
          ))}
        </MapView>
      </MapaErrorBoundary>

      <SafeAreaView style={styles.topo} edges={["top"]} pointerEvents="box-none">
        <View style={styles.tituloBox}>
          <MaterialCommunityIcons name="map-marker-radius" size={22} color="#1565C0" />
          <Text style={styles.tituloTexto}>Pontos de apoio</Text>
        </View>

        {mostrarAvisoLocalizacao && (
          <AvisoLocalizacao
            podePerguntar={!!permissao?.canAskAgain}
            onPress={pedirLocalizacao}
          />
        )}
      </SafeAreaView>

      <Animated.View style={[styles.painel, { opacity: fadeAnim }]}>
        <View style={styles.painelAlca} />
        {selecionado ? (
          <DetalhesPonto
            poi={selecionado}
            onFechar={() => setSelecionado(null)}
            onLigar={ligar}
            onComoChegar={comoChegar}
          />
        ) : (
          <DicaVazia />
        )}
      </Animated.View>
    </View>
  );
}

/* --------------------------- componentes --------------------------- */

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
      return (
        <MapaIndisponivel message="Não foi possível carregar o mapa agora. Você ainda pode ver o ponto de apoio abaixo." />
      );
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
      <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#1565C0" />
      <Text style={styles.avisoTexto}>
        {podePerguntar
          ? "Ative a localização para ver sua posição no mapa."
          : "Localização desativada. Toque para ativar nas configurações."}
      </Text>
      <Text style={styles.avisoCta}>{podePerguntar ? "Permitir" : "Abrir"}</Text>
    </Pressable>
  );
}

function DicaVazia() {
  return (
    <View style={styles.dicaVazia}>
      <MaterialCommunityIcons name="map-marker" size={32} color="#1565C0" />
      <Text style={styles.dicaTitulo}>
        Toque no marcador do mapa para ver telefone, endereço e horário de atendimento.
      </Text>
    </View>
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
  const meta = CATEGORY_META[poi.category];

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
          <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <Text style={styles.nome}>{poi.name}</Text>
      <Text style={styles.descricao}>{poi.description}</Text>

      <View style={styles.infoLinha}>
        <MaterialCommunityIcons name="map-marker-outline" size={18} color="#1565C0" />
        <Text style={styles.infoTexto}>{poi.address}</Text>
      </View>

      {poi.hours && (
        <View style={styles.infoLinha}>
          <MaterialCommunityIcons name="clock-outline" size={18} color="#1565C0" />
          <Text style={styles.infoTexto}>{poi.hours}</Text>
        </View>
      )}

      <View style={styles.acoes}>
        {poi.phone && (
          <Pressable
            onPress={() => onLigar(poi.phone!)}
            style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
          >
            <MaterialCommunityIcons name="phone" size={18} color="#FFFFFF" />
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
          <MaterialCommunityIcons name="navigation-variant" size={18} color="#1565C0" />
          <Text style={[styles.botaoTexto, styles.botaoTextoSecundario]}>Como chegar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9FF" },

  topo: { position: "absolute", top: 0, left: 0, right: 0 },
  tituloBox: {
    flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start",
    marginTop: 10, marginLeft: 16,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 999, backgroundColor: "#FFFFFF",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  tituloTexto: { fontSize: 15, fontWeight: "bold", color: "#1E2A38" },

  aviso: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 16, backgroundColor: "#FFFFFF",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  avisoTexto: { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 },
  avisoCta: { fontSize: 13, fontWeight: "bold", color: "#1565C0" },

  indisponivel: {
    alignItems: "center", justifyContent: "center", gap: 12,
    paddingHorizontal: 32, backgroundColor: "#F5F9FF",
  },
  indisponivelTexto: { fontSize: 14, color: "#5F6B7A", textAlign: "center", lineHeight: 20 },

  painel: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  painelAlca: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB",
    alignSelf: "center", marginBottom: 14,
  },

  dicaVazia: { alignItems: "center", gap: 10, paddingVertical: 6 },
  dicaTitulo: { fontSize: 14, color: "#5F6B7A", textAlign: "center", lineHeight: 20 },

  detalhes: { gap: 8 },
  detalhesTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoriaLinha: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoriaBolinha: { width: 10, height: 10, borderRadius: 5 },
  categoriaLabel: { fontSize: 11, fontWeight: "bold", letterSpacing: 1 },

  nome: { fontSize: 18, fontWeight: "bold", color: "#1E2A38" },
  descricao: { fontSize: 14, color: "#374151", lineHeight: 20 },

  infoLinha: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 2 },
  infoTexto: { flex: 1, fontSize: 13, color: "#374151", lineHeight: 19 },

  acoes: { flexDirection: "row", gap: 10, marginTop: 14 },
  botao: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 13, borderRadius: 999, backgroundColor: "#1565C0",
  },
  botaoSecundario: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#1565C0" },
  botaoTexto: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },
  botaoTextoSecundario: { color: "#1565C0" },
  pressionado: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
