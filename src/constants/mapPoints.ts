export type PoiCategory =
    | "prefeitura"
    | "oficina"
    | "ponto_apoio"
    | "outro";

export const CATEGORY_META: Record<PoiCategory, {label: string; color: string}> = {
    prefeitura: {label: "Prefeitura", color: "#1565C0"},
    oficina: {label: "Oficina / Bike Shop", color: "#2E7D32"},
    ponto_apoio: {label: "Ponto de apoio", color: "#F59E0B"},
    outro: {label: "Outro", color: "#6B7280"},
};

export type PointOfInterest = {
    id: string;
    name: string;
    category: PoiCategory;
    description: string;
    latitude: number;
    longitude: number;
    address: string;
    phone?: string;
    hours?: string;
};

/** Coordenadas centrais aproximadas de Jardim/MS. */
export const JARDIM_REGION = {
    latitude: -21.4804,
    longitude: -56.1397,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
};

export const POINTS_OF_INTEREST: PointOfInterest[] = [
    {
        id: "prefeitura-jardim",
        name: "Prefeitura Municipal de Jardim/MS",
        category: "prefeitura",
        description:
            "Paço Municipal de Jardim — ponto de referência e apoio para os atendimentos do BikeS.O.S. na cidade.",
        latitude: -21.480391,
        longitude: -56.139722,
        address: "Rua Coronel Juvêncio, 547 — Centro, Jardim/MS, 79240-000",
        phone: "(67) 3209-2500",
        hours: "Seg-Sex 7h-13h",
    },
];
