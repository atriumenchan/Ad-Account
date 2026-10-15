import type { Currency } from "../types";

const USD_RATE: Record<Currency, number> = { USD: 1, EUR: 1.08, GBP: 1.27 };

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function toUsd(amount: number, currency: Currency) {
  return Math.round(amount * USD_RATE[currency] * 100) / 100;
}

export function fromUsd(amount: number, currency: Currency) {
  return Math.round((amount / USD_RATE[currency]) * 100) / 100;
}

export function money(amount: number, currency: Currency | "USD" = "USD", locale = "en") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function compact(amount: number, locale = "en") {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(amount);
}

export function formatDate(iso: string, locale = "en") {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function formatWhen(iso: string, locale = "en") {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function runwayDays(balance: number, spend7d: number) {
  const daily = spend7d / 7;
  if (daily <= 0) return balance > 0 ? 99 : 0;
  return balance / daily;
}

export function roas(revenue: number, spend: number) {
  if (spend <= 0) return 0;
  return revenue / spend;
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const PLATFORMS = ["Meta", "Google", "TikTok", "Snapchat", "Taboola", "Bing"] as const;

export const PLAN_LIMITS: Record<string, number> = { starter: 2, growth: 15, scale: 99 };

export const PLAN_PRICE: Record<string, number> = { starter: 0, growth: 499, scale: 1499 };

export const PLAN_CASHBACK: Record<string, number> = { starter: 0, growth: 0.03, scale: 0.07 };
