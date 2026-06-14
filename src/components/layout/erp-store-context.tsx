"use client";

import { createContext, useContext, useState, useRef } from "react";
import {
  mockReturns, mockCreditNotes, mockProducts, mockSuppliers,
  mockPurchaseOrders, mockGoodsReceipts, mockStockAdjustments,
  mockSalesOrders, mockCustomers, mockCommissions, mockPromotions,
  mockTierPricing, mockMovementLog,
} from "@/lib/mock-data";

// วันที่อ้างอิงของระบบเดโม (นาฬิกาในแอปแสดง จ. 14 มิ.ย. 2567)
const DEMO_DATE = "2024-06-14";

// ---------- types (อิงจาก shape ของ mock data) ----------
export type Product = typeof mockProducts[number];
export type Supplier = typeof mockSuppliers[number];
export type PurchaseOrder = typeof mockPurchaseOrders[number];
export type GoodsReceipt = typeof mockGoodsReceipts[number] & { shortfallReason?: string | null };
export type StockAdjustment = typeof mockStockAdjustments[number];
export type SalesOrder = typeof mockSalesOrders[number];
type CustomerBase = typeof mockCustomers[number];
// ฟิลด์ที่แก้ไขได้ของลูกค้า (ใช้กับ pendingPatch ตอนรออนุมัติแก้ไข)
export type CustomerPatch = Partial<Pick<CustomerBase, "name" | "tier" | "contact" | "phone" | "dept" | "salesOwner">>;
// ลูกค้า + ฟิลด์รออนุมัติ (การตลาดสร้าง/แก้/ลบ → รอผู้บริหารอนุมัติ)
export type Customer = CustomerBase & {
  pendingAction?: "add" | "edit" | "delete" | null;
  pendingPatch?: CustomerPatch | null;
  requestedBy?: string | null;
};
export type Commission = typeof mockCommissions[number];
export type Promotion = typeof mockPromotions[number];
export type TierPricing = typeof mockTierPricing[number];

export interface ReturnRec {
  id: string;
  soId: string;
  customer: string;
  product: string;
  qty: number;
  value: number;
  receivedQty: number | null;
  shortfallReason?: string | null;
  returnDays: number;
  withinPeriod: boolean;
  inspectionResult: string;
  status: string;
  creditNote: string | null;
  by: string;
  date: string;
  reason: string;
}

export interface CreditNote {
  id: string;
  soId: string;
  returnId: string;
  customer: string;
  amount: number;
  type: "full" | "partial";
  reason: string;
  commissionStatus: string;
  peakStatus: string;
  peakDocId: string | null;
  date: string;
}

// รายการเคลื่อนไหวสต๊อก (seed จาก mock + รายการใหม่ที่เกิดจากการทำงานจริง)
export interface MovementRec {
  id: string;
  date: string;
  product: string;
  sku: string;
  type: string;
  qty: number;
  balance: number;
  ref: string;
  by: string;
  reason: string;
}

// ---------- input payloads ----------
interface NewProductInput { sku: string; name: string; category: string; avgCost: number; price1: number; price2: number; price3: number; price4: number; stock: number; reorderPoint: number; reorderQty: number; supplier: string; }
interface NewSupplierInput { name: string; contact: string; phone: string; email: string; category: string; paymentTerm: string; taxId: string; bank: string; }
interface NewPOInput { supplierId: string; product: string; qty: number; unitCost: number; }
interface ReceiveGoodsInput { poId: string; product: string; orderedQty: number; receivedQty: number; shortfallReason?: string | null; }
interface NewAdjustInput { product: string; sku: string; actualQty: number; reason: string; }
interface NewSOInput { customer: string; tier: string; items: { name: string; qty: number; unitPrice: number; dept: string }[]; discount: number; salesBy: string; }
interface NewCustomerInput { name: string; tier: string; contact: string; phone: string; dept: string; salesOwner: string; }
interface CustomerChangeOpts { needsApproval?: boolean; requestedBy?: string; }
interface NewPromotionInput { name: string; type: string; value: number; tier: string[]; startDate: string; endDate: string; createdBy: string; }
interface NewTierPricingInput { sku: string; name: string; avgCost: number; floorPrice: number; tier1: number; tier2: number; tier3: number; tier4: number; }

interface ErpStore {
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  stockAdjustments: StockAdjustment[];
  salesOrders: SalesOrder[];
  customers: Customer[];
  commissions: Commission[];
  promotions: Promotion[];
  tierPricing: TierPricing[];
  returns: ReturnRec[];
  creditNotes: CreditNote[];
  movements: MovementRec[];

  // stock create / actions
  addProduct: (p: NewProductInput) => void;
  addSupplier: (s: NewSupplierInput) => void;
  updateSupplier: (id: string, patch: NewSupplierInput) => void;
  createPO: (po: NewPOInput) => void;
  receiveGoods: (g: ReceiveGoodsInput) => void;                 // GR → สต๊อก +, Movement Log, อัปเดต PO
  createAdjustment: (a: NewAdjustInput) => void;                // ปรับยอด → สถานะ pending (รออนุมัติ)
  approveAdjustment: (id: string) => void;                      // อนุมัติ → commit สต๊อก + Movement Log
  createReturnRequest: (r: { soId: string; customer: string; product: string; qty: number; value: number; reason: string; by: string; returnDays: number }) => void;

  // sales / marketing create
  createSalesOrder: (so: NewSOInput) => SalesOrder;             // → ตัดสต๊อก + Movement Log + commission
  // ── ลูกค้า: การตลาด needsApproval → รออนุมัติ · ผู้บริหารทำได้ทันที ──
  addCustomer: (c: NewCustomerInput, opts?: CustomerChangeOpts) => void;
  updateCustomer: (id: string, patch: CustomerPatch, opts?: CustomerChangeOpts) => void;
  deleteCustomer: (id: string, opts?: CustomerChangeOpts) => void;
  approveCustomer: (id: string) => void;                        // ผู้บริหารอนุมัติ → ใช้คำขอที่ค้างอยู่
  rejectCustomer: (id: string) => void;                         // ผู้บริหารปฏิเสธ → ย้อนกลับ/ทิ้งคำขอ
  addPromotion: (p: NewPromotionInput) => void;                 // → สถานะ pending-approval
  addTierPricing: (t: NewTierPricingInput) => void;

  // return → CN flow
  receiveReturn: (id: string, receivedQty: number, shortfallReason?: string) => void;
  rejectReturn: (id: string, reason: string) => void;
  approveStockAdjust: (id: string) => void;
  createCreditNote: (id: string) => void;
}

const Ctx = createContext<ErpStore | null>(null);

export function ErpStoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => mockProducts.map(p => ({ ...p })));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => mockSuppliers.map(s => ({ ...s })));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => mockPurchaseOrders.map(p => ({ ...p })));
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(() => mockGoodsReceipts.map(g => ({ ...g })));
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() => mockStockAdjustments.map(a => ({ ...a })));
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => mockSalesOrders.map(o => ({ ...o })));
  const [customers, setCustomers] = useState<Customer[]>(() => mockCustomers.map(c => ({ ...c })));
  const [commissions, setCommissions] = useState<Commission[]>(() => mockCommissions.map(c => ({ ...c })));
  const [promotions, setPromotions] = useState<Promotion[]>(() => mockPromotions.map(p => ({ ...p })));
  const [tierPricing, setTierPricing] = useState<TierPricing[]>(() => mockTierPricing.map(t => ({ ...t })));
  const [returns, setReturns] = useState<ReturnRec[]>(() => mockReturns.map(r => ({ ...r })) as ReturnRec[]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => mockCreditNotes.map(c => ({ ...c })) as CreditNote[]);
  const [movements, setMovements] = useState<MovementRec[]>(() => mockMovementLog.map(m => ({ ...m })));

  // ตัวนับสำหรับสร้างเลขเอกสารแบบ deterministic (ไม่ใช้ Date.now/Math.random)
  const seq = useRef(900);
  const nextNum = () => { seq.current += 1; return seq.current; };

  function pushMovement(mv: MovementRec) {
    setMovements(prev => [mv, ...prev]);
  }

  // ── เพิ่มสินค้า ──
  function addProduct(p: NewProductInput) {
    const id = `P${String(nextNum()).padStart(3, "0")}`;
    setProducts(prev => [{ ...p, id, status: "active" }, ...prev]);
  }

  // ── เพิ่มผู้ขาย ──
  function addSupplier(s: NewSupplierInput) {
    const id = `S${String(nextNum()).padStart(3, "0")}`;
    setSuppliers(prev => [{ ...s, id, status: "active" }, ...prev]);
  }

  // ── แก้ไขข้อมูลผู้ขาย ──
  function updateSupplier(id: string, patch: NewSupplierInput) {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  // ── สร้าง Purchase Order ──
  function createPO(input: NewPOInput) {
    const id = `PO2406${String(nextNum()).slice(-3)}`;
    const sup = suppliers.find(s => s.id === input.supplierId);
    setPurchaseOrders(prev => [{
      id,
      supplierId: input.supplierId,
      supplierName: sup?.name ?? input.supplierId,
      items: [{ product: input.product, qty: input.qty, unitCost: input.unitCost }],
      total: input.qty * input.unitCost,
      status: "approved",
      date: DEMO_DATE,
      receiveDate: null,
    }, ...prev]);
  }

  // ── รับสินค้าเข้าคลัง (GR) → สต๊อก +, Movement Log, อัปเดตสถานะ PO ──
  function receiveGoods(input: ReceiveGoodsInput) {
    const prod = products.find(p => p.name === input.product);
    const newStock = (prod?.stock ?? 0) + input.receivedQty;
    if (prod) setProducts(prev => prev.map(p => p.name === input.product ? { ...p, stock: newStock } : p));

    const full = input.receivedQty >= input.orderedQty;
    const shortfallReason = full ? null : (input.shortfallReason ?? null);
    const grId = `GR2406${String(nextNum()).slice(-3)}`;
    setGoodsReceipts(prev => [{
      id: grId,
      poId: input.poId,
      supplier: purchaseOrders.find(p => p.id === input.poId)?.supplierName ?? "—",
      product: input.product,
      orderedQty: input.orderedQty,
      receivedQty: input.receivedQty,
      avgCostBefore: prod?.avgCost ?? 0,
      avgCostAfter: prod?.avgCost ?? 0,
      status: full ? "received" : "partial",
      receiveDate: DEMO_DATE,
      by: "สมหญิง วงศ์ดี",
      approved: true,
      shortfallReason,
    }, ...prev]);

    // อัปเดตสถานะ PO
    setPurchaseOrders(prev => prev.map(p =>
      p.id === input.poId ? { ...p, status: full ? "received" : "partial", receiveDate: DEMO_DATE } : p
    ));

    pushMovement({
      id: `ML-GR${grId.slice(-3)}`,
      date: `${DEMO_DATE} 10:00`,
      product: input.product,
      sku: prod?.sku ?? "—",
      type: "in",
      qty: input.receivedQty,
      balance: newStock,
      ref: input.poId,
      by: "สมหญิง วงศ์ดี",
      reason: full ? "Goods Receipt" : `Goods Receipt (บางส่วน${shortfallReason ? ` — ${shortfallReason}` : ""})`,
    });
  }

  // ── สร้างใบปรับยอดสต๊อก → สถานะ pending (รออนุมัติ) ──
  function createAdjustment(input: NewAdjustInput) {
    const prod = products.find(p => p.sku === input.sku || p.name === input.product);
    const systemQty = prod?.stock ?? 0;
    const id = `ADJ2406${String(nextNum()).slice(-3)}`;
    setStockAdjustments(prev => [{
      id,
      product: input.product,
      sku: input.sku,
      systemQty,
      actualQty: input.actualQty,
      diff: input.actualQty - systemQty,
      reason: input.reason,
      trigger: "manual",
      status: "pending",
      by: "สมหญิง วงศ์ดี",
      date: DEMO_DATE,
      approveDate: null,
    }, ...prev]);
  }

  // ── อนุมัติใบปรับยอด → commit สต๊อก + Movement Log ──
  function approveAdjustment(id: string) {
    const adj = stockAdjustments.find(a => a.id === id);
    if (!adj || adj.status !== "pending") return;
    const prod = products.find(p => p.sku === adj.sku || p.name === adj.product);
    const newStock = (prod?.stock ?? 0) + adj.diff;
    if (prod) setProducts(prev => prev.map(p => (p.sku === adj.sku || p.name === adj.product) ? { ...p, stock: newStock } : p));

    setStockAdjustments(prev => prev.map(a =>
      a.id === id ? { ...a, status: "approved", approveDate: `${DEMO_DATE} 16:00` } : a
    ));

    pushMovement({
      id: `ML-${id.slice(-3)}`,
      date: `${DEMO_DATE} 16:00`,
      product: adj.product,
      sku: adj.sku,
      type: "adjust",
      qty: adj.diff,
      balance: newStock,
      ref: id,
      by: "ผู้บริหาร (อนุมัติปรับยอด)",
      reason: adj.reason,
    });
  }

  // ── บันทึกคำขอคืนสินค้า → สถานะ รอสต๊อกรับของ ──
  function createReturnRequest(input: { soId: string; customer: string; product: string; qty: number; value: number; reason: string; by: string; returnDays: number }) {
    const id = `RET2406${String(nextNum()).slice(-3)}`;
    const within = input.returnDays <= 30;
    setReturns(prev => [{
      id,
      soId: input.soId,
      customer: input.customer,
      product: input.product,
      qty: input.qty,
      value: input.value,
      receivedQty: null,
      shortfallReason: null,
      returnDays: input.returnDays,
      withinPeriod: within,
      inspectionResult: "pending",
      status: within ? "awaiting-pickup" : "awaiting-pickup",
      creditNote: null,
      by: input.by,
      date: DEMO_DATE,
      reason: input.reason,
    }, ...prev]);
  }

  // ── สร้างใบสั่งขาย → ตัดสต๊อก + Movement Log + commission ──
  function createSalesOrder(input: NewSOInput): SalesOrder {
    const id = `SO2406${String(nextNum()).slice(-3)}`;
    const subtotal = input.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const net = subtotal - input.discount;
    const vat = Math.round(net * 0.07);
    const total = net + vat;
    const commission = Math.round(net * 0.05);
    const bigBill = total > 100000;

    const so: SalesOrder = {
      id,
      customer: input.customer,
      tier: input.tier,
      items: input.items,
      subtotal,
      discount: input.discount,
      vat,
      total,
      commission,
      status: bigBill ? "pending-approval" : "closed",
      salesBy: input.salesBy,
      date: DEMO_DATE,
      invoicePushed: false,
    };
    setSalesOrders(prev => [so, ...prev]);

    // ตัดสต๊อก + Movement Log ต่อรายการ
    input.items.forEach((it, idx) => {
      const prod = products.find(p => p.name === it.name);
      if (!prod) return;
      const newStock = Math.max(0, prod.stock - it.qty);
      setProducts(prev => prev.map(p => p.name === it.name ? { ...p, stock: newStock } : p));
      pushMovement({
        id: `ML-${id.slice(-3)}-${idx}`,
        date: `${DEMO_DATE} 11:30`,
        product: it.name,
        sku: prod.sku,
        type: "out",
        qty: -it.qty,
        balance: newStock,
        ref: id,
        by: "ระบบ (Auto Deduction)",
        reason: "Sales Order",
      });
    });

    // commission
    setCommissions(prev => [{
      id: `COM${String(nextNum()).padStart(3, "0")}`,
      soId: id,
      sales: input.salesBy,
      dept: input.items[0]?.dept ?? "-",
      amount: commission,
      rate: 5,
      status: bigBill ? "pending" : "confirmed",
      date: DEMO_DATE,
    }, ...prev]);

    return so;
  }

  // ── เพิ่มลูกค้า — การตลาด: รออนุมัติ · ผู้บริหาร: ใช้งานได้ทันที ──
  function addCustomer(input: NewCustomerInput, opts?: CustomerChangeOpts) {
    const id = `C${String(nextNum()).padStart(3, "0")}`;
    const needs = opts?.needsApproval ?? false;
    setCustomers(prev => [{
      ...input, id,
      status: needs ? "pending-approval" : "active",
      totalOrders: 0, totalValue: 0,
      pendingAction: needs ? "add" : null,
      pendingPatch: null,
      requestedBy: needs ? (opts?.requestedBy ?? input.salesOwner) : null,
    }, ...prev]);
  }

  // ── แก้ไขลูกค้า — การตลาด: เก็บเป็น pendingPatch (ค่าจริงยังไม่เปลี่ยนจนกว่าจะอนุมัติ) ──
  function updateCustomer(id: string, patch: CustomerPatch, opts?: CustomerChangeOpts) {
    if (opts?.needsApproval) {
      setCustomers(prev => prev.map(c =>
        c.id === id
          ? { ...c, pendingAction: "edit", pendingPatch: patch, requestedBy: opts.requestedBy ?? null }
          : c
      ));
    } else {
      setCustomers(prev => prev.map(c =>
        c.id === id ? { ...c, ...patch, pendingAction: null, pendingPatch: null, requestedBy: null } : c
      ));
    }
  }

  // ── ลบลูกค้า — การตลาด: ทำเครื่องหมายรออนุมัติลบ (ยังไม่ลบจริง) ──
  function deleteCustomer(id: string, opts?: CustomerChangeOpts) {
    if (opts?.needsApproval) {
      setCustomers(prev => prev.map(c =>
        c.id === id ? { ...c, pendingAction: "delete", requestedBy: opts.requestedBy ?? null } : c
      ));
    } else {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  }

  // ── ผู้บริหารอนุมัติคำขอของการตลาด → ลงมือทำจริง ──
  function approveCustomer(id: string) {
    setCustomers(prev => prev.flatMap(c => {
      if (c.id !== id) return [c];
      if (c.pendingAction === "delete") return [];                                  // ลบจริง
      if (c.pendingAction === "edit") {
        return [{ ...c, ...(c.pendingPatch ?? {}), status: "active", pendingAction: null, pendingPatch: null, requestedBy: null }];
      }
      return [{ ...c, status: "active", pendingAction: null, pendingPatch: null, requestedBy: null }]; // add → active
    }));
  }

  // ── ผู้บริหารปฏิเสธ → ทิ้งคำขอ (add ทิ้งทั้งแถว, edit/delete ย้อนกลับเป็น active) ──
  function rejectCustomer(id: string) {
    setCustomers(prev => prev.flatMap(c => {
      if (c.id !== id) return [c];
      if (c.pendingAction === "add") return [];                                     // ทิ้งลูกค้าใหม่
      return [{ ...c, status: "active", pendingAction: null, pendingPatch: null, requestedBy: null }];
    }));
  }

  // ── เพิ่มโปรโมชั่น → สถานะ pending-approval (ต้องอนุมัติก่อนมีผล) ──
  function addPromotion(input: NewPromotionInput) {
    const id = `PR${String(nextNum()).padStart(3, "0")}`;
    setPromotions(prev => [{
      ...input, id, status: "pending-approval", priority: 3, usedCount: 0, revenue: 0,
    }, ...prev]);
  }

  // ── เพิ่ม Segment / Tier Pricing ──
  function addTierPricing(input: NewTierPricingInput) {
    setTierPricing(prev => [{ ...input }, ...prev]);
  }

  // ① สต๊อกรับของคืน + จำนวนที่รับจริง → สถานะ "รอผู้บริหารอนุมัติปรับสต๊อก"
  function receiveReturn(id: string, receivedQty: number, shortfallReason?: string) {
    setReturns(prev => prev.map(r =>
      r.id === id
        ? { ...r, receivedQty, shortfallReason: shortfallReason ?? null, inspectionResult: "received", status: "awaiting-admin-adjust" }
        : r
    ));
  }

  // ①' สต๊อกปฏิเสธรับคืนทั้งใบ → "สต๊อกปฏิเสธรับคืน"
  function rejectReturn(id: string, reason: string) {
    setReturns(prev => prev.map(r =>
      r.id === id
        ? { ...r, receivedQty: 0, shortfallReason: reason, inspectionResult: "fail", status: "stock-rejected" }
        : r
    ));
  }

  // ② ผู้บริหารอนุมัติปรับยอดสต๊อก → commit ยอด + Movement Log → "รอเซลล์ออก CN"
  function approveStockAdjust(id: string) {
    const r = returns.find(x => x.id === id);
    if (!r || r.receivedQty == null || r.receivedQty <= 0 || r.status !== "awaiting-admin-adjust") return;

    setReturns(prev => prev.map(x =>
      x.id === id ? { ...x, inspectionResult: "pass", status: "awaiting-cn" } : x
    ));

    const prod = products.find(p => p.name === r.product);
    const newStock = (prod?.stock ?? 0) + r.receivedQty;
    if (prod) setProducts(prev => prev.map(p => p.name === r.product ? { ...p, stock: newStock } : p));

    pushMovement({
      id: `ML-${r.id.slice(-4)}`,
      date: `${r.date} 15:30`,
      product: r.product,
      sku: prod?.sku ?? "—",
      type: "return",
      qty: r.receivedQty,
      balance: newStock,
      ref: r.id,
      by: "ผู้บริหาร (อนุมัติปรับสต๊อก)",
      reason: `รับคืนจากลูกค้า (${r.id}) — ผู้บริหารอนุมัติปรับสต๊อก +${r.receivedQty}`,
    });
  }

  // ③ เซลล์ออก Credit Note → ④ Push เข้า Peak อัตโนมัติ
  function createCreditNote(id: string) {
    const r = returns.find(x => x.id === id);
    if (!r || r.receivedQty == null || r.receivedQty <= 0) return;
    const cnId = `CN-2024-0${r.id.slice(-3)}`;
    const unitPrice = r.qty > 0 ? Math.round(r.value / r.qty) : r.value;
    const amount = unitPrice * r.receivedQty;
    const isFull = r.receivedQty >= r.qty;

    setReturns(prev => prev.map(x =>
      x.id === id ? { ...x, status: "completed", creditNote: cnId } : x
    ));

    const shortfall = !isFull && r.shortfallReason ? ` (รับไม่ครบ: ${r.shortfallReason})` : "";
    const newCN: CreditNote = {
      id: cnId, soId: r.soId, returnId: r.id, customer: r.customer,
      amount, type: isFull ? "full" : "partial",
      reason: `คืนสินค้า ${r.product} รับจริง ${r.receivedQty}/${r.qty} ชิ้น${shortfall}`,
      commissionStatus: "cancelled", peakStatus: "pushing", peakDocId: null, date: r.date,
    };
    setCreditNotes(prev => prev.some(c => c.id === cnId) ? prev : [newCN, ...prev]);

    setTimeout(() => {
      setCreditNotes(prev => prev.map(c =>
        c.id === cnId ? { ...c, peakStatus: "success", peakDocId: `CN-PEAK-${r.id.slice(-4)}` } : c
      ));
    }, 1600);
  }

  return (
    <Ctx.Provider value={{
      products, suppliers, purchaseOrders, goodsReceipts, stockAdjustments,
      salesOrders, customers, commissions, promotions, tierPricing,
      returns, creditNotes, movements,
      addProduct, addSupplier, updateSupplier, createPO, receiveGoods, createAdjustment, approveAdjustment, createReturnRequest,
      createSalesOrder, addCustomer, updateCustomer, deleteCustomer, approveCustomer, rejectCustomer,
      addPromotion, addTierPricing,
      receiveReturn, rejectReturn, approveStockAdjust, createCreditNote,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useErpStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useErpStore must be used within ErpStoreProvider");
  return ctx;
}
