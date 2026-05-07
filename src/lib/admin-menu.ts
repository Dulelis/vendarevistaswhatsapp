export type AdminNavigationItem = {
  href: string;
  label: string;
};

export type AdminModule = {
  href: string;
  label: string;
  title: string;
  tone: string;
  accent: string;
};

export const adminNavigation: AdminNavigationItem[] = [
  { href: "/", label: "Painel" },
  { href: "/vendedoras", label: "Vendedoras" },
  { href: "/catalogo", label: "Catalogo" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/relatorios", label: "Relatorios" },
  { href: "/vendedora", label: "Preview" },
];

export const adminModules: AdminModule[] = [
  {
    href: "/vendedoras",
    label: "Cadastro",
    title: "Vendedoras",
    tone: "bg-[#fff7ed]",
    accent: "text-[#9a3412]",
  },
  {
    href: "/catalogo",
    label: "Catalogo",
    title: "Revistas e produtos",
    tone: "bg-[#eef8f4]",
    accent: "text-[#166534]",
  },
  {
    href: "/pedidos",
    label: "Vendas",
    title: "Pedidos",
    tone: "bg-[#f5efe7]",
    accent: "text-[#115e59]",
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    title: "Comissoes",
    tone: "bg-[#fff3ea]",
    accent: "text-[#c2410c]",
  },
  {
    href: "/relatorios",
    label: "Analise",
    title: "Relatorios",
    tone: "bg-[#eef1fb]",
    accent: "text-[#3730a3]",
  },
  {
    href: "/vendedora",
    label: "Preview",
    title: "Area da vendedora",
    tone: "bg-[#f0f8f7]",
    accent: "text-[#0f766e]",
  },
];
