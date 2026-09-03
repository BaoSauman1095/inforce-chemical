"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProductBySlug } from "@/lib/products";
import { packTotalPrice } from "@/lib/utils";
import type { FlatCatalogItem, PackOption } from "@/lib/types";

const STORAGE_KEY = "ifc-cart-v1";

/** Що зберігається в браузері — лише посилання на позицію, без цін і назв. */
interface StoredLine {
  slug: string;
  packLabel: string;
  quantity: number;
}

/** Позиція кошика, зібрана з каталогу під час читання. */
export interface CartLine extends StoredLine {
  product: FlatCatalogItem;
  pack: PackOption;
  /** Сума за одну упаковку, або null для позицій «ціна за запитом». */
  unitPrice: number | null;
  /** unitPrice × quantity, або null. */
  total: number | null;
}

interface CartContextValue {
  lines: CartLine[];
  /** Загальна кількість упаковок — для лічильника на іконці. */
  count: number;
  /** Сума позицій з відомою ціною. */
  total: number;
  /** Чи є в кошику позиції «за запитом», не враховані в total. */
  hasUnpriced: boolean;
  /** Кошик прочитано з localStorage — до цього лічильник не рендеримо. */
  ready: boolean;
  add: (slug: string, packLabel: string, quantity?: number) => void;
  setQuantity: (slug: string, packLabel: string, quantity: number) => void;
  remove: (slug: string, packLabel: string) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const MAX_QUANTITY = 10000;

function sameLine(a: StoredLine, slug: string, packLabel: string) {
  return a.slug === slug && a.packLabel === packLabel;
}

function readStored(): StoredLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry): StoredLine[] => {
      if (typeof entry !== "object" || entry === null) return [];
      const { slug, packLabel, quantity } = entry as Record<string, unknown>;
      if (typeof slug !== "string" || typeof packLabel !== "string") return [];
      const qty = Number(quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY) return [];
      return [{ slug, packLabel, quantity: qty }];
    });
  } catch {
    // Приватний режим, вимкнені cookies, зіпсований JSON — просто порожній кошик.
    return [];
  }
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState<StoredLine[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setStored(readStored());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Кошик просто не переживе перезавантаження — не привід ламати сторінку.
    }
  }, [stored, ready]);

  const add = useCallback((slug: string, packLabel: string, quantity = 1) => {
    setStored((lines) => {
      const existing = lines.find((l) => sameLine(l, slug, packLabel));
      if (!existing) {
        return [...lines, { slug, packLabel, quantity: Math.min(quantity, MAX_QUANTITY) }];
      }
      return lines.map((l) =>
        sameLine(l, slug, packLabel)
          ? { ...l, quantity: Math.min(l.quantity + quantity, MAX_QUANTITY) }
          : l
      );
    });
  }, []);

  const setQuantity = useCallback((slug: string, packLabel: string, quantity: number) => {
    setStored((lines) =>
      quantity < 1
        ? lines.filter((l) => !sameLine(l, slug, packLabel))
        : lines.map((l) =>
            sameLine(l, slug, packLabel)
              ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY) }
              : l
          )
    );
  }, []);

  const remove = useCallback((slug: string, packLabel: string) => {
    setStored((lines) => lines.filter((l) => !sameLine(l, slug, packLabel)));
  }, []);

  const clear = useCallback(() => setStored([]), []);

  /**
   * Назви, упаковки й ціни щоразу беремо з каталогу за slug, а не зі
   * сховища — тоді оновлення прайсу одразу видно в кошику, а позиції, яких
   * уже немає в каталозі, тихо зникають замість того, щоб потрапити в замовлення.
   */
  const lines = useMemo<CartLine[]>(
    () =>
      stored.flatMap((line) => {
        const product = getProductBySlug(line.slug);
        if (!product) return [];
        const pack = product.packs.find((p) => p.label === line.packLabel);
        if (!pack) return [];

        const unitPrice = packTotalPrice(pack, product.unit);
        return [
          {
            ...line,
            product,
            pack,
            unitPrice,
            total: unitPrice === null ? null : unitPrice * line.quantity,
          },
        ];
      }),
    [stored]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      total: lines.reduce((sum, l) => sum + (l.total ?? 0), 0),
      hasUnpriced: lines.some((l) => l.total === null),
      ready,
      add,
      setQuantity,
      remove,
      clear,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [lines, ready, add, setQuantity, remove, clear, isOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart має викликатись усередині <CartProvider>");
  return ctx;
}
