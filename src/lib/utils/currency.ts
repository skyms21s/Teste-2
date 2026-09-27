const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 24.9 -> "R$ 24,90" */
export function formatPrice(value: number): string {
  return BRL.format(value);
}

/** Valor do input para numero: aceita "24,90", "24.90" e "R$ 24,90". */
export function parsePrice(value: string): number | null {
  const cleaned = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}\b)/g, '')
    .replace(',', '.');

  if (cleaned === '') return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

/** 24.9 -> "24,90" (para preencher o input de edicao). */
export function priceToInput(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
