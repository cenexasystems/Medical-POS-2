import assert from "node:assert/strict";
import { formatWhatsAppPhone } from "../lib/format";
import {
  buildInvoiceMessage,
  buildWhatsAppLink,
  isPrivateOrLocalhost,
  getInvoiceUrl,
} from "../lib/whatsapp";

console.log("Running WhatsApp utility tests...\n");

// 1. Tests for formatWhatsAppPhone
console.log("1. Testing formatWhatsAppPhone:");
assert.equal(formatWhatsAppPhone("9876543210"), "919876543210");
console.log("  ✓ 9876543210 -> 919876543210");

assert.equal(formatWhatsAppPhone("+919876543210"), "919876543210");
console.log("  ✓ +919876543210 -> 919876543210");

assert.equal(formatWhatsAppPhone("+91 9965095776"), "919965095776");
console.log("  ✓ '+91 9965095776' -> 919965095776");

assert.equal(formatWhatsAppPhone("09876543210"), "919876543210");
console.log("  ✓ 09876543210 -> 919876543210");

assert.equal(formatWhatsAppPhone("98765 43210"), "919876543210");
console.log("  ✓ '98765 43210' -> 919876543210");

assert.equal(formatWhatsAppPhone("12345"), null);
console.log("  ✓ 12345 -> null");

assert.equal(formatWhatsAppPhone(""), null);
console.log("  ✓ '' -> null");

assert.equal(formatWhatsAppPhone(null), null);
console.log("  ✓ null -> null");

assert.equal(formatWhatsAppPhone(undefined), null);
console.log("  ✓ undefined -> null");

// Additional edge cases: dashes, brackets, etc.
assert.equal(formatWhatsAppPhone("+91-(99650)-95776"), "919965095776");
console.log("  ✓ '+91-(99650)-95776' -> 919965095776");

// 2. Tests for buildInvoiceMessage
console.log("\n2. Testing buildInvoiceMessage:");
const msg = buildInvoiceMessage(
  {
    id: "B000125",
    bill_date: "2026-10-08",
    grand_total: 510,
  },
  "https://example.com/invoice/B000125"
);
assert.ok(msg.includes("PMBJK MAKKAL MARUNDHAGAM"));
assert.ok(msg.includes("Bill No: B000125"));
assert.ok(msg.includes("Total Amount: ₹ 510.00"));
assert.ok(msg.includes("https://example.com/invoice/B000125"));
console.log("  ✓ Message format includes shop, bill no, date, total, and receipt URL");

// 3. Tests for buildWhatsAppLink
console.log("\n3. Testing buildWhatsAppLink:");
const link = buildWhatsAppLink("919965095776", "Hello World! ₹100");
assert.equal(
  link,
  "https://wa.me/919965095776?text=Hello%20World!%20%E2%82%B9100"
);
console.log("  ✓ buildWhatsAppLink correctly encodes unicode and parameters");

// 4. Tests for isPrivateOrLocalhost and getInvoiceUrl
console.log("\n4. Testing URL utilities:");
assert.equal(isPrivateOrLocalhost("http://localhost:3000/invoice/1"), true);
assert.equal(isPrivateOrLocalhost("http://127.0.0.1:3000/invoice/1"), true);
assert.equal(isPrivateOrLocalhost("http://192.168.1.50:3000/invoice/1"), true);
assert.equal(isPrivateOrLocalhost("https://l-marundhagam.vercel.app/invoice/1"), false);
console.log("  ✓ Localhost and private IPs correctly identified");

const invoiceObj = getInvoiceUrl("85");
assert.ok(invoiceObj.url.endsWith("/invoice/85"));
console.log("  ✓ getInvoiceUrl returns correct invoice URL object");

console.log("\nALL TESTS PASSED SUCCESSFULLY! ✅");
