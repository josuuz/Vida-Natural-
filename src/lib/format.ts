const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return brl.format(value);
}

export function formatInstallments(installments: { count: number; value: number } | null) {
  if (!installments) return null;
  return `${installments.count}x de ${brl.format(installments.value)}`;
}

export function formatSize(size: string | null) {
  if (!size) return null;
  return size.replace(/ml$/, ' ml').replace(/(\d)(g|kg|l)$/, '$1 $2');
}
