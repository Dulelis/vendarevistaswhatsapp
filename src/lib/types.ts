export type StatusPedido =
  | "rascunho"
  | "pendente"
  | "separacao"
  | "pago"
  | "cancelado";

export type Vendedora = {
  id: string;
  nome: string;
  email?: string;
  authUserId?: string;
  whatsapp: string;
  telefone: string;
  percentualComissao: number;
  cidade: string;
  ativa: boolean;
  totalMes: number;
  pedidosPendentes: number;
  ultimaVendaEm: string;
  revistasAtivas: string[];
  observacoes?: string;
};

export type Revista = {
  id: string;
  titulo: string;
  edicao: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  ativa: boolean;
  margemPadrao: number;
  catalogoUrl?: string;
  catalogoNomeArquivo?: string;
  textoCompartilhamento?: string;
};

export type Produto = {
  id: string;
  revistaId: string;
  revistaTitulo: string;
  codigo: string;
  nome: string;
  categoria: string;
  precoCatalogo: number;
  estoqueAtual: number;
  margemComissao?: number;
  ativo?: boolean;
};

export type PedidoItem = {
  id: string;
  produtoId: string;
  produtoNome: string;
  revistaTitulo: string;
  quantidade: number;
  precoUnitario: number;
  percentualComissao: number;
};

export type Pedido = {
  id: string;
  codigo: string;
  vendedoraId: string;
  vendedoraNome: string;
  status: StatusPedido;
  criadoEm: string;
  valorTotal: number;
  comissaoCalculada: number;
  itens: PedidoItem[];
  observacoes?: string;
};

export type DashboardResumo = {
  totalVendedoras: number;
  revistasAtivas: number;
  pedidosPendentes: number;
  comissoesPrevistas: number;
  ticketMedio: number;
  faturamentoMes: number;
};

export type FluxoOperacional = {
  titulo: string;
  descricao: string;
  destaque: string;
};

export type DashboardSnapshot = {
  resumo: DashboardResumo;
  vendedoras: Vendedora[];
  revistas: Revista[];
  produtos: Produto[];
  pedidos: Pedido[];
  fluxo: FluxoOperacional[];
  proximosPassos: string[];
  whatsappDestino: string;
  supabaseReady: boolean;
};
