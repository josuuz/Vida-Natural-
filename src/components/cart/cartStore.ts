/**
 * Store externo do carrinho.
 *
 * Guarda apenas a INTENÇÃO do cliente (slug, quantidade, cupom, CEP). Nenhum
 * preço vive aqui: quem calcula é `/api/cart`, a partir do banco.
 *
 * Fica fora do React para que a leitura do localStorage aconteça na primeira
 * assinatura — evita mismatch de hidratação e render em cascata.
 */
export type CartLineInput = { slug: string; quantity: number };

export type CartIntent = {
  lines: CartLineInput[];
  couponCode: string | null;
  zip: string | null;
  state: string | null;
  shippingOptionId: string | null;
};

const STORAGE_KEY = 'vidanatural:carrinho:v2';
const EMPTY: CartIntent = { lines: [], couponCode: null, zip: null, state: null, shippingOptionId: null };

let intent: CartIntent = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch {
    // cota cheia ou navegação privada — o carrinho segue apenas em memória
  }
}

function hydrate() {
  hydrated = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored) as Partial<CartIntent>;
    const lines = Array.isArray(parsed.lines)
      ? parsed.lines.filter(
          (line): line is CartLineInput =>
            typeof line?.slug === 'string' && Number.isFinite(line?.quantity) && line.quantity > 0
        )
      : [];
    intent = {
      lines,
      couponCode: typeof parsed.couponCode === 'string' ? parsed.couponCode : null,
      zip: typeof parsed.zip === 'string' ? parsed.zip : null,
      state: typeof parsed.state === 'string' ? parsed.state : null,
      shippingOptionId: typeof parsed.shippingOptionId === 'string' ? parsed.shippingOptionId : null,
    };
  } catch {
    intent = EMPTY;
  }
}

export function subscribe(listener: () => void) {
  if (!hydrated) {
    hydrate();
    if (intent !== EMPTY) queueMicrotask(emit);
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return intent;
}

export function getServerSnapshot() {
  return EMPTY;
}

function update(next: Partial<CartIntent>) {
  intent = { ...intent, ...next };
  persist();
  emit();
}

export function addLine(slug: string, quantity = 1) {
  const existing = intent.lines.find((line) => line.slug === slug);
  update({
    lines: existing
      ? intent.lines.map((line) =>
          line.slug === slug ? { ...line, quantity: Math.min(99, line.quantity + quantity) } : line
        )
      : [...intent.lines, { slug, quantity: Math.min(99, Math.max(1, quantity)) }],
  });
}

export function addLines(items: CartLineInput[]) {
  let lines = intent.lines;
  for (const item of items) {
    const existing = lines.find((line) => line.slug === item.slug);
    lines = existing
      ? lines.map((line) =>
          line.slug === item.slug ? { ...line, quantity: Math.min(99, line.quantity + item.quantity) } : line
        )
      : [...lines, { slug: item.slug, quantity: Math.min(99, Math.max(1, item.quantity)) }];
  }
  update({ lines });
}

export function setLineQuantity(slug: string, quantity: number) {
  update({
    lines:
      quantity <= 0
        ? intent.lines.filter((line) => line.slug !== slug)
        : intent.lines.map((line) =>
            line.slug === slug ? { ...line, quantity: Math.min(99, quantity) } : line
          ),
  });
}

export function removeLine(slug: string) {
  update({ lines: intent.lines.filter((line) => line.slug !== slug) });
}

export function clearLines() {
  update({ lines: [], couponCode: null, shippingOptionId: null });
}

export function setCoupon(code: string | null) {
  update({ couponCode: code ? code.trim().toUpperCase() : null });
}

export function setDestination(zip: string | null, state: string | null) {
  update({ zip, state, shippingOptionId: null });
}

export function setShippingOption(id: string | null) {
  update({ shippingOptionId: id });
}
