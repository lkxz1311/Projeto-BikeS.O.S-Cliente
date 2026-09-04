import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Camada fina sobre app.json — so injeta as chaves do Google Maps a partir do .env.
 * Continue editando app.json normalmente; este arquivo so reescreve
 * android.config.googleMaps e ios.config.googleMapsApiKey no momento do build.
 */
const pick = (...names: string[]): string => {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
};

export default ({ config }: ConfigContext): ExpoConfig => {
  // Aceita os nomes usados no .env deste projeto e os nomes alternativos,
  // pra nao depender de qual deles foi configurado nas env vars da Expo.
  // Sem env var, cai no valor que ja esta no app.json.
  const androidKey =
    pick("EXPO_PUBLIC_GOOGLE_MAPS_KEY", "EXPO_PUBLIC_KEY_GOOGLE_ANDROID_MAP") ||
    config.android?.config?.googleMaps?.apiKey ||
    "";

  const iosKey =
    pick("EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY", "EXPO_PUBLIC_KEY_GOOGLE_IOS_MAP") ||
    config.ios?.config?.googleMapsApiKey ||
    "";

  // Sem a chave do Android o app crasha em runtime (IllegalStateException:
  // "API key not found"). Avisar aqui surfaceia o problema no log do build,
  // em vez de so no celular.
  if (!androidKey) {
    console.warn(
      "[app.config] EXPO_PUBLIC_GOOGLE_MAPS_KEY vazia no build — " +
        "o mapa do Android vai crashar. Configure a env var no expo.dev " +
        "(visibility Plaintext/Sensitive, nao Secret) ou no .env.",
    );
  }

  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: { apiKey: androidKey },
      },
    },
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        ...(iosKey ? { googleMapsApiKey: iosKey } : {}),
      },
    },
  };
};
