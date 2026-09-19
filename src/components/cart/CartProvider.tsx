'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { CartSummary, CouponError } from '@/lib/types';
import {
  addLine,
  addLines,
  clearLines,
  getServerSnapshot,
  getSnapshot,
  removeLine,
  setCoupon,
  setDestination,
  setLineQuantity,
  setShippingOption,
  subscribe,
  type CartIntent,
  type CartLineInput,
} from './cartStore';

type CartContextValue = {
  intent: CartIntent;
  summary: CartSummary | null;
  /** Contagem otimista, atualizada antes da resposta do servidor. */
  count: number;
  status: 'idle' | 'syncing' | 'error';
  couponError: CouponError | null;
  isOpen: boolean;
  lastAdded: string | null;
  add: (slug: string, quantity?: number) => void;
  addMany: (items: CartLineInput[]) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  applyCoupon: (code: string | null) => void;
  setAddress: (zip: string | null, state: string | null) => void;
  chooseShipping: (id: string | null) => void;
  open: () => void;
  close: () => void;
  refresh: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const intent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [couponError, setCouponError] = useState<CouponError | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [nonce, setNonce] = useState(0);

  const isEmpty = intent.lines.length === 0;

  // sempre que a intenção muda, o servidor recalcula o carrinho
  useEffect(() => {
    if (isEmpty) return;

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus('syncing');

      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(intent),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as CartSummary & { couponError?: CouponError };
        setSummary(data);
        setCouponError(data.couponError ?? null);
        setStatus('idle');
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setStatus('error');
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [intent, nonce, isEmpty]);

  // trava o scroll do body enquanto o drawer está aberto
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const add = useCallback((slug: string, quantity = 1) => {
    addLine(slug, quantity);
    setLastAdded(slug);
    setIsOpen(true);
  }, []);

  const addMany = useCallback((items: CartLineInput[]) => {
    addLines(items);
    setLastAdded(items[0]?.slug ?? null);
    setIsOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      intent,
      // com o carrinho vazio não há resumo a exibir — derivado, não em efeito
      summary: isEmpty ? null : summary,
      count: intent.lines.reduce((sum, line) => sum + line.quantity, 0),
      status: isEmpty ? 'idle' : status,
      couponError: isEmpty ? null : couponError,
      isOpen,
      lastAdded,
      add,
      addMany,
      setQuantity: setLineQuantity,
      remove: removeLine,
      clear: clearLines,
      applyCoupon: setCoupon,
      setAddress: setDestination,
      chooseShipping: setShippingOption,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      refresh: () => setNonce((value) => value + 1),
    }),
    [intent, isEmpty, summary, status, couponError, isOpen, lastAdded, add, addMany]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart precisa estar dentro de <CartProvider>');
  return context;
}
