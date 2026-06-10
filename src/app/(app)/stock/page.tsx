"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Badge, statusBadge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  mockProducts, mockSuppliers, mockPurchaseOrders, mockMovementLog,
  mockGoodsReceipts, mockStockAdjustments, mockReturns,
} from "@/lib/mock-data";
import { useRole } from "@/components/layout/role-context";
import { Package, Truck, FileText, History, AlertTriangle, Plus, Search, X, ChevronRight, ArrowUpRight, ArrowDownLeft, RotateCcw, Edit2, PackageCheck, SlidersHorizontal, Undo2, CheckCircle2, Eye } from "lucide-react";

type Tab = "products" | "suppliers" | "po" | "gr" | "adjust" | "return" | "log";

export default function StockPage() {
  const [tab, setTab] = useState<Tab>("products");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<typeof mockProducts[0] | null>(null);
  const { config } = useRole();
  const { canSeeCost, stockReadOnly } = config.perms;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "products", label: "สินค้า", icon: Package },
    { key: "suppliers", label: "ผู้ขาย", icon: Truck },
    { key: "po", label: "Purchase Order", icon: FileText },
    { key: "gr", label: "Goods Receipt", icon: PackageCheck },
    { key: "adjust", label: "Stock Adjustment", icon: SlidersHorizontal },
    { key: "return", label: "Return Inspection", icon: Undo2 },
    { key: "log", label: "Movement Log", icon: History },
  ];

  const lowStock = mockProducts.filter(p => p.stock <= p.reorderPoint);

  // ปุ่ม "สร้าง/เพิ่ม" ต้องตรงกับงานของแต่ละแท็บ — Movement Log เป็น audit trail แก้ไม่ได้ จึงไม่มีปุ่ม
  const createLabel: Partial<Record<Tab, string>> = {
    products: "เพิ่มสินค้า",
    suppliers: "เพิ่มผู้ขาย",
    po: "สร้าง PO",
    gr: "รับสินค้า (GR)",
    adjust: "ปรับยอดสต็อก",
    return: "บันทึกรับคืน",
  };

  return (
    <>
      <Topbar title="Stock Management" subtitle="จัดการคลังสินค้า ผู้ขาย และการสั่งซื้อ" />
      <div className="p-6">

        {/* Alert Banner */}
        {lowStock.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50 mb-4">
            <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 text-[0.8rem]">
              <span className="font-600 text-red-700">สต็อกต่ำกว่า Reorder Point: </span>
              {lowStock.map((p, i) => (
                <span key={p.id}>
                  <button
                    onClick={() => { setTab("products"); setSelectedProduct(p); }}
                    className="text-red-600 font-500 underline underline-offset-2 hover:text-red-800"
                  >
                    {p.sku}
                  </button>
                  {i < lowStock.length - 1 && <span className="text-red-400">, </span>}
                </span>
              ))}
            </div>
            {!stockReadOnly && (
              <button className="text-[0.75rem] text-white px-3 py-1 rounded-lg font-500 whitespace-nowrap flex-shrink-0" style={{ background: "var(--primary)" }}>
                สั่งซื้อทันที
              </button>
            )}
          </div>
        )}

        {/* Tab + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="flex gap-1 p-1 rounded-lg overflow-x-auto" style={{ background: "var(--muted)" }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSelectedProduct(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.8rem] font-500 transition-all whitespace-nowrap flex-shrink-0"
                style={{
                  background: tab === t.key ? "var(--card)" : "transparent",
                  color: tab === t.key ? "var(--foreground)" : "var(--muted-foreground)",
                  boxShadow: tab === t.key ? "var(--shadow-sm)" : "none",
                }}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหา..."
                className="pl-8 pr-3 h-8 text-[0.8rem] border border-[var(--border)] rounded-lg outline-none bg-[var(--card)] focus:border-[var(--ring)] w-48"
              />
            </div>
            {tab === "log" ? (
              <span className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.78rem] font-500 text-[var(--muted-foreground)] border border-[var(--border)]">
                <History size={13} />
                บันทึกถาวร (อ่านอย่างเดียว)
              </span>
            ) : stockReadOnly ? (
              <span className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.78rem] font-500 text-[var(--muted-foreground)] border border-[var(--border)]">
                <Eye size={13} />
                ดูอย่างเดียว
              </span>
            ) : (
              <button
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.8rem] font-500 text-white hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0"
                style={{ background: "var(--primary)" }}
              >
                <Plus size={13} />
                {createLabel[tab]}
              </button>
            )}
          </div>
        </div>

        {/* Main layout */}
        <div className="flex gap-4">
          {/* Table */}
          <div className="flex-1 min-w-0 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
            {tab === "products" && (
              <ProductTable
                search={search}
                selected={selectedProduct}
                onSelect={setSelectedProduct}
                canSeeCost={canSeeCost}
                stockReadOnly={stockReadOnly}
              />
            )}
            {tab === "suppliers" && <SupplierTable search={search} />}
            {tab === "po" && <POTable search={search} />}
            {tab === "gr" && <GoodsReceiptTable search={search} canSeeCost={canSeeCost} />}
            {tab === "adjust" && <StockAdjustmentTable search={search} />}
            {tab === "return" && <ReturnInspectionTable search={search} />}
            {tab === "log" && <MovementLogTable search={search} />}
          </div>

          {/* Product detail panel */}
          {tab === "products" && selectedProduct && (
            <ProductDetailPanel
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              canSeeCost={canSeeCost}
              stockReadOnly={stockReadOnly}
            />
          )}
        </div>
      </div>
    </>
  );
}

/* ── Product Detail Panel ─────────────────────────── */
function ProductDetailPanel({
  product: p, onClose, canSeeCost, stockReadOnly,
}: {
  product: typeof mockProducts[0];
  onClose: () => void;
  canSeeCost: boolean;
  stockReadOnly: boolean;
}) {
  const supplier = mockSuppliers.find(s => s.id === p.supplier);
  const isLow = p.stock <= p.reorderPoint;
  const pctToReorder = Math.min((p.stock / p.reorderPoint) * 100, 100);
  const movements = mockMovementLog.filter(m => m.sku === p.sku);

  return (
    <div className="w-72 flex-shrink-0 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-md)] overflow-hidden flex flex-col h-fit sticky top-20">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-[var(--border)]">
        <div>
          <div className="font-700 text-[0.85rem] leading-tight">{p.name}</div>
          <div className="font-mono text-[0.7rem] text-[var(--muted-foreground)] mt-0.5">{p.sku}</div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-[var(--muted)] transition-colors flex-shrink-0"
        >
          <X size={12} />
        </button>
      </div>

      <div className="overflow-y-auto">
        {/* Stock status */}
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.75rem] font-600">ยอดคงเหลือ</span>
            {isLow && <Badge variant="error">ต่ำกว่า Reorder</Badge>}
          </div>
          <div className="text-[2rem] font-800 leading-none mb-1" style={{ color: isLow ? "var(--destructive)" : "var(--foreground)" }}>
            {formatNumber(p.stock)}
          </div>
          <div className="text-[0.7rem] text-[var(--muted-foreground)] mb-2">
            Reorder Point: {formatNumber(p.reorderPoint)} · Reorder Qty: {formatNumber(p.reorderQty)}
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pctToReorder}%`,
                background: isLow ? "var(--destructive)" : "var(--primary)",
              }}
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="text-[0.75rem] font-600 mb-2">ราคาขาย (Tier)</div>
          <div className="space-y-1.5">
            {[
              { label: "Tier 1 — ทั่วไป", price: p.price1 },
              { label: "Tier 2 — ผู้รับเหมา", price: p.price2 },
              { label: "Tier 3 — Dealer", price: p.price3 },
              { label: "Tier 4 — Founder", price: p.price4 },
            ].map(t => (
              <div key={t.label} className="flex justify-between text-[0.78rem]">
                <span className="text-[var(--muted-foreground)]">{t.label}</span>
                <span className="font-500">{formatCurrency(t.price)}</span>
              </div>
            ))}
            {canSeeCost && (
              <div className="flex justify-between text-[0.78rem] pt-1.5 border-t border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">ต้นทุนเฉลี่ย (Avg)</span>
                <span className="font-700">{formatCurrency(p.avgCost)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Supplier */}
        {supplier && (
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <div className="text-[0.75rem] font-600 mb-1.5">Preferred Supplier</div>
            <div className="p-2.5 rounded-lg" style={{ background: "var(--muted)" }}>
              <div className="font-500 text-[0.78rem]">{supplier.name}</div>
              <div className="text-[0.7rem] text-[var(--muted-foreground)] mt-0.5">{supplier.contact} · {supplier.phone}</div>
              <div className="text-[0.7rem] text-[var(--muted-foreground)]">ชำระ: {supplier.paymentTerm}</div>
            </div>
          </div>
        )}

        {/* Recent movements */}
        {movements.length > 0 && (
          <div className="px-4 py-3">
            <div className="text-[0.75rem] font-600 mb-2">การเคลื่อนไหวล่าสุด</div>
            <div className="space-y-1.5">
              {movements.slice(0, 3).map(m => (
                <div key={m.id} className="flex items-center gap-2 text-[0.72rem]">
                  {m.type === "in" && <ArrowUpRight size={12} className="text-green-500 flex-shrink-0" />}
                  {m.type === "out" && <ArrowDownLeft size={12} className="text-red-500 flex-shrink-0" />}
                  {m.type === "return" && <RotateCcw size={12} className="text-blue-500 flex-shrink-0" />}
                  {m.type === "adjust" && <Edit2 size={12} className="text-amber-500 flex-shrink-0" />}
                  <span className={m.qty > 0 ? "text-green-600 font-500" : "text-red-600 font-500"}>
                    {m.qty > 0 ? "+" : ""}{m.qty}
                  </span>
                  <span className="text-[var(--muted-foreground)] truncate">{m.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {stockReadOnly ? (
        <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-center gap-1.5 text-[0.75rem] text-[var(--muted-foreground)]">
          <Eye size={12} />
          โหมดดูอย่างเดียว
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-[var(--border)] flex gap-2">
          <button
            className="flex-1 h-8 rounded-lg text-[0.78rem] font-500 text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            สั่งซื้อ (PO)
          </button>
          <button className="flex-1 h-8 rounded-lg text-[0.78rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
            แก้ไข
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Product Table ────────────────────────────────── */
function ProductTable({
  search, selected, onSelect, canSeeCost, stockReadOnly,
}: {
  search: string;
  selected: typeof mockProducts[0] | null;
  onSelect: (p: typeof mockProducts[0] | null) => void;
  canSeeCost: boolean;
  stockReadOnly: boolean;
}) {
  const data = mockProducts.filter(p =>
    p.name.includes(search) || p.sku.includes(search) || p.category.includes(search)
  );
  const headers = ["SKU", "ชื่อสินค้า", "หมวด", ...(canSeeCost ? ["ต้นทุนเฉลี่ย"] : []), "ราคา Tier 1", "สต็อก", "Reorder", "สถานะ", ""];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((p) => {
            const isLow = p.stock <= p.reorderPoint;
            const isSelected = selected?.id === p.id;
            return (
              <tr
                key={p.id}
                onClick={() => onSelect(isSelected ? null : p)}
                className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
                style={{ background: isSelected ? "var(--accent)" : "transparent" }}
              >
                <td className="px-4 py-3 font-mono text-[0.73rem]" style={{ color: isSelected ? "var(--primary)" : "inherit" }}>
                  {p.sku}
                </td>
                <td className="px-4 py-3 font-500">{p.name}</td>
                <td className="px-4 py-3"><Badge variant="secondary">{p.category}</Badge></td>
                {canSeeCost && <td className="px-4 py-3">{formatCurrency(p.avgCost)}</td>}
                <td className="px-4 py-3">{formatCurrency(p.price1)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-600 ${isLow ? "text-red-600" : ""}`}>{formatNumber(p.stock)}</span>
                    {isLow && <AlertTriangle size={11} className="text-red-500" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{formatNumber(p.reorderPoint)}</td>
                <td className="px-4 py-3">{statusBadge(p.status)}</td>
                <td className="px-4 py-3">
                  <ChevronRight size={13} className={isSelected ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SupplierTable({ search }: { search: string }) {
  const data = mockSuppliers.filter(s => s.name.includes(search) || s.category.includes(search));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {["รหัส", "ชื่อบริษัท", "ผู้ติดต่อ", "เบอร์โทร", "หมวดสินค้า", "เงื่อนไขชำระ", "สถานะ", ""].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr key={s.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
              <td className="px-4 py-3 font-mono text-[0.73rem] font-500">{s.id}</td>
              <td className="px-4 py-3 font-500">{s.name}</td>
              <td className="px-4 py-3">{s.contact}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{s.phone}</td>
              <td className="px-4 py-3"><Badge variant="secondary">{s.category}</Badge></td>
              <td className="px-4 py-3">{s.paymentTerm}</td>
              <td className="px-4 py-3">{statusBadge(s.status)}</td>
              <td className="px-4 py-3">
                <button className="text-[0.72rem] font-500 hover:underline" style={{ color: "var(--primary)" }}>แก้ไข</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function POTable({ search }: { search: string }) {
  const data = mockPurchaseOrders.filter(p => p.id.includes(search) || p.supplierName.includes(search));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {["เลข PO", "ผู้ขาย", "รายการ", "มูลค่า", "วันที่", "สถานะ", ""].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((po) => (
            <tr key={po.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
              <td className="px-4 py-3 font-mono text-[0.73rem] font-500" style={{ color: "var(--primary)" }}>{po.id}</td>
              <td className="px-4 py-3">{po.supplierName}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">
                {po.items.map(i => `${i.product} (${i.qty})`).join(", ")}
              </td>
              <td className="px-4 py-3 font-600">{formatCurrency(po.total)}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{po.date}</td>
              <td className="px-4 py-3">{statusBadge(po.status)}</td>
              <td className="px-4 py-3">
                <button className="text-[0.72rem] font-500 hover:underline" style={{ color: "var(--primary)" }}>ดูรายละเอียด</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GoodsReceiptTable({ search, canSeeCost }: { search: string; canSeeCost: boolean }) {
  const data = mockGoodsReceipts.filter(g => g.id.includes(search) || g.poId.includes(search) || g.product.includes(search));
  const headers = ["เลข GR", "อ้างอิง PO", "สินค้า", "สั่ง / รับจริง", ...(canSeeCost ? ["Avg Cost (ก่อน→หลัง)"] : []), "วันที่รับ", "ผู้รับ", "อนุมัติ", "สถานะ"];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((g) => (
            <tr key={g.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
              <td className="px-4 py-3 font-mono text-[0.73rem] font-500" style={{ color: "var(--primary)" }}>{g.id}</td>
              <td className="px-4 py-3 font-mono text-[0.73rem]">{g.poId}</td>
              <td className="px-4 py-3 font-500">{g.product}</td>
              <td className="px-4 py-3">
                <span className="font-600">{g.receivedQty}</span>
                <span className="text-[var(--muted-foreground)]"> / {g.orderedQty}</span>
                {g.receivedQty < g.orderedQty && g.receivedQty > 0 && (
                  <span className="text-amber-600 text-[0.7rem] ml-1">(ขาด {g.orderedQty - g.receivedQty})</span>
                )}
              </td>
              {canSeeCost && (
                <td className="px-4 py-3 text-[0.78rem]">
                  {g.avgCostBefore !== g.avgCostAfter ? (
                    <span>{formatCurrency(g.avgCostBefore)} → <span className="font-600" style={{ color: "var(--primary)" }}>{formatCurrency(g.avgCostAfter)}</span></span>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">{formatCurrency(g.avgCostAfter)}</span>
                  )}
                </td>
              )}
              <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">{g.receiveDate ?? "—"}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{g.by}</td>
              <td className="px-4 py-3">
                {g.approved
                  ? <CheckCircle2 size={15} className="text-green-500" />
                  : <span className="text-amber-500 text-[0.72rem]">รออนุมัติ</span>}
              </td>
              <td className="px-4 py-3">{statusBadge(g.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StockAdjustmentTable({ search }: { search: string }) {
  const triggerLabel: Record<string, { label: string; variant: string }> = {
    manual: { label: "Manual", variant: "secondary" },
    "so-cancel": { label: "SO ยกเลิก (Auto)", variant: "info" },
    return: { label: "รับคืน (Auto)", variant: "info" },
  };
  const data = mockStockAdjustments.filter(a => a.id.includes(search) || a.product.includes(search) || a.sku.includes(search));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {["เลขที่", "สินค้า", "ยอดระบบ", "นับจริง", "ส่วนต่าง", "เหตุผล", "Trigger", "ผู้ทำ", "สถานะ"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
              <td className="px-4 py-3 font-mono text-[0.73rem] font-500" style={{ color: "var(--primary)" }}>{a.id}</td>
              <td className="px-4 py-3">
                <div className="font-500">{a.product}</div>
                <div className="text-[0.7rem] text-[var(--muted-foreground)] font-mono">{a.sku}</div>
              </td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{formatNumber(a.systemQty)}</td>
              <td className="px-4 py-3 font-500">{formatNumber(a.actualQty)}</td>
              <td className="px-4 py-3 font-700">
                <span className={a.diff > 0 ? "text-green-600" : "text-red-600"}>
                  {a.diff > 0 ? "+" : ""}{a.diff}
                </span>
              </td>
              <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-[200px]">{a.reason}</td>
              <td className="px-4 py-3"><Badge variant={triggerLabel[a.trigger].variant as any}>{triggerLabel[a.trigger].label}</Badge></td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{a.by}</td>
              <td className="px-4 py-3">{statusBadge(a.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReturnInspectionTable({ search }: { search: string }) {
  const data = mockReturns.filter(r => r.id.includes(search) || r.customer.includes(search) || r.product.includes(search));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {["เลขคืน", "อ้างอิง SO", "ลูกค้า", "สินค้า", "จำนวน", "มูลค่า", "Return Period", "ผลตรวจ", "Credit Note", "สถานะ"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
              <td className="px-4 py-3 font-mono text-[0.73rem] font-500" style={{ color: "var(--primary)" }}>{r.id}</td>
              <td className="px-4 py-3 font-mono text-[0.73rem]">{r.soId}</td>
              <td className="px-4 py-3 font-500 max-w-[150px] truncate">{r.customer}</td>
              <td className="px-4 py-3">{r.product}</td>
              <td className="px-4 py-3">{r.qty}</td>
              <td className="px-4 py-3 font-500">{formatCurrency(r.value)}</td>
              <td className="px-4 py-3">
                <span className={r.withinPeriod ? "text-[var(--muted-foreground)]" : "text-red-600 font-500"}>
                  {r.returnDays} วัน
                </span>
                {!r.withinPeriod && <div className="text-[0.65rem] text-red-500">เกินกำหนด</div>}
              </td>
              <td className="px-4 py-3">{r.inspectionResult !== "pending" ? statusBadge(r.inspectionResult) : <span className="text-[var(--muted-foreground)] text-[0.72rem]">—</span>}</td>
              <td className="px-4 py-3 font-mono text-[0.72rem]">{r.creditNote ?? <span className="text-[var(--muted-foreground)]">—</span>}</td>
              <td className="px-4 py-3">{statusBadge(r.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MovementLogTable({ search }: { search: string }) {
  const typeColor: Record<string, string> = { in: "success", out: "error", adjust: "warning", return: "info" };
  const typeLabel: Record<string, string> = { in: "รับเข้า", out: "ตัดออก", adjust: "ปรับยอด", return: "รับคืน" };
  const data = mockMovementLog.filter(m =>
    m.product.includes(search) || m.sku.includes(search) || m.ref.includes(search)
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {["วันที่/เวลา", "สินค้า", "ประเภท", "จำนวน", "ยอดคงเหลือ", "อ้างอิง", "ผู้ทำรายการ", "เหตุผล"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((m) => (
            <tr key={m.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
              <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap text-[0.75rem]">{m.date}</td>
              <td className="px-4 py-3">
                <div className="font-500">{m.product}</div>
                <div className="text-[0.7rem] text-[var(--muted-foreground)] font-mono">{m.sku}</div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={typeColor[m.type] as any}>{typeLabel[m.type]}</Badge>
              </td>
              <td className="px-4 py-3 font-600">
                <span className={m.qty > 0 ? "text-green-600" : "text-red-600"}>
                  {m.qty > 0 ? "+" : ""}{formatNumber(m.qty)}
                </span>
              </td>
              <td className="px-4 py-3 font-500">{formatNumber(m.balance)}</td>
              <td className="px-4 py-3 font-mono text-[0.72rem]" style={{ color: "var(--primary)" }}>{m.ref}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{m.by}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-[200px] truncate">{m.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
