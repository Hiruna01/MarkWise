import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function fmt(value: number | null | undefined, digits = 1) {
  return value == null
    ? "—"
    : new Intl.NumberFormat("en", { maximumFractionDigits: digits }).format(
        value,
      );
}
