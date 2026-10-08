import assert from "node:assert";
import { searchMedicines } from "../lib/search";
import type { MedicineWithBatches, Batch } from "../lib/types";

function mockBatch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: "batch-1",
    medicine_id: "med-1",
    supplier_id: null,
    invoice_no: "INV-001",
    purchase_date: "2026-01-01",
    batch_no: "B123",
    mfg_date: "2025-01",
    exp_date: "2028-05",
    box: "A1",
    purchase_unit_type: "Strip",
    pack_size: 10,
    qty_packs: 10,
    stock_added: 100,
    stock_qty: 100,
    purchase_rate: 20,
    mrp: 50,
    selling_price: 35,
    gst_percent: 12,
    brand_name: "BrandX",
    manufacturer: "MakerX",
    created_at: "2026-01-01",
    ...overrides,
  };
}

function mockMed(overrides: Partial<MedicineWithBatches> = {}): MedicineWithBatches {
  return {
    id: "med-1",
    generic_name: "Medicine A",
    brand_name: "Brand A",
    manufacturer: "Maker A",
    salt: "Salt A",
    schedule: "H",
    hsn_code: "3004",
    gst_percent: 12,
    purchase_unit_type: "Strip",
    low_stock_threshold: 10,
    created_at: "2026-01-01",
    batches: [],
    total_stock: 0,
    active_batch: null,
    earliest_expiry: null,
    ...overrides,
  };
}

const mockMedsList: MedicineWithBatches[] = [
  mockMed({
    id: "m-dapa",
    generic_name: "Dapagliflozin (10mg) + Metformin (500mg)",
    total_stock: 100,
    batches: [mockBatch({ batch_no: "26L3GT A119", stock_qty: 100 })],
  }),
  mockMed({
    id: "m-glim1",
    generic_name: "Glimepiride (1mg) + Metformin (1000mg)",
    total_stock: 50,
    batches: [mockBatch({ batch_no: "LGQ03", stock_qty: 50 })],
  }),
  mockMed({
    id: "m-glim2",
    generic_name: "Glimepiride (2mg) + Metformin (500mg)",
    total_stock: 105,
    batches: [mockBatch({ batch_no: "GMTT1084", stock_qty: 105 })],
  }),
  mockMed({
    id: "m-glim-vogli",
    generic_name: "Glimepiride +Metformin +Voglibose 2mg/500mg/0.2mg",
    total_stock: 0,
    batches: [],
  }),
  mockMed({
    id: "m-met1000",
    generic_name: "Metformin (1000mg)",
    total_stock: 100,
    batches: [mockBatch({ batch_no: "260252", stock_qty: 100 })],
  }),
  mockMed({
    id: "m-met500",
    generic_name: "Metformin (500mg)",
    total_stock: 0,
    batches: [mockBatch({ batch_no: "CT2526 2106", stock_qty: 0 })],
  }),
  mockMed({
    id: "m-met250",
    generic_name: "Metformin (250mg)",
    total_stock: 40,
    batches: [mockBatch({ batch_no: "MFD-2602", stock_qty: 40 })],
  }),
  mockMed({
    id: "m-para500",
    generic_name: "Paracetamol 500mg",
    brand_name: "Calpol",
    total_stock: 100,
    batches: [mockBatch({ batch_no: "CAL100", stock_qty: 100 })],
  }),
  mockMed({
    id: "m-amox",
    generic_name: "Amoxycillin (500mg)",
    brand_name: "Moxikind",
    total_stock: 90,
    batches: [mockBatch({ batch_no: "MOX500", stock_qty: 90 })],
  }),
  mockMed({
    id: "m-panto",
    generic_name: "Pantoprazole (40mg)",
    brand_name: "Pan 40",
    total_stock: 170,
    batches: [mockBatch({ batch_no: "PAN40", stock_qty: 170 })],
  }),
];

console.log("Running searchMedicines unit tests...");

// Test 1: Plain Metformin ranks above combination medicines
for (const q of ["metfor", "Metfor", "METFOR", "metformin"]) {
  const res = searchMedicines(mockMedsList, q);
  assert(res.length >= 6, `Expected at least 6 matches for "${q}", got ${res.length}`);
  
  // First 3 should all be plain Metformins (starts with "Metformin")
  const top3Names = res.slice(0, 3).map((m) => m.generic_name);
  assert(
    top3Names.includes("Metformin (500mg)"),
    `Metformin (500mg) should be in top 3 for "${q}", but got: ${top3Names.join(", ")}`,
  );
  assert(
    top3Names.includes("Metformin (1000mg)"),
    `Metformin (1000mg) should be in top 3 for "${q}", but got: ${top3Names.join(", ")}`,
  );
  assert(
    top3Names.includes("Metformin (250mg)"),
    `Metformin (250mg) should be in top 3 for "${q}", but got: ${top3Names.join(", ")}`,
  );

  // Combination medicines like Glimepiride + Metformin should rank BELOW plain Metformin
  const met500Idx = res.findIndex((m) => m.generic_name === "Metformin (500mg)");
  const met1000Idx = res.findIndex((m) => m.generic_name === "Metformin (1000mg)");
  const glimIdx = res.findIndex((m) => m.generic_name === "Glimepiride (2mg) + Metformin (500mg)");
  assert(met500Idx < glimIdx, `Metformin (500mg) index (${met500Idx}) must be < Glimepiride index (${glimIdx})`);
  assert(met1000Idx < glimIdx, `Metformin (1000mg) index (${met1000Idx}) must be < Glimepiride index (${glimIdx})`);
}
console.log("✔ Test 1 passed: Plain Metformin ranks above combinations across casing variants");

// Test 2: Out-of-stock items (Metformin 500mg with 0 stock) are still returned
{
  const res = searchMedicines(mockMedsList, "metfor");
  const met500 = res.find((m) => m.generic_name === "Metformin (500mg)");
  assert(met500 !== undefined, "Metformin (500mg) must be included even with 0 stock");
  assert.strictEqual(met500?.total_stock, 0);
}
console.log("✔ Test 2 passed: Out-of-stock items are returned in search results");

// Test 3: Existing searches that worked before still work
{
  const paraRes = searchMedicines(mockMedsList, "para");
  assert(paraRes.some((m) => m.generic_name.includes("Paracetamol")), "Search 'para' should find Paracetamol");

  const amoxRes = searchMedicines(mockMedsList, "amox");
  assert(amoxRes.some((m) => m.generic_name.includes("Amoxycillin")), "Search 'amox' should find Amoxycillin");

  const pantRes = searchMedicines(mockMedsList, "pant");
  assert(pantRes.some((m) => m.generic_name.includes("Pantoprazole")), "Search 'pant' should find Pantoprazole");
}
console.log("✔ Test 3 passed: 'para', 'amox', and 'pant' searches work");

// Test 4: Brand name match
{
  const calpolRes = searchMedicines(mockMedsList, "calpol");
  assert.strictEqual(calpolRes[0]?.generic_name, "Paracetamol 500mg", "Search by brand name 'calpol' works");

  const moxikindRes = searchMedicines(mockMedsList, "moxikind");
  assert.strictEqual(moxikindRes[0]?.generic_name, "Amoxycillin (500mg)", "Search by brand name 'moxikind' works");
}
console.log("✔ Test 4 passed: Brand name searches rank correctly");

// Test 5: Batch number match
{
  const batchRes = searchMedicines(mockMedsList, "GMTT1084");
  assert.strictEqual(batchRes[0]?.generic_name, "Glimepiride (2mg) + Metformin (500mg)", "Search by batch number works");
}
console.log("✔ Test 5 passed: Batch number search works");

// Test 6: Empty or whitespace query returns empty array
{
  assert.deepStrictEqual(searchMedicines(mockMedsList, ""), []);
  assert.deepStrictEqual(searchMedicines(mockMedsList, "   "), []);
}
console.log("✔ Test 6 passed: Empty queries safely return empty array");

console.log("\nALL SEARCH UNIT TESTS PASSED SUCCESSFULLY!");
