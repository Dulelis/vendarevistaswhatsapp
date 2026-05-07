import { formatPercent, onlyDigits } from "./formatters";
import type { Revista } from "./types";

export function buildCatalogShareText(revista: Revista) {
  const lines = [
    `Catalogo ${revista.titulo} ${revista.edicao}`,
    revista.textoCompartilhamento ||
      `Confira o catalogo digital ${revista.titulo} ${revista.edicao}.`,
    "",
    `Margem padrao: ${formatPercent(revista.margemPadrao)}`,
  ];

  if (revista.catalogoUrl) {
    lines.push(`Acesso: ${revista.catalogoUrl}`);
  }

  return lines.join("\n");
}

export function buildCatalogWhatsAppShareLink(
  revista: Revista,
  destination?: string,
) {
  const target = destination ? onlyDigits(destination) : "";
  const message = encodeURIComponent(buildCatalogShareText(revista));

  return target
    ? `https://wa.me/${target}?text=${message}`
    : `https://wa.me/?text=${message}`;
}
