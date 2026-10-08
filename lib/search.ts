import type { MedicineWithBatches } from "./types";

/**
 * Searches and ranks medicines for billing and POS search.
 *
 * Ranking criteria:
 * Tier 6: Exact match on generic name or brand name (Score 100)
 * Tier 5: Generic name starts with query (Score 80) e.g. "Metformin (500mg)" for "metfor"
 * Tier 4: Brand name starts with query (Score 70)
 * Tier 3: Word in generic name starts with query (Score 50) e.g. "Glimepiride + Metformin"
 * Tier 2: Word in brand name starts with query (Score 40)
 * Tier 1: Substring/contains match on generic name, brand, salt, batch, maker, HSN, box (Score 20)
 *
 * Within the same tier, items are sorted alphabetically by generic name.
 */
export function searchMedicines(
  medicines: MedicineWithBatches[],
  query: string,
  limit: number = 25,
): MedicineWithBatches[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: { medicine: MedicineWithBatches; score: number }[] = [];

  for (const m of medicines) {
    const generic = (m.generic_name || "").toLowerCase();
    const brandNames = [m.brand_name, ...(m.batches || []).map((b) => b.brand_name)]
      .filter((b): b is string => Boolean(b))
      .map((b) => b.toLowerCase());
    const salt = (m.salt || "").toLowerCase();
    const hsn = (m.hsn_code || "").toLowerCase();
    const batchNos = (m.batches || []).map((b) => (b.batch_no || "").toLowerCase());
    const manufacturers = [m.manufacturer, ...(m.batches || []).map((b) => b.manufacturer)]
      .filter((maker): maker is string => Boolean(maker))
      .map((maker) => maker.toLowerCase());
    const boxes = (m.batches || []).map((b) => (b.box || "").toLowerCase());

    let score = 0;
    if (generic === q || brandNames.some((b) => b === q)) {
      score = 100;
    } else if (generic.startsWith(q)) {
      score = 80;
    } else if (brandNames.some((b) => b.startsWith(q))) {
      score = 70;
    } else if (generic.split(/[\s+(),/-]+/).some((w) => w.startsWith(q))) {
      score = 50;
    } else if (brandNames.some((b) => b.split(/[\s+(),/-]+/).some((w) => w.startsWith(q)))) {
      score = 40;
    } else if (
      generic.includes(q) ||
      brandNames.some((b) => b.includes(q)) ||
      salt.includes(q) ||
      hsn.includes(q) ||
      batchNos.some((b) => b.includes(q)) ||
      manufacturers.some((mk) => mk.includes(q)) ||
      boxes.some((bx) => bx.includes(q))
    ) {
      score = 20;
    }

    if (score > 0) {
      scored.push({ medicine: m, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.medicine.generic_name.localeCompare(b.medicine.generic_name);
  });

  return scored.slice(0, limit).map((s) => s.medicine);
}
