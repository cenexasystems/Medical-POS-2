"use client";

import { useEffect, useState } from "react";
import { Printer, Copy, Check } from "lucide-react";
import { formatWhatsAppPhone } from "@/lib/format";
import {
  buildInvoiceMessage,
  buildWhatsAppLink,
  getInvoiceUrl,
  openWhatsAppLink,
  WhatsAppIcon,
} from "@/lib/whatsapp";

export function InvoiceActions({
  bill,
}: {
  bill?: {
    id: string;
    customer_name?: string;
    customer_phone?: string;
    bill_date?: string;
    created_at?: string;
    grand_total: number | string;
  };
}) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      if (search.get("print") === "1") {
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleWhatsApp = () => {
    const billId = bill?.id || (typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean).pop() || "" : "");
    if (!billId) return;

    let phone = formatWhatsAppPhone(bill?.customer_phone);
    if (!phone) {
      const entered = typeof window !== "undefined"
        ? window.prompt("Customer mobile number is missing or invalid. Enter mobile number to send via WhatsApp:", "")
        : null;
      if (!entered) return;
      phone = formatWhatsAppPhone(entered);
      if (!phone) {
        setToast("Customer mobile number missing/invalid");
        return;
      }
    }

    const { url, isLocal } = getInvoiceUrl(billId);
    if (isLocal) {
      setToast("Warning: Invoice URL is on localhost/private network and may not open on customer device.");
    }

    const msg = buildInvoiceMessage(
      {
        id: billId,
        bill_date: bill?.bill_date,
        grand_total: bill?.grand_total || 0,
      },
      url
    );
    const link = buildWhatsAppLink(phone, msg);
    openWhatsAppLink(link);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3">
        <button 
          onClick={handleCopyLink}
          className="flex items-center gap-2 bg-white hover:bg-[#FAFAFA] text-[#02222d] hover:text-[#0a6127] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm border border-[#0a6127]/30 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Copy Link
            </>
          )}
        </button>
        <button
          onClick={handleWhatsApp}
          aria-label="Send bill via WhatsApp"
          title="Send bill via WhatsApp"
          className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <WhatsAppIcon className="w-4 h-4" /> WhatsApp
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-gradient-to-r from-[#0a6127] via-[#0a6127] to-[#0a6127] hover:brightness-105 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-lg shadow-md transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Download PDF / Print
        </button>
      </div>

      {toast && (
        <span className="rounded-lg bg-gray-900/95 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md animate-in fade-in duration-200">
          {toast}
        </span>
      )}
    </div>
  );
}
