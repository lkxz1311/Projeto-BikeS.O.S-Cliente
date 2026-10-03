export interface RastreamentoResult {
  ok: boolean;
  data?: {
    status: string;
    tecnico: {
      nome: string;
      telefone: string;
    };
    coordenadas: {
      latitude: number;
      longitude: number;
    } | null;
  };
  erro?: string;
}

export async function buscarRastreamentoService(pedidoId: string): Promise<RastreamentoResult> {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/pedidos/${pedidoId}/rastreamento`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, erro: data.mensagem ?? 'Erro ao buscar rastreamento' };
    }

    return { ok: true, data };
  } catch (error: any) {
    console.log('⚠️ Erro de conexão:', error.message);
    return { ok: false, erro: 'Falha na conexão com o servidor' };
  }
}
