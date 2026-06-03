export type PedidoStatus =
  | "Aguardando técnico"
  | "Técnico aceitou"
  | "Técnico a caminho"
  | "Em atendimento"
  | "Finalizado"
  | "Rejeitado";

export type Pedido = {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  problema: string;
  bike: string;
  localizacao: string;
  pagamento: string;
  status: PedidoStatus;
  tecnicoNome?: string;
};

export const pedidos: Pedido[] = [];

export function gerarCodigoPedido() {
  return `BS${Math.floor(1000 + Math.random() * 9000)}`;
}

export function criarPedido(dados: Omit<Pedido, "id" | "status">) {
  const novoPedido: Pedido = {
    id: gerarCodigoPedido(),
    status: "Aguardando técnico",
    ...dados,
  };

  pedidos.unshift(novoPedido);

  return novoPedido;
}

export function aceitarPedido(id: string) {
  const pedido = pedidos.find((item) => item.id === id);

  if (pedido) {
    pedido.status = "Técnico aceitou";
    pedido.tecnicoNome = "Oficina Verde Bike";
  }
}

export function rejeitarPedido(id: string) {
  const pedido = pedidos.find((item) => item.id === id);

  if (pedido) {
    pedido.status = "Rejeitado";
  }
}

export function atualizarStatusPedido(id: string) {
  const pedido = pedidos.find((item) => item.id === id);

  if (!pedido) return;

  if (pedido.status === "Técnico aceitou") {
    pedido.status = "Técnico a caminho";
  } else if (pedido.status === "Técnico a caminho") {
    pedido.status = "Em atendimento";
  } else if (pedido.status === "Em atendimento") {
    pedido.status = "Finalizado";
  }
}