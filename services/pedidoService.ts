interface Pedido {
  id: string;
  codigo: string;
  tipo: string;
  telefone: string;
  problema: string;
  bike: string;
  localizacao: string;
  pagamento: string;
  status: string;
  userId: string;
  tecnicoSolicitadoId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PedidoResult {
  ok: boolean;
  data?: Pedido;
  erro?: string;
}

interface PedidosResult {
  ok: boolean;
  data?: Pedido[];
  erro?: string;
}

interface CriarPedidoDTO {
  tipo: string;
  userId: string;
  telefone: string;
  problema: string;
  bike: string;
  localizacao: string;
  pagamento: string;
  tecnicoSolicitadoId?: string | null;
}

export async function criarPedidoService(dados: CriarPedidoDTO): Promise<PedidoResult> {
  try {
    console.log("📤 Criando pedido:", dados);

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const data = await response.json();

    console.log("✅ Status:", response.status);
    console.log("📦 Resposta:", data);

    if (!response.ok) {
      return { ok: false, erro: data.mensagem ?? "Erro ao criar pedido" };
    }

    return { ok: true, data };
  } catch (error: any) {
    console.log("⚠️ Erro de conexão:", error.message);
    return { ok: false, erro: "Falha na conexão com o servidor" };
  }
}

export async function listarPedidosService(userId: string): Promise<PedidosResult> {
  try {
    console.log("📤 Buscando pedidos:", userId);

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/pedidos/usuario/${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    console.log("✅ Status:", response.status);
    console.log("📦 Pedidos:", data);

    if (!response.ok) {
      return { ok: false, erro: data.mensagem ?? "Erro ao buscar pedidos" };
    }

    return { ok: true, data };
  } catch (error: any) {
    console.log("⚠️ Erro de conexão:", error.message);
    return { ok: false, erro: "Falha na conexão com o servidor" };
  }
}