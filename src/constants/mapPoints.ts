export type PoiCategory =
  | "oficina"
  | "ponto_apoio"
  | "mecanica"
  | "outro";

export const CATEGORY_META: Record<PoiCategory, { label: string; color: string }> = {
  oficina: { label: "Oficina / Bike Shop", color: "#16A34A" },
  ponto_apoio: { label: "Ponto de apoio", color: "#F59E0B" },
  mecanica: { label: "Mecânica & Auto", color: "#1565C0" },
  outro: { label: "Outro Técnico", color: "#6B7280" },
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

/** Coordenadas centrais de Jardim/MS */
export const JARDIM_REGION = {
  latitude: -21.4804,
  longitude: -56.1397,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export const POINTS_OF_INTEREST: PointOfInterest[] = [

  {
    id: "ciclo-estrelas",
    name: "Ciclo Estrelas",
    category: "oficina",
    description: "Manutenção completa, consertos gerais, peças e serviços para bicicletas.", //no perfil do tecnico ele add e vem para ca auto
    latitude: -21.4827366,
    longitude: -56.1461539,
    address: "R. Ten. Bernardes 1020, Jardim/MS",
    phone: "(67) 99665-9345",//tb
    hours: "Seg-Sex em horário comercial",//tbm
  },

  {
    id: "pedaleiras-bike",
    name: "Pedaleiras Bike",
    category: "oficina",
    description: "Manutenção completa, consertos gerais, peças e serviços para bicicletas.", //no perfil do tecnico ele add e vem para ca auto
    latitude: -21.4903517,
    longitude: -56.1428537,
    address: "R. Saul Moraes de Deus 755, Jardim/MS",
    phone: "(67) 98198-7733",//tb
    hours: "Seg-Sex em horário comercial",//tbm,exemplo: 8h-18h
    },

    {
    id: "jota-bike",
    name: "Jota Bike",
    category: "oficina",
    description: "Manutenção completa, consertos gerais, peças e serviços para bicicletas.", //no perfil do tecnico ele add e vem para ca auto
    latitude: -21.4850365,
    longitude: -56.1501520,
    address: "Av. Duque de Caxias 1474, Jardim/MS",
    phone: "067999969966",//tb
    hours: "Seg-Sex em horário comercial",//tbm,exemplo: 8h-18h
    },

    {
    id: "bicicletaria-do-nego",
    name: "Bicicletaria do Nego Ltda",
    category: "oficina",
    description: "Manutenção completa, consertos gerais, peças e serviços para bicicletas.",
    latitude: -21.4858784,
    longitude: -56.1537670,
    address: "R. Bela Vista 59, Jardim/MS",   
    phone: "(67) 99180-6412",
    hours: "Seg-Sex em horário comercial",
  }//add + dps
];