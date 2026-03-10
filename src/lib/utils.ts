import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export const toTitleCase = (str: string) => {
  if (!str) return "";

  return String(str).replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
};

export const expandEnumString = (str: string) =>
  String(str)
    .split("_")
    .map((part) => toTitleCase(part))
    .join(" ");

export function formatDate(date: string | Date): string {
  const parsed =
    typeof date === "string" || date instanceof Date ? new Date(date) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function formatDateTime(date: string | Date): string {
  const parsed =
    typeof date === "string" || date instanceof Date ? new Date(date) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    review:
      "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30",
    processing:
      "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
    repaid:
      "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30",
    disbursed:
      "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
    approved:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
    late: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30",
    overdue: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30",
    defaulted: "text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/30",
    rejected: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30",
    archived:
      "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30",
    cancelled:
      "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30",
  };
  return colors[status.toLowerCase()] || colors.review;
}
