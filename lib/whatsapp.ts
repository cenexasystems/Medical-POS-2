import React from "react";
import { dateLong } from "./format";

/**
 * Checks if a URL hostname points to localhost or private/local IP range.
 */
export function isPrivateOrLocalhost(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "0.0.0.0" ||
      h === "::1" ||
      h.endsWith(".local") ||
      /^10\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)
    );
  } catch {
    return false;
  }
}

/**
 * Returns the absolute invoice URL, prioritizing NEXT_PUBLIC_APP_URL and falling back to window.location.origin.
 * Also flags if the URL is on localhost or a private network.
 */
export function getInvoiceUrl(billId: string): { url: string; isLocal: boolean } {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  let base = "";
  if (envUrl) {
    base = envUrl.replace(/\/+$/, "");
  } else if (typeof window !== "undefined" && window.location.origin) {
    base = window.location.origin;
  }

  const url = base ? `${base}/invoice/${billId}` : `/invoice/${billId}`;
  return {
    url,
    isLocal: isPrivateOrLocalhost(url),
  };
}

/**
 * Builds the WhatsApp message text in the style of commit e23e79b.
 */
export function buildInvoiceMessage(
  bill: {
    id: string;
    bill_date?: string;
    grand_total: number | string;
    customer_name?: string;
  },
  invoiceUrl: string
): string {
  const shopEmoji = "\u2728"; // ✨
  const checkEmoji = "\u2705"; // ✅
  const moneyEmoji = "\u{1F4B0}"; // 💰
  const receiptEmoji = "\u{1F4E6}"; // 📦

  const total = Number(bill.grand_total || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedDate = bill.bill_date ? dateLong(bill.bill_date) : "";

  let message = `${shopEmoji} *PMBJK MAKKAL MARUNDHAGAM* ${shopEmoji}\n\n`;
  message += `${checkEmoji} Here are your invoice details!\n\n`;
  message += `Bill No: ${bill.id}\n`;
  if (formattedDate) {
    message += `Date: ${formattedDate}\n`;
  }
  message += `\n${moneyEmoji} *Total Amount: ₹ ${total}*\n\n`;
  message += `${receiptEmoji} View and download your detailed digital receipt here:\n${invoiceUrl}`;

  return message;
}

/**
 * Constructs the standard wa.me redirect link with encoded message.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Opens WhatsApp link synchronously without popup blocker issues on mobile.
 */
export function openWhatsAppLink(url: string): void {
  if (typeof window === "undefined") return;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = url;
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * WhatsApp brand SVG icon.
 */
export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: "1em",
      height: "1em",
      fill: "currentColor",
      className,
      "aria-hidden": "true",
    },
    React.createElement("path", {
      d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.012c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z",
    })
  );
}
