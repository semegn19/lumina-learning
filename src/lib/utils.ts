import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrencySymbol(currency?: string): string {
  if (!currency) return "GH₵";
  const upper = currency.toUpperCase().trim();
  switch (upper) {
    case "GHS":
    case "GH₵":
    case "CEDIS":
    case "CEDI":
    case "GH":
    case "₵":
      return "GH₵";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "NGN":
      return "₦";
    case "KES":
      return "KSh ";
    case "ZAR":
      return "R ";
    case "CAD":
      return "CA$";
    case "AUD":
      return "AU$";
    case "JPY":
    case "CNY":
      return "¥";
    case "INR":
      return "₹";
    default:
      return `${currency} `;
  }
}

export function formatPrice(price?: number | string | null, currency?: string): string {
  if (price === undefined || price === null || price === "") return "Free";
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numericPrice) || numericPrice <= 0) return "Free";
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${numericPrice.toFixed(2)}`;
}

export function formatCurrency(amount?: number | string | null, currency?: string): string {
  if (amount === undefined || amount === null || amount === "") {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}0.00`;
  }
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numeric)) {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}0.00`;
  }
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${numeric.toFixed(2)}`;
}

export function formatJobSalary(salary?: number | string | null): string | null {
  if (salary === undefined || salary === null || salary === "") return null;
  const str = String(salary).trim();
  if (!str) return null;

  // Check if it is a pure number or float string like "95000" or "95000.00"
  const num = parseFloat(str);
  if (!isNaN(num) && /^[0-9]+(\.[0-9]+)?$/.test(str)) {
    const intVal = Math.round(num);
    return `$${intVal.toLocaleString("en-US")}`;
  }

  // If it's a range or string like "95000.00 - 120000.00" or "$110k"
  // Remove all decimal zeroes (.00)
  let cleaned = str.replace(/\.00(?![0-9])/g, "").replace(/\.0(?![0-9])/g, "");
  if (!cleaned.startsWith("$")) {
    cleaned = `$${cleaned}`;
  }
  return cleaned;
}

const BACKEND_BASE_URL = (
  typeof import.meta.env.VITE_API_URL === "string" && import.meta.env.VITE_API_URL.trim() !== ""
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
      ? "http://127.0.0.1:8000"
      : ""
).replace(/\/+$/, "");

/**
 * Format full URL for backend media files (images, videos, PDFs, avatars, etc.)
 */
export function getMediaUrl(filePath?: string | null): string {
  if (!filePath) return "";
  const trimmed = String(filePath).trim();
  if (!trimmed) return "";
  // If already a full URL (e.g. S3, Cloudinary, blob:, or data:)
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  // If relative path from Django backend (e.g. /media/..., media/...)
  const pathWithSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${BACKEND_BASE_URL}${pathWithSlash}`;
}
