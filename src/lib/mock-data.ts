// ============================================================
// MOCK DATA — Solar Cell ERP Demo (UI Only, No Backend)
// ============================================================

export const mockUser = {
  id: "u001",
  name: "ผู้บริหาร ระบบ",
  role: "admin" as const,
  email: "admin@solarsell.co.th",
  avatar: "ผ",
};

// ---------- STOCK ----------

export const mockProducts = [
  { id: "P001", sku: "SC-MON-400W", name: "แผงโซลาร์ Mono 400W", category: "แผงโซลล่าเซลล์", avgCost: 4200, price1: 5500, price2: 5200, price3: 4800, price4: 4500, stock: 142, reorderPoint: 50, reorderQty: 100, supplier: "S001", status: "active" },
  { id: "P002", sku: "SC-MON-550W", name: "แผงโซลาร์ Mono 550W", category: "แผงโซลล่าเซลล์", avgCost: 5800, price1: 7500, price2: 7100, price3: 6600, price4: 6200, stock: 28, reorderPoint: 40, reorderQty: 80, supplier: "S001", status: "active" },
  { id: "P003", sku: "INV-5KW-HYB", name: "อินเวอร์เตอร์ Hybrid 5kW", category: "อินเวอร์เตอร์", avgCost: 28000, price1: 36000, price2: 34000, price3: 31500, price4: 30000, stock: 15, reorderPoint: 10, reorderQty: 20, supplier: "S002", status: "active" },
  { id: "P004", sku: "INV-10KW-HYB", name: "อินเวอร์เตอร์ Hybrid 10kW", category: "อินเวอร์เตอร์", avgCost: 52000, price1: 68000, price2: 64000, price3: 60000, price4: 57000, stock: 8, reorderPoint: 5, reorderQty: 10, supplier: "S002", status: "active" },
  { id: "P005", sku: "BAT-LI-100AH", name: "แบตเตอรี่ Lithium 100Ah", category: "แบตเตอรี่", avgCost: 18000, price1: 23000, price2: 21500, price3: 20000, price4: 19000, stock: 35, reorderPoint: 20, reorderQty: 40, supplier: "S003", status: "active" },
  { id: "P006", sku: "BAT-LI-200AH", name: "แบตเตอรี่ Lithium 200Ah", category: "แบตเตอรี่", avgCost: 35000, price1: 45000, price2: 42000, price3: 39000, price4: 37000, stock: 12, reorderPoint: 10, reorderQty: 20, supplier: "S003", status: "active" },
  { id: "P007", sku: "STR-ALUM-40", name: "โครงอะลูมิเนียม 40mm", category: "โครงสร้าง", avgCost: 180, price1: 250, price2: 230, price3: 210, price4: 200, stock: 850, reorderPoint: 200, reorderQty: 500, supplier: "S004", status: "active" },
  { id: "P008", sku: "CAB-4MM-RED", name: "สายไฟ 4mm² แดง (m)", category: "สายไฟ", avgCost: 22, price1: 32, price2: 29, price3: 27, price4: 25, stock: 5200, reorderPoint: 1000, reorderQty: 3000, supplier: "S005", status: "active" },
];

export const mockSuppliers = [
  { id: "S001", name: "บริษัท ไทยโซลาร์ จำกัด", contact: "คุณสมชาย", phone: "02-123-4567", email: "contact@thaisolar.co.th", category: "แผง", paymentTerm: "30 วัน", taxId: "0105563012345", bank: "กสิกรไทย 123-4-56789-0", status: "active" },
  { id: "S002", name: "บริษัท เพาเวอร์เทค อินเตอร์ จำกัด", contact: "คุณวิชัย", phone: "02-234-5678", email: "info@powertech.co.th", category: "อินเวอร์เตอร์", paymentTerm: "45 วัน", taxId: "0105563023456", bank: "ไทยพาณิชย์ 234-5-67890-1", status: "active" },
  { id: "S003", name: "บริษัท กรีนเอ็นเนอร์จี จำกัด", contact: "คุณนภา", phone: "02-345-6789", email: "sale@greenenergy.co.th", category: "แบตเตอรี่", paymentTerm: "30 วัน", taxId: "0105563034567", bank: "กรุงเทพ 345-6-78901-2", status: "active" },
  { id: "S004", name: "บริษัท อะลูมาสตรัคท์ จำกัด", contact: "คุณประสิทธิ์", phone: "034-123-456", email: "sales@alustruct.co.th", category: "โครงสร้าง", paymentTerm: "15 วัน", taxId: "0105563045678", bank: "กรุงไทย 456-7-89012-3", status: "active" },
  { id: "S005", name: "บริษัท เคเบิลไทย จำกัด", contact: "คุณมนตรี", phone: "035-234-567", email: "info@cablethai.co.th", category: "สายไฟ", paymentTerm: "15 วัน", taxId: "0105563056789", bank: "กสิกรไทย 567-8-90123-4", status: "active" },
];

export const mockPurchaseOrders = [
  { id: "PO2406001", supplierId: "S001", supplierName: "บริษัท ไทยโซลาร์ จำกัด", items: [{ product: "แผงโซลาร์ Mono 400W", qty: 80, unitCost: 4150 }], total: 332000, status: "received", date: "2024-06-01", receiveDate: "2024-06-05" },
  { id: "PO2406002", supplierId: "S002", supplierName: "บริษัท เพาเวอร์เทค อินเตอร์", items: [{ product: "อินเวอร์เตอร์ Hybrid 5kW", qty: 10, unitCost: 27500 }], total: 275000, status: "partial", date: "2024-06-10", receiveDate: null },
  { id: "PO2406003", supplierId: "S003", supplierName: "บริษัท กรีนเอ็นเนอร์จี จำกัด", items: [{ product: "แบตเตอรี่ Lithium 100Ah", qty: 30, unitCost: 17800 }], total: 534000, status: "pending", date: "2024-06-12", receiveDate: null },
  { id: "PO2406004", supplierId: "S004", supplierName: "บริษัท อะลูมาสตรัคท์ จำกัด", items: [{ product: "โครงอะลูมิเนียม 40mm", qty: 500, unitCost: 178 }], total: 89000, status: "approved", date: "2024-06-13", receiveDate: null },
  { id: "PO2406005", supplierId: "S001", supplierName: "บริษัท ไทยโซลาร์ จำกัด", items: [{ product: "แผงโซลาร์ Mono 550W", qty: 60, unitCost: 5750 }], total: 345000, status: "draft", date: "2024-06-14", receiveDate: null },
];

export const mockMovementLog = [
  { id: "ML001", date: "2024-06-14 09:30", product: "แผงโซลาร์ Mono 400W", sku: "SC-MON-400W", type: "out", qty: -5, balance: 142, ref: "SO2406015", by: "ระบบ (Auto Deduction)", reason: "Sales Order" },
  { id: "ML002", date: "2024-06-14 08:15", product: "อินเวอร์เตอร์ Hybrid 5kW", sku: "INV-5KW-HYB", type: "in", qty: +8, balance: 15, ref: "PO2406002", by: "สมหญิง วงศ์ดี", reason: "Goods Receipt (บางส่วน)" },
  { id: "ML003", date: "2024-06-13 16:45", product: "แบตเตอรี่ Lithium 200Ah", sku: "BAT-LI-200AH", type: "out", qty: -3, balance: 12, ref: "SO2406012", by: "ระบบ (Auto Deduction)", reason: "Sales Order" },
  { id: "ML004", date: "2024-06-13 14:20", product: "โครงอะลูมิเนียม 40mm", sku: "STR-ALUM-40", type: "adjust", qty: -10, balance: 850, ref: "ADJ2406003", by: "สมชาย ใจดี", reason: "ตรวจนับพบส่วนต่าง" },
  { id: "ML005", date: "2024-06-12 11:00", product: "แผงโซลาร์ Mono 400W", sku: "SC-MON-400W", type: "return", qty: +2, balance: 147, ref: "RET2406001", by: "สมหญิง วงศ์ดี", reason: "ลูกค้าคืนสินค้า — ผ่านการตรวจสภาพ" },
  { id: "ML006", date: "2024-06-11 09:00", product: "สายไฟ 4mm² แดง", sku: "CAB-4MM-RED", type: "in", qty: +3000, balance: 5200, ref: "PO2406001", by: "สมชาย ใจดี", reason: "Goods Receipt" },
];

export const mockGoodsReceipts = [
  { id: "GR2406001", poId: "PO2406001", supplier: "บริษัท ไทยโซลาร์ จำกัด", product: "แผงโซลาร์ Mono 400W", orderedQty: 80, receivedQty: 80, avgCostBefore: 4200, avgCostAfter: 4185, status: "received", receiveDate: "2024-06-05", by: "สมหญิง วงศ์ดี", approved: true },
  { id: "GR2406002", poId: "PO2406002", supplier: "บริษัท เพาเวอร์เทค อินเตอร์", product: "อินเวอร์เตอร์ Hybrid 5kW", orderedQty: 10, receivedQty: 8, avgCostBefore: 28000, avgCostAfter: 27900, status: "partial", receiveDate: "2024-06-14", by: "สมหญิง วงศ์ดี", approved: true },
  { id: "GR2406003", poId: "PO2406001", supplier: "บริษัท เคเบิลไทย จำกัด", product: "สายไฟ 4mm² แดง", orderedQty: 3000, receivedQty: 3000, avgCostBefore: 22, avgCostAfter: 22, status: "received", receiveDate: "2024-06-11", by: "สมชาย ใจดี", approved: true },
  { id: "GR2406004", poId: "PO2406004", supplier: "บริษัท อะลูมาสตรัคท์ จำกัด", product: "โครงอะลูมิเนียม 40mm", orderedQty: 500, receivedQty: 0, avgCostBefore: 180, avgCostAfter: 180, status: "pending", receiveDate: null, by: "-", approved: false },
];

export const mockStockAdjustments = [
  { id: "ADJ2406003", product: "โครงอะลูมิเนียม 40mm", sku: "STR-ALUM-40", systemQty: 860, actualQty: 850, diff: -10, reason: "ตรวจนับประจำเดือน พบขาด 10 ชิ้น", trigger: "manual", status: "approved", by: "สมชาย ใจดี", date: "2024-06-13", approveDate: "2024-06-13 15:30" },
  { id: "ADJ2406002", product: "แผงโซลาร์ Mono 400W", sku: "SC-MON-400W", systemQty: 145, actualQty: 147, diff: +2, reason: "รับคืนจากลูกค้า (RET2406001) — ผ่านตรวจสภาพ", trigger: "return", status: "approved", by: "ระบบ (Auto)", date: "2024-06-12", approveDate: "2024-06-12 14:30" },
  { id: "ADJ2406001", product: "แผงโซลาร์ Mono 400W", sku: "SC-MON-400W", systemQty: 137, actualQty: 147, diff: +10, reason: "ยกเลิก SO2406011 — คืนสต็อกอัตโนมัติ", trigger: "so-cancel", status: "approved", by: "ระบบ (Auto)", date: "2024-06-11", approveDate: "2024-06-11 16:00" },
  { id: "ADJ2406004", product: "แบตเตอรี่ Lithium 100Ah", sku: "BAT-LI-100AH", systemQty: 36, actualQty: 35, diff: -1, reason: "พบสินค้าชำรุดจากการจัดเก็บ", trigger: "manual", status: "pending", by: "สมหญิง วงศ์ดี", date: "2024-06-14", approveDate: null },
];

// receivedQty = จำนวนที่สต๊อกรับเข้าจริง (null = ยังไม่รับ) · ใช้คำนวณยอด Credit Note
export const mockReturns = [
  { id: "RET2406001", soId: "SO2406010", customer: "บริษัท ซันพาวเวอร์ โซลูชั่น จำกัด", product: "แผงโซลาร์ Mono 400W", qty: 2, value: 11000, receivedQty: 2, returnDays: 12, withinPeriod: true, inspectionResult: "received", status: "completed", creditNote: "CN-2024-0101", by: "วิภา สุขใจ", date: "2024-06-12", reason: "ลูกค้าสั่งเกิน" },
  { id: "RET2406002", soId: "SO2405088", customer: "ห้างหุ้นส่วน สยามกรีน", product: "แผงโซลาร์ Mono 550W", qty: 3, value: 16500, receivedQty: 0, returnDays: 35, withinPeriod: false, inspectionResult: "pending", status: "rejected", creditNote: null, by: "วิภา สุขใจ", date: "2024-06-12", reason: "เกิน Return Period (35 วัน) — Exception ถูกปฏิเสธ" },
  { id: "RET2406003", soId: "SO2406008", customer: "บริษัท กรีนโฮม เอ็นจิเนียริ่ง จำกัด", product: "อินเวอร์เตอร์ Hybrid 5kW", qty: 1, value: 31500, receivedQty: 1, returnDays: 8, withinPeriod: true, inspectionResult: "received", status: "completed", creditNote: "CN-2024-0102", by: "วิภา สุขใจ", date: "2024-06-13", reason: "สินค้าชำรุด — รับคืนบางส่วน" },
  { id: "RET2406004", soId: "SO2406015", customer: "บริษัท ซันพาวเวอร์ โซลูชั่น จำกัด", product: "แผงโซลาร์ Mono 400W", qty: 1, value: 4800, receivedQty: 1, returnDays: 2, withinPeriod: true, inspectionResult: "received", status: "awaiting-cn", creditNote: null, by: "สมหญิง วงศ์ดี", date: "2024-06-14", reason: "ลูกค้าสั่งเกิน 1 แผง" },
  { id: "RET2406005", soId: "SO2406012", customer: "บริษัท กรีนโฮม เอ็นจิเนียริ่ง จำกัด", product: "แบตเตอรี่ Lithium 200Ah", qty: 2, value: 74000, receivedQty: null, returnDays: 2, withinPeriod: true, inspectionResult: "pending", status: "awaiting-pickup", creditNote: null, by: "วิภา สุขใจ", date: "2024-06-14", reason: "ลูกค้าแจ้งสินค้าไม่ตรงสเปค — รอสต๊อกเข้ารับ" },
  { id: "RET2406006", soId: "SO2406014", customer: "ห้างหุ้นส่วน สยามกรีน", product: "อินเวอร์เตอร์ Hybrid 5kW", qty: 1, value: 31500, receivedQty: 1, returnDays: 4, withinPeriod: true, inspectionResult: "received", status: "awaiting-admin-adjust", creditNote: null, by: "สมหญิง วงศ์ดี", date: "2024-06-14", reason: "ลูกค้าสั่งผิดรุ่น — สต๊อกรับของแล้ว รอผู้บริหารอนุมัติปรับสต๊อก" },
];

export const mockCreditNotes = [
  { id: "CN-2024-0101", soId: "SO2406010", returnId: "RET2406001", customer: "บริษัท ซันพาวเวอร์ โซลูชั่น จำกัด", amount: 11000, type: "full", reason: "คืนสินค้า 2 ชิ้น — ผ่านตรวจสภาพ", commissionStatus: "cancelled", peakStatus: "success", peakDocId: "CN-PEAK-0101", date: "2024-06-12" },
  { id: "CN-2024-0102", soId: "SO2406008", returnId: "RET2406003", customer: "บริษัท กรีนโฮม เอ็นจิเนียริ่ง จำกัด", amount: 15750, type: "partial", reason: "สินค้าชำรุด — คืน 50% ของมูลค่า", commissionStatus: "cancelled", peakStatus: "success", peakDocId: "CN-PEAK-0102", date: "2024-06-13" },
];

// ---------- SALES & MARKETING ----------

export const mockTierPricing = [
  { sku: "SC-MON-400W", name: "แผงโซลาร์ Mono 400W", avgCost: 4200, floorPrice: 4400, tier1: 5500, tier2: 5200, tier3: 4800, tier4: 4500 },
  { sku: "SC-MON-550W", name: "แผงโซลาร์ Mono 550W", avgCost: 5800, floorPrice: 6000, tier1: 7500, tier2: 7100, tier3: 6600, tier4: 6200 },
  { sku: "INV-5KW-HYB", name: "อินเวอร์เตอร์ Hybrid 5kW", avgCost: 28000, floorPrice: 29500, tier1: 36000, tier2: 34000, tier3: 31500, tier4: 30000 },
  { sku: "INV-10KW-HYB", name: "อินเวอร์เตอร์ Hybrid 10kW", avgCost: 52000, floorPrice: 54000, tier1: 68000, tier2: 64000, tier3: 60000, tier4: 57000 },
  { sku: "BAT-LI-100AH", name: "แบตเตอรี่ Lithium 100Ah", avgCost: 18000, floorPrice: 18800, tier1: 23000, tier2: 21500, tier3: 20000, tier4: 19000 },
  { sku: "BAT-LI-200AH", name: "แบตเตอรี่ Lithium 200Ah", avgCost: 35000, floorPrice: 36500, tier1: 45000, tier2: 42000, tier3: 39000, tier4: 37000 },
];

export const tierMeta = [
  { key: "tier1", label: "ทั่วไป", color: "#6b7280" },
  { key: "tier2", label: "ผู้รับเหมา", color: "#d97706" },
  { key: "tier3", label: "Dealer", color: "#2563eb" },
  { key: "tier4", label: "Founder", color: "#7c3aed" },
];


export const mockCustomers = [
  { id: "C001", name: "บริษัท ซันพาวเวอร์ โซลูชั่น จำกัด", tier: "Dealer", contact: "คุณอรุณ", phone: "081-234-5678", dept: "แผงโซลล่าเซลล์", salesOwner: "วิภา สุขใจ", status: "active", totalOrders: 28, totalValue: 4850000 },
  { id: "C002", name: "คุณประเสริฐ วงศ์สว่าง", tier: "ทั่วไป", contact: "คุณประเสริฐ", phone: "089-345-6789", dept: "แผงโซลล่าเซลล์+อินเวอร์เตอร์", salesOwner: "สมศักดิ์ รักดี", status: "active", totalOrders: 5, totalValue: 285000 },
  { id: "C003", name: "ห้างหุ้นส่วน สยามกรีน", tier: "ผู้รับเหมา", contact: "คุณสุรพล", phone: "062-456-7890", dept: "ทุกแผนก", salesOwner: "วิภา สุขใจ", status: "active", totalOrders: 15, totalValue: 2100000 },
  { id: "C004", name: "นาย สมบัติ โชคดี (Founder)", tier: "Founder", contact: "คุณสมบัติ", phone: "090-567-8901", dept: "แผงโซลล่าเซลล์", salesOwner: "สมศักดิ์ รักดี", status: "active", totalOrders: 42, totalValue: 8200000 },
  { id: "C005", name: "บริษัท กรีนโฮม เอ็นจิเนียริ่ง จำกัด", tier: "Dealer", contact: "คุณมณีรัตน์", phone: "083-678-9012", dept: "ครบชุด", salesOwner: "วิภา สุขใจ", status: "active", totalOrders: 19, totalValue: 3600000 },
];

export const mockSalesOrders = [
  { id: "SO2406015", customer: "บริษัท ซันพาวเวอร์ โซลูชั่น จำกัด", tier: "Dealer", items: [{ name: "แผงโซลาร์ Mono 400W", qty: 5, unitPrice: 4800, dept: "แผงโซลล่าเซลล์" }], subtotal: 24000, discount: 0, vat: 1680, total: 25680, commission: 1200, status: "closed", salesBy: "วิภา สุขใจ", date: "2024-06-14", invoicePushed: true },
  { id: "SO2406014", customer: "ห้างหุ้นส่วน สยามกรีน", tier: "ผู้รับเหมา", items: [{ name: "อินเวอร์เตอร์ Hybrid 5kW", qty: 2, unitPrice: 31500, dept: "อินเวอร์เตอร์" }, { name: "แบตเตอรี่ Lithium 100Ah", qty: 4, unitPrice: 20000, dept: "แบตเตอรี่" }], subtotal: 143000, discount: 5000, vat: 9660, total: 147660, commission: 7150, status: "closed", salesBy: "วิภา สุขใจ", date: "2024-06-13", invoicePushed: true },
  { id: "SO2406013", customer: "นาย สมบัติ โชคดี", tier: "Founder", items: [{ name: "แผงโซลาร์ Mono 550W", qty: 20, unitPrice: 6200, dept: "แผงโซลล่าเซลล์" }], subtotal: 124000, discount: 0, vat: 8680, total: 132680, commission: 6200, status: "pending-approval", salesBy: "สมศักดิ์ รักดี", date: "2024-06-13", invoicePushed: false },
  { id: "SO2406012", customer: "บริษัท กรีนโฮม เอ็นจิเนียริ่ง จำกัด", tier: "Dealer", items: [{ name: "แบตเตอรี่ Lithium 200Ah", qty: 3, unitPrice: 37000, dept: "แบตเตอรี่" }], subtotal: 111000, discount: 2000, vat: 7630, total: 116630, commission: 5550, status: "closed", salesBy: "วิภา สุขใจ", date: "2024-06-12", invoicePushed: true },
  { id: "SO2406011", customer: "คุณประเสริฐ วงศ์สว่าง", tier: "ทั่วไป", items: [{ name: "แผงโซลาร์ Mono 400W", qty: 10, unitPrice: 5500, dept: "แผงโซลล่าเซลล์" }], subtotal: 55000, discount: 0, vat: 3850, total: 58850, commission: 2750, status: "cancelled", salesBy: "สมศักดิ์ รักดี", date: "2024-06-11", invoicePushed: false },
];

export const mockCommissions = [
  { id: "COM001", soId: "SO2406015", sales: "วิภา สุขใจ", dept: "แผงโซลล่าเซลล์", amount: 1200, rate: 5, status: "confirmed", date: "2024-06-14" },
  { id: "COM002", soId: "SO2406014", sales: "วิภา สุขใจ", dept: "อินเวอร์เตอร์", amount: 4725, rate: 4.5, status: "confirmed", date: "2024-06-13" },
  { id: "COM003", soId: "SO2406014", sales: "วิภา สุขใจ", dept: "แบตเตอรี่", amount: 2400, rate: 3, status: "confirmed", date: "2024-06-13" },
  { id: "COM004", soId: "SO2406013", sales: "สมศักดิ์ รักดี", dept: "แผงโซลล่าเซลล์", amount: 6200, rate: 5, status: "pending", date: "2024-06-13" },
  { id: "COM005", soId: "SO2406012", sales: "วิภา สุขใจ", dept: "แบตเตอรี่", amount: 5550, rate: 5, status: "confirmed", date: "2024-06-12" },
  { id: "COM006", soId: "SO2406011", sales: "สมศักดิ์ รักดี", dept: "แผงโซลล่าเซลล์", amount: 2750, rate: 5, status: "cancelled", date: "2024-06-11" },
];

export const mockPromotions = [
  { id: "PR001", name: "โปร Mid-Year Sale", type: "percent", value: 5, tier: ["Dealer", "Founder"], startDate: "2024-06-01", endDate: "2024-06-30", status: "active", priority: 1, usedCount: 8, revenue: 289970, createdBy: "นิดา มาร์เก็ตติ้ง" },
  { id: "PR002", name: "โปรพิเศษ Founder Q2", type: "fixed", value: 5000, tier: ["Founder"], startDate: "2024-04-01", endDate: "2024-06-30", status: "active", priority: 2, usedCount: 12, revenue: 1240000, createdBy: "นิดา มาร์เก็ตติ้ง" },
  { id: "PR003", name: "โปรลูกค้าใหม่", type: "percent", value: 3, tier: ["ทั่วไป"], startDate: "2024-01-01", endDate: "2024-12-31", status: "active", priority: 3, usedCount: 4, revenue: 95000, createdBy: "นิดา มาร์เก็ตติ้ง" },
  { id: "PR004", name: "Flash Sale โครงสร้าง", type: "percent", value: 8, tier: ["ทั่วไป", "ผู้รับเหมา", "Dealer", "Founder"], startDate: "2024-06-15", endDate: "2024-06-16", status: "scheduled", priority: 1, usedCount: 0, revenue: 0, createdBy: "นิดา มาร์เก็ตติ้ง" },
  { id: "PR005", name: "โปรผู้รับเหมา Q3", type: "percent", value: 4, tier: ["ผู้รับเหมา"], startDate: "2024-07-01", endDate: "2024-09-30", status: "pending-approval", priority: 2, usedCount: 0, revenue: 0, createdBy: "นิดา มาร์เก็ตติ้ง" },
];

export const mockPromoPerformance = [
  { month: "ม.ค.", promoRevenue: 95000, normalRevenue: 225000 },
  { month: "ก.พ.", promoRevenue: 140000, normalRevenue: 240000 },
  { month: "มี.ค.", promoRevenue: 88000, normalRevenue: 202000 },
  { month: "เม.ย.", promoRevenue: 195000, normalRevenue: 255000 },
  { month: "พ.ค.", promoRevenue: 210000, normalRevenue: 210000 },
  { month: "มิ.ย.", promoRevenue: 289970, normalRevenue: 190690 },
];

// ---------- APPROVAL WORKFLOW ----------

export const mockApprovals = [
  { id: "APR001", type: "ส่วนลดเกินสิทธิ์", ref: "SO2406013", detail: "ขอส่วนลด 8% เกินเพดาน 5%", requestBy: "สมศักดิ์ รักดี", requestDate: "2024-06-13 10:30", status: "pending", approver: "ผู้บริหาร", amount: 9920 },
  { id: "APR002", type: "รับสินค้าเข้าคลัง", ref: "PO2406002", detail: "รับอินเวอร์เตอร์ 8 เครื่อง (จาก PO 10 เครื่อง)", requestBy: "สมหญิง วงศ์ดี", requestDate: "2024-06-14 08:00", status: "approved", approver: "ผู้บริหาร", approveDate: "2024-06-14 08:20", amount: 220000 },
  { id: "APR003", type: "ปรับยอดสต็อก", ref: "ADJ2406003", detail: "ตรวจนับโครงอะลูมิเนียม พบขาด 10 ชิ้น", requestBy: "สมชาย ใจดี", requestDate: "2024-06-13 14:00", status: "approved", approver: "ผู้บริหาร", approveDate: "2024-06-13 15:30", amount: 1800 },
  { id: "APR004", type: "คืนสินค้าเกิน Return Period", ref: "RET2406002", detail: "ลูกค้าขอคืนแผง 3 แผ่น — เกิน 30 วัน (35 วัน)", requestBy: "วิภา สุขใจ", requestDate: "2024-06-12 09:00", status: "rejected", approver: "ผู้บริหาร", approveDate: "2024-06-12 11:00", rejectReason: "เกินกำหนด Return Period เกินไปมาก", amount: 16500 },
  { id: "APR005", type: "บิลใหญ่เกิน Threshold", ref: "SO2406014", detail: "บิลมูลค่า 147,660 บาท เกิน Threshold 100,000 บาท", requestBy: "วิภา สุขใจ", requestDate: "2024-06-13 16:00", status: "approved", approver: "ผู้บริหาร", approveDate: "2024-06-13 16:30", amount: 147660 },
  { id: "APR006", type: "สร้างโปรโมชั่นใหม่", ref: "PR005", detail: "โปรผู้รับเหมา Q3 — ส่วนลด 4% ระหว่าง 1 ก.ค. – 30 ก.ย. 2567", requestBy: "นิดา มาร์เก็ตติ้ง", requestDate: "2024-06-14 11:00", status: "pending", approver: "ผู้บริหาร", amount: 0 },
];

// ---------- PERMISSION & USER ----------

export const mockUsers = [
  { id: "U001", name: "สมชาย ใจดี", email: "somchai@solarsell.co.th", role: "admin", dept: "-", lastLogin: "2024-06-14 09:00", status: "active" },
  { id: "U002", name: "วิภา สุขใจ", email: "wipa@solarsell.co.th", role: "sales", dept: "แผง + โครงสร้าง", lastLogin: "2024-06-14 08:45", status: "active" },
  { id: "U003", name: "สมศักดิ์ รักดี", email: "somsak@solarsell.co.th", role: "sales", dept: "อินเวอร์เตอร์ + แบตเตอรี่", lastLogin: "2024-06-14 09:15", status: "active" },
  { id: "U004", name: "สมหญิง วงศ์ดี", email: "somying@solarsell.co.th", role: "stock", dept: "-", lastLogin: "2024-06-14 07:30", status: "active" },
  { id: "U005", name: "บัญชี หมื่นดี", email: "accounting@solarsell.co.th", role: "accounting", dept: "-", lastLogin: "2024-06-13 17:00", status: "active" },
  { id: "U006", name: "นำชัย เจริญ", email: "namchai@solarsell.co.th", role: "sales", dept: "ทุกแผนก", lastLogin: "2024-06-10 16:00", status: "inactive" },
  { id: "U007", name: "นิดา มาร์เก็ตติ้ง", email: "nida@solarsell.co.th", role: "marketing", dept: "การตลาด", lastLogin: "2024-06-14 10:00", status: "active" },
];

export const mockActivityLog = [
  { id: "AL001", time: "2024-06-14 09:30", user: "ระบบ", action: "Auto Stock Deduction", detail: "ตัดสต็อก SC-MON-400W จำนวน 5 ชิ้น (SO2406015)", module: "Stock" },
  { id: "AL002", time: "2024-06-14 08:20", user: "สมชาย ใจดี", action: "อนุมัติ Goods Receipt", detail: "อนุมัติ PO2406002 — รับอินเวอร์เตอร์ 8 เครื่อง", module: "Approval" },
  { id: "AL003", time: "2024-06-14 08:00", user: "สมหญิง วงศ์ดี", action: "สร้าง Goods Receipt", detail: "รับสินค้าตาม PO2406002 บางส่วน", module: "Stock" },
  { id: "AL004", time: "2024-06-13 16:30", user: "สมชาย ใจดี", action: "อนุมัติ Sales Order", detail: "อนุมัติ SO2406014 บิลมูลค่า 147,660 บาท", module: "Sales" },
  { id: "AL005", time: "2024-06-13 15:30", user: "สมชาย ใจดี", action: "อนุมัติ Stock Adjustment", detail: "อนุมัติปรับลด โครง 40mm 10 ชิ้น (ADJ2406003)", module: "Stock" },
  { id: "AL006", time: "2024-06-13 14:00", user: "สมหญิง วงศ์ดี", action: "สร้าง Stock Adjustment", detail: "ขอปรับยอดโครง 40mm (ตรวจนับ)", module: "Stock" },
  { id: "AL007", time: "2024-06-13 10:30", user: "สมศักดิ์ รักดี", action: "สร้าง Sales Order", detail: "สร้าง SO2406013 ลูกค้า: นาย สมบัติ โชคดี", module: "Sales" },
];

// ---------- PEAK INTEGRATION ----------

export const mockPeakSync = [
  { id: "PKS001", type: "Invoice", ref: "SO2406015", docId: "INV-2024-0615", status: "success", pushedAt: "2024-06-14 09:32", amount: 25680 },
  { id: "PKS002", type: "Invoice", ref: "SO2406014", docId: "INV-2024-0614", status: "success", pushedAt: "2024-06-13 16:35", amount: 147660 },
  { id: "PKS003", type: "Invoice", ref: "SO2406012", docId: "INV-2024-0612", status: "success", pushedAt: "2024-06-12 14:20", amount: 116630 },
  { id: "PKS004", type: "Purchase Order", ref: "PO2406004", docId: "PO-PEAK-0413", status: "success", pushedAt: "2024-06-13 14:10", amount: 89000 },
  { id: "PKS005", type: "Expense by PO", ref: "PO2406002", docId: "EXP-2024-0802", status: "success", pushedAt: "2024-06-14 08:22", amount: 220000 },
  { id: "PKS006", type: "Invoice", ref: "SO2406013", docId: null, status: "pending", pushedAt: null, amount: 132680 },
  { id: "PKS007", type: "Credit Note", ref: "RET2406001", docId: "CN-2024-0101", status: "success", pushedAt: "2024-06-12 15:00", amount: 11000 },
  { id: "PKS008", type: "Supplier Contact", ref: "S004", docId: "CON-PEAK-0004", status: "error", pushedAt: "2024-06-11 09:00", amount: 0, errorMsg: "Rate limit exceeded — Queue Retry scheduled" },
];

// ---------- DASHBOARD / KPI ----------

export const mockDashboardKPI = {
  totalSalesMonth: 480660,
  totalSalesTarget: 600000,
  totalSalesLastMonth: 420000,
  totalOrders: 5,
  pendingApprovals: 1,
  lowStockCount: 2,
  commissionPending: 6200,
  commissionConfirmed: 13875,
  arOutstanding: 280000,
  arCollected: 290290,
  lastPeakSync: "2024-06-14 09:32",
};

export const mockSalesByDept = [
  { dept: "แผงโซลล่าเซลล์", actual: 156000, target: 200000 },
  { dept: "อินเวอร์เตอร์", actual: 143000, target: 180000 },
  { dept: "แบตเตอรี่", actual: 111000, target: 120000 },
  { dept: "โครงสร้าง/สาย", actual: 70660, target: 100000 },
];

export const mockSalesTrend = [
  { month: "ม.ค.", value: 320000 },
  { month: "ก.พ.", value: 380000 },
  { month: "มี.ค.", value: 290000 },
  { month: "เม.ย.", value: 450000 },
  { month: "พ.ค.", value: 420000 },
  { month: "มิ.ย.", value: 480660 },
];

export const mockStockAlerts = mockProducts.filter(p => p.stock <= p.reorderPoint);

// ---------- HELPERS ----------

export const roleLabel: Record<string, string> = {
  admin: "ผู้บริหาร",
  sales: "เซลส์",
  stock: "สต็อก",
  accounting: "บัญชี",
  marketing: "การตลาด",
};

export const statusColor: Record<string, string> = {
  active: "success",
  inactive: "ghost",
  pending: "warning",
  approved: "success",
  rejected: "error",
  closed: "success",
  draft: "secondary",
  cancelled: "ghost",
  received: "success",
  partial: "warning",
  confirmed: "success",
  error: "error",
  success: "success",
  scheduled: "info",
};
