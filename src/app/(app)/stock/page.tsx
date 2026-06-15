"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Badge, statusBadge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useRole } from "@/components/layout/role-context";
import { useStockNav } from "@/components/layout/stock-nav-context";
import { useErpStore, type ReturnRec, type Product, type Supplier, type PurchaseOrder, type SalesOrder } from "@/components/layout/erp-store-context";
import { Package, Truck, FileText, History, AlertTriangle, Plus, Search, X, ChevronRight, ArrowUpRight, ArrowDownLeft, RotateCcw, Edit2, PackageCheck, SlidersHorizontal, Undo2, CheckCircle2, Eye, Info, BarChart2, LayoutDashboard } from "lucide-react";
import { BahtSign } from "@/components/ui/baht-sign";
import { StockDashboard } from "@/components/dashboards/dept-dashboards";

type Tab = "dashboard" | "products" | "suppliers" | "po" | "gr" | "adjust" | "return" | "log" | "cost";

export default function StockPage() {
  const { config, role } = useRole();
  const { canSeeCost, stockReadOnly } = config.perms;
  const isAccounting = role === "accounting";

  const { tab, setTab } = useStockNav();
  const store = useErpStore();
  const { products } = store;
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // ปิดแผงรายละเอียดสินค้าเมื่อสลับแท็บ
  useEffect(() => {
    setSelectedProduct(null);
    setCreateOpen(false);
  }, [tab]);

  // Movement Log ถูกจัดไว้เป็นเมนูสุดท้าย
  const allTabs: { key: Tab; label: string; icon: React.ElementType; desc: string; roles?: string[] }[] = [
    { key: "dashboard", label: "ภาพรวม", icon: LayoutDashboard, desc: "Dashboard สต็อก — ภาพรวมคลังสินค้าและการแจ้งเตือน", roles: ["admin"] },
    { key: "products", label: "สินค้า", icon: Package, desc: "รายการสินค้า ต้นทุน และสต็อกคงเหลือ", roles: ["admin", "sales", "stock"] },
    { key: "suppliers", label: "ผู้ขาย", icon: Truck, desc: "ข้อมูลผู้ขายและเงื่อนไขการชำระเงิน" },
    { key: "po", label: "Purchase Order", icon: FileText, desc: "ใบสั่งซื้อและสถานะการรับเข้า", roles: ["admin", "stock"] },
    { key: "gr", label: "Goods Receipt", icon: PackageCheck, desc: "รับสินค้าเข้าคลังตาม PO", roles: ["admin", "stock", "accounting"] },
    { key: "adjust", label: "Stock Adjustment", icon: SlidersHorizontal, desc: "ปรับยอดสต็อกและตรวจนับ", roles: ["admin", "stock"] },
    { key: "return", label: "Return Inspection", icon: Undo2, desc: "รับคืนสินค้าและตรวจสภาพ", roles: ["admin", "stock"] },
    { key: "cost", label: "Avg Cost Report", icon: BarChart2, desc: "รายงานต้นทุนเฉลี่ยและมูลค่าคงคลัง", roles: ["admin", "stock", "accounting"] },
    { key: "log", label: "Movement Log", icon: History, desc: "ประวัติการเคลื่อนไหวสต็อก (อ่านอย่างเดียว)", roles: ["admin", "stock", "accounting"] },
  ];
  const currentTab = allTabs.find(t => t.key === tab) ?? allTabs[0];

  const lowStock = products.filter(p => p.stock <= p.reorderPoint);

  // ปุ่ม "สร้าง/เพิ่ม" ต้องตรงกับงานของแต่ละแท็บ — Movement Log เป็น audit trail แก้ไม่ได้ จึงไม่มีปุ่ม
  // Return ไม่มีปุ่มสร้างในหน้าสต๊อก — ใบขอคืนสร้างโดยเซลล์เท่านั้น สต๊อกทำได้แค่รับของและตรวจสภาพ
  const createLabel: Partial<Record<Tab, string>> = {
    products: "เพิ่มสินค้า",
    suppliers: "เพิ่มผู้ขาย",
    po: "สร้าง PO",
    gr: "รับสินค้า (GR)",
    adjust: "ปรับยอดสต็อก",
  };

  // ── ชิ้นส่วนที่ใช้ร่วม: ค้นหา + ปุ่ม action ──
  const searchBox = (
    <div className="relative">
      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="ค้นหา..."
        className="pl-8 pr-3 h-8 text-[0.8rem] border border-[var(--border)] rounded-lg outline-none bg-[var(--card)] focus:border-[var(--ring)] w-44"
      />
    </div>
  );

  const actionButton = tab === "log" ? (
    <span className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.78rem] font-500 text-[var(--muted-foreground)] border border-[var(--border)] whitespace-nowrap">
      <History size={13} />
      บันทึกถาวร (อ่านอย่างเดียว)
    </span>
  ) : stockReadOnly ? (
    <span className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.78rem] font-500 text-[var(--muted-foreground)] border border-[var(--border)]">
      <Eye size={13} />
      ดูอย่างเดียว
    </span>
  ) : createLabel[tab] ? (
    <button
      onClick={() => setCreateOpen(true)}
      className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.8rem] font-500 text-white hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0"
      style={{ background: "var(--primary)" }}
    >
      <Plus size={13} />
      {createLabel[tab]}
    </button>
  ) : null;

  // เนื้อหาตาราง + แผงรายละเอียด (ใช้ร่วมทุก layout)
  const contentArea = (
    <div className="flex gap-4">
      {tab === "dashboard" ? (
        <div className="flex-1 min-w-0 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
          <StockDashboard />
        </div>
      ) : (
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
        {tab === "suppliers" && <SupplierTable search={search} showFinancial={isAccounting || role === "admin"} />}
        {tab === "po" && <POTable search={search} canReceive={!stockReadOnly} />}
        {tab === "gr" && <GoodsReceiptTable search={search} canSeeCost={canSeeCost} />}
        {tab === "adjust" && <StockAdjustmentTable search={search} canApprove={role === "admin"} />}
        {tab === "return" && <ReturnInspectionTable search={search} canInspect={!stockReadOnly} canApprove={role === "admin"} />}
        {tab === "cost" && <AvgCostReport search={search} canSeeCost={canSeeCost} />}
        {tab === "log" && <MovementLogTable search={search} />}
      </div>
      )}

      {tab === "products" && selectedProduct && (
        <ProductDetailPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          canSeeCost={canSeeCost}
          stockReadOnly={stockReadOnly}
        />
      )}
    </div>
  );

  return (
    <>
      <Topbar title="Stock Management" subtitle="จัดการคลังสินค้า ผู้ขาย และการสั่งซื้อ" />
      <div className="p-6">

        {/* Accounting View Banner */}
        {isAccounting && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-violet-200 bg-violet-50 mb-4 text-[0.8rem]">
            <Info size={14} className="text-violet-500 flex-shrink-0" />
            <span className="text-violet-700">
              มุมมอง <span className="font-600">บัญชี (Accounting View)</span> — ดูข้อมูลการเงิน Supplier, GR Log, Avg Cost Report, Movement Log · อ่านอย่างเดียว
            </span>
          </div>
        )}

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

        {/* ── ทุกสิทธิ์: เมนูย่อยอยู่ในแถบซ้าย → เนื้อหาเต็มความกว้าง ── */}
        {tab !== "dashboard" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent)" }}>
                <currentTab.icon size={17} style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <h2 className="text-[0.95rem] font-700 leading-tight">{currentTab.label}</h2>
                <p className="text-[0.72rem] text-[var(--muted-foreground)]">{currentTab.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {searchBox}
              {actionButton}
            </div>
          </div>
        )}
        {contentArea}
      </div>

      {/* ── โมดอลสร้าง/เพิ่ม ตามแท็บปัจจุบัน ── */}
      {createOpen && tab === "products" && (
        <AddProductModal suppliers={store.suppliers} onClose={() => setCreateOpen(false)} onSubmit={(p) => { store.addProduct(p); setCreateOpen(false); }} />
      )}
      {createOpen && tab === "suppliers" && (
        <AddSupplierModal onClose={() => setCreateOpen(false)} onSubmit={(s) => { store.addSupplier(s); setCreateOpen(false); }} />
      )}
      {createOpen && tab === "po" && (
        <CreatePOModal suppliers={store.suppliers} products={store.products} onClose={() => setCreateOpen(false)} onSubmit={(po) => { store.createPO(po); setCreateOpen(false); }} />
      )}
      {createOpen && tab === "gr" && (
        <CreateGRModal purchaseOrders={store.purchaseOrders} onClose={() => setCreateOpen(false)} onSubmit={(g) => { store.receiveGoods(g); setCreateOpen(false); }} />
      )}
      {createOpen && tab === "adjust" && (
        <CreateAdjustmentModal products={store.products} onClose={() => setCreateOpen(false)} onSubmit={(a) => { store.createAdjustment(a); setCreateOpen(false); }} />
      )}
      {createOpen && tab === "return" && (
        <CreateReturnRequestModal salesOrders={store.salesOrders} onClose={() => setCreateOpen(false)} onSubmit={(r) => { store.createReturnRequest(r); setCreateOpen(false); }} />
      )}
    </>
  );
}

/* ── Product Detail Panel ─────────────────────────── */
function ProductDetailPanel({
  product: p, onClose, canSeeCost, stockReadOnly,
}: {
  product: Product;
  onClose: () => void;
  canSeeCost: boolean;
  stockReadOnly: boolean;
}) {
  const { suppliers, movements: allMovements } = useErpStore();
  const supplier = suppliers.find(s => s.id === p.supplier);
  const isLow = p.stock <= p.reorderPoint;
  const pctToReorder = Math.min((p.stock / p.reorderPoint) * 100, 100);
  const movements = allMovements.filter(m => m.sku === p.sku);

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
  selected: Product | null;
  onSelect: (p: Product | null) => void;
  canSeeCost: boolean;
  stockReadOnly: boolean;
}) {
  const { products } = useErpStore();
  const data = products.filter(p =>
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

function SupplierTable({ search, showFinancial }: { search: string; showFinancial?: boolean }) {
  const { suppliers, updateSupplier, products } = useErpStore();
  const [editing, setEditing] = useState<Supplier | null>(null);
  // หมวดสินค้าของผู้ขาย = รวมหมวดของสินค้าที่ผู้ขายรายนั้นเป็นเจ้าของ (คำนวณอัตโนมัติ รองรับหลายหมวด)
  const catsOf = (id: string) => [...new Set(products.filter(p => p.supplier === id).map(p => p.category))];
  const data = suppliers.filter(s => s.name.includes(search) || catsOf(s.id).some(c => c.includes(search)));
  const baseHeaders = ["รหัส", "ชื่อบริษัท", "ผู้ติดต่อ", "เบอร์โทร", "หมวดสินค้า", "เงื่อนไขชำระ", "สถานะ"];
  const financialHeaders = ["เลขนิติบุคคล", "บัญชีธนาคาร"];
  const headers = showFinancial ? [...baseHeaders, ...financialHeaders, ""] : [...baseHeaders, ""];
  return (
    <div>
      {showFinancial && (
        <div className="px-4 py-2.5 border-b border-[var(--border)] bg-violet-50 flex items-center gap-2 text-[0.75rem]">
          <BahtSign size={12} className="text-violet-500" />
          <span className="text-violet-700">แสดงข้อมูลการเงิน Supplier (เลขนิติบุคคล + บัญชีธนาคาร) — บัญชีเท่านั้น</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-[0.82rem]">
          <thead style={{ background: "var(--muted)" }}>
            <tr>
              {headers.map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
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
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {catsOf(s.id).length > 0
                      ? catsOf(s.id).map(c => <Badge key={c} variant="secondary">{c}</Badge>)
                      : <span className="text-[0.72rem] text-[var(--muted-foreground)]">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">{s.paymentTerm}</td>
                <td className="px-4 py-3">{statusBadge(s.status)}</td>
                {showFinancial && (
                  <>
                    <td className="px-4 py-3 font-mono text-[0.72rem] text-[var(--muted-foreground)]">{s.taxId}</td>
                    <td className="px-4 py-3 text-[0.75rem] text-[var(--muted-foreground)]">{s.bank}</td>
                  </>
                )}
                <td className="px-4 py-3">
                  <button onClick={() => setEditing(s)} className="text-[0.72rem] font-500 hover:underline" style={{ color: "var(--primary)" }}>แก้ไข</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <AddSupplierModal
          supplier={editing}
          onClose={() => setEditing(null)}
          onSubmit={(patch) => { updateSupplier(editing.id, patch); setEditing(null); }}
        />
      )}
    </div>
  );
}

function POTable({ search, canReceive }: { search: string; canReceive?: boolean }) {
  const { purchaseOrders, receiveGoods } = useErpStore();
  const [receiving, setReceiving] = useState<typeof purchaseOrders[number] | null>(null);
  const data = purchaseOrders.filter(p => p.id.includes(search) || p.supplierName.includes(search));
  // PO ที่ยังรอรับเข้า
  const awaitsReceive = (status: string) => ["pending", "approved", "partial"].includes(status);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {["เลข PO", "ผู้ขาย", "รายการ", "มูลค่า", "วันที่", "สถานะ", "จัดการ"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((po) => (
            <tr key={po.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
              <td className="px-4 py-3 font-mono text-[0.73rem] font-500" style={{ color: "var(--primary)" }}>{po.id}</td>
              <td className="px-4 py-3">{po.supplierName}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">
                {po.items.map(i => `${i.product} (${i.qty})`).join(", ")}
              </td>
              <td className="px-4 py-3 font-600">{formatCurrency(po.total)}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{po.date}</td>
              <td className="px-4 py-3">{statusBadge(po.status)}</td>
              <td className="px-4 py-3">
                {canReceive && awaitsReceive(po.status) ? (
                  <button
                    onClick={() => setReceiving(po)}
                    className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[0.72rem] font-600 text-white transition-colors hover:opacity-90 whitespace-nowrap"
                    style={{ background: "var(--primary)" }}
                  >
                    <PackageCheck size={12} />
                    รับสินค้า
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-[0.72rem] text-[var(--muted-foreground)]">
                    <CheckCircle2 size={12} className="text-green-500" />
                    รับครบแล้ว
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {receiving && (
        <ReceiveGoodsModal
          po={receiving}
          onClose={() => setReceiving(null)}
          onConfirm={(qty, shortfallReason) => {
            const item = receiving.items[0];
            receiveGoods({ poId: receiving.id, product: item.product, orderedQty: item.qty, receivedQty: qty, shortfallReason });
            setReceiving(null);
          }}
        />
      )}
    </div>
  );
}

function ReceiveGoodsModal({
  po, onClose, onConfirm,
}: {
  po: { id: string; supplierName: string; items: { product: string; qty: number; unitCost: number }[] };
  onClose: () => void;
  onConfirm: (qty: number, shortfallReason: string | null) => void;
}) {
  const ordered = po.items[0]?.qty ?? 0;
  const [qty, setQty] = useState(ordered);
  const [reason, setReason] = useState(GR_SHORTFALL_REASONS[0]);
  const partial = qty < ordered;
  const invalid = qty <= 0 || qty > ordered || (partial && !reason.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--card)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-700 text-base">รับสินค้าเข้าคลัง (GR)</h2>
            <p className="text-[0.72rem] text-[var(--muted-foreground)]">ตรวจรับตาม {po.id} · {po.supplierName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[0.8rem]">
            <div className="text-[var(--muted-foreground)] text-[0.7rem] mb-0.5">สินค้า</div>
            <div className="font-500">{po.items[0]?.product}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.78rem] font-500 mb-1.5">จำนวนที่สั่ง</label>
              <div className="h-9 px-3 flex items-center rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[0.82rem] font-600">
                {ordered} ชิ้น
              </div>
            </div>
            <div>
              <label className="block text-[0.78rem] font-500 mb-1.5">
                รับเข้าจริง <span className="text-[var(--muted-foreground)] font-400">(1–{ordered})</span>
              </label>
              <input
                type="number" min={1} max={ordered}
                value={qty}
                onChange={e => setQty(Math.max(0, Math.min(ordered, Number(e.target.value))))}
                className="w-full h-9 px-3 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]"
              />
            </div>
          </div>
          {partial && (
            <>
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[0.74rem] text-amber-700">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                <span>รับบางส่วน {qty}/{ordered} ชิ้น — PO จะอยู่สถานะ "รับบางส่วน"</span>
              </div>
              <div>
                <label className="block text-[0.78rem] font-500 mb-1.5">เหตุผลที่รับไม่ครบ <span className="text-red-500">*</span></label>
                <ReasonPicker options={GR_SHORTFALL_REASONS} value={reason} onChange={setReason} placeholder="ระบุเหตุผลที่รับเข้าไม่ครบ..." />
              </div>
            </>
          )}
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-[0.72rem] text-green-700">
            <Info size={13} className="mt-0.5 flex-shrink-0" />
            <span>ยืนยันแล้ว ระบบจะ <strong>+{qty} เข้าสต๊อก</strong> และลง Movement Log อัตโนมัติ</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-[0.82rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">ยกเลิก</button>
          <button
            onClick={() => onConfirm(qty, partial ? reason : null)}
            disabled={invalid}
            className="flex items-center gap-1.5 px-5 h-9 rounded-lg text-[0.82rem] font-600 text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--primary)" }}
          >
            <PackageCheck size={14} />
            ยืนยันรับเข้าคลัง
          </button>
        </div>
      </div>
    </div>
  );
}

function GoodsReceiptTable({ search, canSeeCost }: { search: string; canSeeCost: boolean }) {
  const { goodsReceipts } = useErpStore();
  const data = goodsReceipts.filter(g => g.id.includes(search) || g.poId.includes(search) || g.product.includes(search));
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
              <td className="px-4 py-3 font-500">
                {g.product}
                {g.shortfallReason && <div className="text-[0.68rem] text-amber-600 mt-0.5">เหตุผลรับไม่ครบ: {g.shortfallReason}</div>}
              </td>
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

function StockAdjustmentTable({ search, canApprove }: { search: string; canApprove?: boolean }) {
  const { stockAdjustments, approveAdjustment } = useErpStore();
  const triggerLabel: Record<string, { label: string; variant: string }> = {
    manual: { label: "Manual", variant: "secondary" },
    "so-cancel": { label: "SO ยกเลิก (Auto)", variant: "info" },
    return: { label: "รับคืน (Auto)", variant: "info" },
  };
  const data = stockAdjustments.filter(a => a.id.includes(search) || a.product.includes(search) || a.sku.includes(search));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {["เลขที่", "สินค้า", "ยอดระบบ", "นับจริง", "ส่วนต่าง", "เหตุผล", "Trigger", "ผู้ทำ", "สถานะ", "จัดการ"].map(h => (
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
              <td className="px-4 py-3">
                {a.status === "pending" ? (
                  canApprove ? (
                    <button
                      onClick={() => approveAdjustment(a.id)}
                      className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[0.72rem] font-600 text-white transition-colors hover:opacity-90 whitespace-nowrap"
                      style={{ background: "var(--primary)" }}
                    >
                      <CheckCircle2 size={12} />
                      อนุมัติ
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[0.72rem] text-amber-600">
                      <SlidersHorizontal size={12} />
                      รออนุมัติ
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1 text-[0.72rem] text-[var(--muted-foreground)]">
                    <CheckCircle2 size={12} className="text-green-500" />
                    เสร็จสิ้น
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReturnInspectionTable({ search, canInspect, canApprove }: { search: string; canInspect?: boolean; canApprove?: boolean }) {
  const { returns: rows, receiveReturn, rejectReturn, approveStockAdjust } = useErpStore();
  const [receiving, setReceiving] = useState<ReturnRec | null>(null);
  const [approving, setApproving] = useState<ReturnRec | null>(null);
  const data = rows.filter(r => r.id.includes(search) || r.customer.includes(search) || r.product.includes(search));
  const awaiting = rows.filter(r => r.status === "awaiting-pickup").length;
  const awaitingAdjust = rows.filter(r => r.status === "awaiting-admin-adjust").length;
  const awaitingCN = rows.filter(r => r.status === "awaiting-cn").length;

  return (
    <div>
      {/* Summary + flow banner */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)] flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.75rem]">
        <div className="flex items-center gap-1.5">
          <Package size={13} className="text-amber-500" />
          <span className="text-[var(--muted-foreground)]">รอสต๊อกรับของ</span>
          <span className="font-700 text-amber-600">{awaiting}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={13} className="text-amber-500" />
          <span className="text-[var(--muted-foreground)]">รอผู้บริหารอนุมัติปรับสต๊อก</span>
          <span className="font-700 text-amber-600">{awaitingAdjust}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <RotateCcw size={13} className="text-blue-500" />
          <span className="text-[var(--muted-foreground)]">รอเซลล์ออก CN</span>
          <span className="font-700 text-blue-600">{awaitingCN}</span>
        </div>
        <span className="text-[var(--muted-foreground)] ml-auto hidden lg:block">
          สต๊อกรับของ → ผู้บริหารอนุมัติปรับสต๊อก → เซลล์ออก CN → Push เข้า Peak
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[0.82rem]">
          <thead style={{ background: "var(--muted)" }}>
            <tr>
              {["เลขคืน", "อ้างอิง SO", "ลูกค้า", "สินค้า", "ขอคืน", "รับจริง", "มูลค่า", "Return Period", "Credit Note", "สถานะ", "จัดการ"].map(h => (
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
                <td className="px-4 py-3 font-600">
                  {r.receivedQty == null
                    ? <span className="text-[var(--muted-foreground)]">—</span>
                    : (
                      <>
                        <span className={r.receivedQty < r.qty ? "text-amber-600" : "text-green-600"}>{r.receivedQty}</span>
                        {r.shortfallReason && (
                          <div className="text-[0.62rem] font-400 text-amber-600 max-w-[130px] truncate" title={r.shortfallReason}>
                            {r.shortfallReason}
                          </div>
                        )}
                      </>
                    )}
                </td>
                <td className="px-4 py-3 font-500">{formatCurrency(r.value)}</td>
                <td className="px-4 py-3">
                  <span className={r.withinPeriod ? "text-[var(--muted-foreground)]" : "text-red-600 font-500"}>
                    {r.returnDays} วัน
                  </span>
                  {!r.withinPeriod && <div className="text-[0.65rem] text-red-500">เกินกำหนด</div>}
                </td>
                <td className="px-4 py-3 font-mono text-[0.72rem]">{r.creditNote ?? <span className="text-[var(--muted-foreground)]">—</span>}</td>
                <td className="px-4 py-3">{statusBadge(r.status)}</td>
                <td className="px-4 py-3">
                  {r.status === "awaiting-pickup" ? (
                    canInspect ? (
                      <button
                        onClick={() => setReceiving(r)}
                        className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[0.72rem] font-600 text-white transition-colors hover:opacity-90 whitespace-nowrap"
                        style={{ background: "#0d9488" }}
                      >
                        <PackageCheck size={12} />
                        รับของคืน
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[0.72rem] text-amber-600">
                        <Package size={12} />
                        รอสต๊อกรับของ
                      </span>
                    )
                  ) : r.status === "awaiting-admin-adjust" ? (
                    canApprove ? (
                      <button
                        onClick={() => setApproving(r)}
                        className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[0.72rem] font-600 text-white transition-colors hover:opacity-90 whitespace-nowrap"
                        style={{ background: "var(--primary)" }}
                      >
                        <SlidersHorizontal size={12} />
                        อนุมัติปรับสต๊อก
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[0.72rem] text-amber-600">
                        <SlidersHorizontal size={12} />
                        รอผู้บริหารอนุมัติ
                      </span>
                    )
                  ) : r.status === "awaiting-cn" ? (
                    <span className="flex items-center gap-1 text-[0.72rem] text-blue-600">
                      <RotateCcw size={12} />
                      รอเซลล์ออก CN
                    </span>
                  ) : r.status === "stock-rejected" || r.status === "rejected" ? (
                    <span className="flex items-center gap-1 text-[0.72rem] text-red-600" title={r.shortfallReason ?? r.reason}>
                      <X size={12} />
                      ปฏิเสธรับคืน
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[0.72rem] text-[var(--muted-foreground)]">
                      <CheckCircle2 size={12} className="text-green-500" />
                      เสร็จสิ้น
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {receiving && (
        <ReceiveReturnModal
          rec={receiving}
          onClose={() => setReceiving(null)}
          onReceive={(qty, reason) => { receiveReturn(receiving.id, qty, reason); setReceiving(null); }}
          onReject={(reason) => { rejectReturn(receiving.id, reason); setReceiving(null); }}
        />
      )}

      {approving && (
        <AdjustApprovalModal
          rec={approving}
          onClose={() => setApproving(null)}
          onConfirm={() => { approveStockAdjust(approving.id); setApproving(null); }}
        />
      )}
    </div>
  );
}

// เหตุผลที่รับของคืนไม่ครบ (รับบางส่วน) — กดเลือกเป็นปุ่ม
const SHORTFALL_REASONS = [
  "สินค้าชำรุด/แตกหัก",
  "สภาพไม่ผ่านเกณฑ์รับคืน",
  "ลูกค้าส่งคืนไม่ครบ",
];

// เหตุผลที่ปฏิเสธรับคืนทั้งใบ — กดเลือกเป็นปุ่ม
const REJECT_REASONS = [
  "สินค้าชำรุดทั้งหมด",
  "เกินระยะเวลารับคืน",
  "ไม่ใช่สินค้าของบริษัท",
  "สภาพไม่ผ่านเกณฑ์รับคืน",
];

function ReceiveReturnModal({
  rec, onClose, onReceive, onReject,
}: {
  rec: ReturnRec;
  onClose: () => void;
  onReceive: (qty: number, reason?: string) => void;
  onReject: (reason: string) => void;
}) {
  const [mode, setMode] = useState<"receive" | "reject">("receive");
  const [qty, setQty] = useState(rec.qty);
  const [reason, setReason] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [rejReason, setRejReason] = useState("");
  const [rejCustom, setRejCustom] = useState(false);
  const unitPrice = rec.qty > 0 ? Math.round(rec.value / rec.qty) : rec.value;
  const partial = qty < rec.qty;
  const receiveInvalid = qty <= 0 || qty > rec.qty || (partial && !reason.trim());
  const rejectInvalid = !rejReason.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--card)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-700 text-base">ตรวจรับสินค้าคืน</h2>
            <p className="text-[0.72rem] text-[var(--muted-foreground)]">รับเข้าคลัง หรือปฏิเสธทั้งใบหากรับคืนไม่ได้</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[0.78rem]">
            <div>
              <div className="text-[var(--muted-foreground)] text-[0.7rem] mb-0.5">เลขคืน</div>
              <div className="font-mono text-[0.73rem] font-500" style={{ color: "var(--primary)" }}>{rec.id}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[var(--muted-foreground)] text-[0.7rem] mb-0.5">สินค้า</div>
              <div className="font-500 truncate">{rec.product}</div>
            </div>
          </div>

          {/* สลับโหมด: รับเข้าคลัง / ปฏิเสธทั้งใบ */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--muted)]">
            <button
              onClick={() => setMode("receive")}
              className={`flex items-center justify-center gap-1.5 h-9 rounded-lg text-[0.78rem] font-600 transition-colors ${
                mode === "receive" ? "bg-[var(--card)] shadow-[var(--shadow-sm)] text-[#0d9488]" : "text-[var(--muted-foreground)]"
              }`}
            >
              <PackageCheck size={14} />
              รับเข้าคลัง
            </button>
            <button
              onClick={() => setMode("reject")}
              className={`flex items-center justify-center gap-1.5 h-9 rounded-lg text-[0.78rem] font-600 transition-colors ${
                mode === "reject" ? "bg-[var(--card)] shadow-[var(--shadow-sm)] text-red-600" : "text-[var(--muted-foreground)]"
              }`}
            >
              <X size={14} />
              ปฏิเสธทั้งใบ
            </button>
          </div>

          {mode === "receive" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.78rem] font-500 mb-1.5">จำนวนที่ลูกค้าขอคืน</label>
                  <div className="h-9 px-3 flex items-center rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[0.82rem] font-600">
                    {rec.qty} ชิ้น
                  </div>
                </div>
                <div>
                  <label className="block text-[0.78rem] font-500 mb-1.5">
                    จำนวนที่รับเข้าจริง <span className="text-[var(--muted-foreground)] font-400">(1–{rec.qty})</span>
                  </label>
                  <input
                    type="number" min={1} max={rec.qty}
                    value={qty}
                    onChange={e => setQty(Math.max(0, Math.min(rec.qty, Number(e.target.value))))}
                    className="w-full h-9 px-3 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]"
                  />
                </div>
              </div>

              {partial && (
                <>
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[0.74rem] text-amber-700">
                    <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                    <span>รับเข้าจริง {qty}/{rec.qty} ชิ้น — เซลล์จะออก Credit Note ตามจำนวนที่รับจริงเท่านั้น ({formatCurrency(unitPrice * qty)})</span>
                  </div>

                  {/* เหตุผลที่รับไม่ครบ — ปุ่มเลือก + กรอกเอง */}
                  <div>
                    <label className="block text-[0.78rem] font-500 mb-1.5">
                      เหตุผลที่รับไม่ครบ <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SHORTFALL_REASONS.map((rsn) => {
                        const active = !showCustom && reason === rsn;
                        return (
                          <button
                            key={rsn}
                            onClick={() => { setShowCustom(false); setReason(rsn); }}
                            className={`px-3 h-8 rounded-full text-[0.76rem] font-500 border transition-colors ${
                              active
                                ? "bg-[var(--accent)] border-[var(--primary)] text-[var(--primary)]"
                                : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                            }`}
                          >
                            {rsn}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => { setShowCustom(true); setReason(""); }}
                        className={`flex items-center gap-1 px-3 h-8 rounded-full text-[0.76rem] font-500 border transition-colors ${
                          showCustom
                            ? "bg-[var(--accent)] border-[var(--primary)] text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                        }`}
                      >
                        <Plus size={12} />
                        อื่น ๆ
                      </button>
                    </div>
                    {showCustom && (
                      <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="ระบุเหตุผลที่รับไม่ครบ..."
                        rows={2}
                        autoFocus
                        className="mt-2 w-full px-3 py-2 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] resize-none"
                      />
                    )}
                  </div>
                </>
              )}

              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[var(--accent)] text-[0.8rem]">
                <span className="text-[var(--muted-foreground)]">ยอด Credit Note ที่เซลล์จะออก</span>
                <span className="font-700" style={{ color: "var(--primary)" }}>{formatCurrency(unitPrice * qty)}</span>
              </div>

              <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-[0.72rem] text-blue-700">
                <Info size={13} className="mt-0.5 flex-shrink-0" />
                <span>หลังยืนยัน จะส่งให้ <strong>ผู้บริหารอนุมัติปรับยอดสต๊อก</strong> ก่อน ระบบจึงปลดให้เซลล์ออก Credit Note</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-[0.74rem] text-red-700">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                <span>ปฏิเสธรับคืนทั้งใบ ({rec.qty} ชิ้น) — <strong>ไม่ปรับยอดสต๊อก และไม่ออก Credit Note</strong> ระบบจะแจ้งกลับเซลล์พร้อมเหตุผล</span>
              </div>

              {/* เหตุผลที่ปฏิเสธ — ปุ่มเลือก + กรอกเอง */}
              <div>
                <label className="block text-[0.78rem] font-500 mb-1.5">
                  เหตุผลที่ปฏิเสธรับคืน <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {REJECT_REASONS.map((rsn) => {
                    const active = !rejCustom && rejReason === rsn;
                    return (
                      <button
                        key={rsn}
                        onClick={() => { setRejCustom(false); setRejReason(rsn); }}
                        className={`px-3 h-8 rounded-full text-[0.76rem] font-500 border transition-colors ${
                          active
                            ? "bg-red-50 border-red-300 text-red-600"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                        }`}
                      >
                        {rsn}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => { setRejCustom(true); setRejReason(""); }}
                    className={`flex items-center gap-1 px-3 h-8 rounded-full text-[0.76rem] font-500 border transition-colors ${
                      rejCustom
                        ? "bg-red-50 border-red-300 text-red-600"
                        : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    <Plus size={12} />
                    อื่น ๆ
                  </button>
                </div>
                {rejCustom && (
                  <textarea
                    value={rejReason}
                    onChange={e => setRejReason(e.target.value)}
                    placeholder="ระบุเหตุผลที่ปฏิเสธรับคืน..."
                    rows={2}
                    autoFocus
                    className="mt-2 w-full px-3 py-2 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] resize-none"
                  />
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-[0.82rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
            ยกเลิก
          </button>
          {mode === "receive" ? (
            <button
              onClick={() => onReceive(qty, partial ? reason : undefined)}
              disabled={receiveInvalid}
              className="flex items-center gap-1.5 px-5 h-9 rounded-lg text-[0.82rem] font-600 text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#0d9488" }}
            >
              <PackageCheck size={14} />
              ยืนยันรับเข้าคลัง
            </button>
          ) : (
            <button
              onClick={() => onReject(rejReason)}
              disabled={rejectInvalid}
              className="flex items-center gap-1.5 px-5 h-9 rounded-lg text-[0.82rem] font-600 text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600"
            >
              <X size={14} />
              ยืนยันปฏิเสธรับคืน
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdjustApprovalModal({
  rec, onClose, onConfirm,
}: {
  rec: ReturnRec;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { products } = useErpStore();
  const received = rec.receivedQty ?? 0;
  const partial = received < rec.qty;
  const prod = products.find(p => p.name === rec.product);
  const currentStock = prod?.stock ?? 0;
  const newStock = currentStock + received;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--card)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-700 text-base">อนุมัติปรับยอดสต๊อก</h2>
            <p className="text-[0.72rem] text-[var(--muted-foreground)]">ผู้บริหารอนุมัติรับคืนเข้าคลัง + ลง Movement Log</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[0.78rem]">
            <div>
              <div className="text-[var(--muted-foreground)] text-[0.7rem] mb-0.5">เลขคืน</div>
              <div className="font-mono text-[0.73rem] font-500" style={{ color: "var(--primary)" }}>{rec.id}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[var(--muted-foreground)] text-[0.7rem] mb-0.5">สินค้า</div>
              <div className="font-500 truncate">{rec.product}</div>
            </div>
          </div>

          {/* ผลตรวจรับจากสต๊อก */}
          <div className="grid grid-cols-2 gap-3 text-[0.8rem]">
            <div className="p-3 rounded-lg border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)] text-[0.7rem] mb-0.5">สต๊อกรับเข้าจริง</div>
              <div className="font-700">
                <span className={partial ? "text-amber-600" : "text-green-600"}>{received}</span>
                <span className="text-[var(--muted-foreground)] font-400"> / {rec.qty} ชิ้น</span>
              </div>
              {partial && rec.shortfallReason && (
                <div className="text-[0.66rem] text-amber-600 mt-0.5">รับไม่ครบ: {rec.shortfallReason}</div>
              )}
            </div>
            <div className="p-3 rounded-lg border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)] text-[0.7rem] mb-0.5">ปรับยอดสต๊อก</div>
              <div className="font-700 flex items-center gap-1.5">
                <span className="text-[var(--muted-foreground)]">{formatNumber(currentStock)}</span>
                <ChevronRight size={12} className="text-[var(--muted-foreground)]" />
                <span className="text-green-600">{formatNumber(newStock)}</span>
                <span className="text-[0.7rem] text-green-600 font-500">(+{received})</span>
              </div>
            </div>
          </div>

          {/* Movement Log ที่จะถูกบันทึก */}
          <div className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[0.74rem]">
            <div className="flex items-center gap-1.5 text-[var(--muted-foreground)] mb-1">
              <History size={12} />
              <span className="font-500">Movement Log ที่จะถูกบันทึก</span>
            </div>
            <div className="font-mono text-[0.72rem]">
              <span className="text-green-600 font-600">รับคืน +{received}</span> · อ้างอิง {rec.id} · ผู้บริหารอนุมัติ
            </div>
          </div>

          <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-[0.72rem] text-blue-700">
            <Info size={13} className="mt-0.5 flex-shrink-0" />
            <span>เมื่ออนุมัติ ระบบจะ Commit ยอดสต๊อก + ลง Movement Log แล้วปลดให้ <strong>เซลล์ออก Credit Note</strong> ตามจำนวนรับจริง</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-[0.82rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-5 h-9 rounded-lg text-[0.82rem] font-600 text-white transition-colors hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            <CheckCircle2 size={14} />
            อนุมัติปรับสต๊อก
          </button>
        </div>
      </div>
    </div>
  );
}

function MovementLogTable({ search }: { search: string }) {
  const { movements } = useErpStore();
  const typeColor: Record<string, string> = { in: "success", out: "error", adjust: "warning", return: "info" };
  const typeLabel: Record<string, string> = { in: "รับเข้า", out: "ตัดออก", adjust: "ปรับยอด", return: "รับคืน" };
  const data = movements.filter(m =>
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

function AvgCostReport({ search, canSeeCost }: { search: string; canSeeCost: boolean }) {
  const { products, suppliers } = useErpStore();
  const data = products.filter(p => p.name.includes(search) || p.sku.includes(search));
  const totalValue = data.reduce((s, p) => s + p.avgCost * p.stock, 0);
  const totalStock = data.reduce((s, p) => s + p.stock, 0);

  if (!canSeeCost) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[0.82rem] text-[var(--muted-foreground)]">
        <Eye size={32} className="mb-3 opacity-30" />
        <p>คุณไม่มีสิทธิ์ดูข้อมูลต้นทุน</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary KPIs */}
      <div className="px-4 py-3 border-b border-[var(--border)] grid grid-cols-3 gap-4 bg-[var(--muted)]">
        <div>
          <div className="text-[0.68rem] text-[var(--muted-foreground)] mb-0.5">มูลค่าสินค้าคงคลัง (ราคาทุน)</div>
          <div className="text-[1.1rem] font-700" style={{ color: "var(--primary)" }}>{formatCurrency(totalValue)}</div>
        </div>
        <div>
          <div className="text-[0.68rem] text-[var(--muted-foreground)] mb-0.5">จำนวน SKU ทั้งหมด</div>
          <div className="text-[1.1rem] font-700">{data.length} รายการ</div>
        </div>
        <div>
          <div className="text-[0.68rem] text-[var(--muted-foreground)] mb-0.5">จำนวนสต็อกรวม</div>
          <div className="text-[1.1rem] font-700">{formatNumber(totalStock)} ชิ้น</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[0.82rem]">
          <thead style={{ background: "var(--muted)" }}>
            <tr>
              {["SKU", "ชื่อสินค้า", "หมวด", "Supplier", "Avg Cost", "Floor Price", "คงเหลือ", "มูลค่าคงคลัง", "% Margin (Tier1)"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((p) => {
              const inventoryValue = p.avgCost * p.stock;
              const margin = p.price1 > 0 ? Math.round(((p.price1 - p.avgCost) / p.price1) * 100) : 0;
              const supplier = suppliers.find(s => s.id === p.supplier);
              return (
                <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                  <td className="px-4 py-3 font-mono text-[0.72rem] font-500" style={{ color: "var(--primary)" }}>{p.sku}</td>
                  <td className="px-4 py-3 font-500">{p.name}</td>
                  <td className="px-4 py-3"><Badge variant="secondary">{p.category}</Badge></td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] text-[0.75rem]">{supplier?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-600" style={{ color: "#7c3aed" }}>{formatCurrency(p.avgCost)}</td>
                  <td className="px-4 py-3 text-red-600 font-500">{formatCurrency(Math.round(p.avgCost * 1.05))}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= p.reorderPoint ? "text-red-600 font-600" : "font-500"}>{formatNumber(p.stock)}</span>
                    {p.stock <= p.reorderPoint && <span className="ml-1 text-[0.65rem] text-red-500">⚠ ต่ำ</span>}
                  </td>
                  <td className="px-4 py-3 font-700">{formatCurrency(inventoryValue)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)]">
                        <div className="h-1.5 rounded-full bg-green-400" style={{ width: `${Math.min(margin, 100)}%` }} />
                      </div>
                      <span className="text-[0.75rem] font-500 text-green-600 min-w-[32px]">{margin}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── โมดอลฟอร์มกลาง + ฟิลด์ ───────────────────────── */
const inputCls = "w-full h-9 px-3 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] bg-[var(--card)]";

function FormModal({
  title, subtitle, onClose, onSubmit, submitLabel, disabled, children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--card)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-700 text-base">{title}</h2>
            {subtitle && <p className="text-[0.72rem] text-[var(--muted-foreground)]">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-3.5 overflow-y-auto">{children}</div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-[0.82rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">ยกเลิก</button>
          <button
            onClick={onSubmit}
            disabled={disabled}
            className="flex items-center gap-1.5 px-5 h-9 rounded-lg text-[0.82rem] font-600 text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--primary)" }}
          >
            <Plus size={14} />{submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.78rem] font-500 mb-1.5">{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
    </div>
  );
}

const OTHER_REASON = "อื่น ๆ";
// เหตุผลรับเข้าไม่ครบจำนวน (GR) — เป็นตัวเลือก + "อื่น ๆ" กรอกเอง
const GR_SHORTFALL_REASONS = [
  "ผู้ขายส่งมาไม่ครบจำนวน",
  "สินค้าชำรุด/เสียหายระหว่างขนส่ง",
  "สินค้าบางส่วนไม่ผ่าน QC",
  "ผู้ขายของไม่พอ (ทยอยส่ง)",
];
// เหตุผลปรับยอดสต๊อก — เป็นตัวเลือก + "อื่น ๆ" กรอกเอง
const ADJUST_REASONS = [
  "ตรวจนับประจำงวด พบส่วนต่าง",
  "สินค้าชำรุด/เสื่อมสภาพ",
  "สูญหาย/หยิบผิด",
  "บันทึกรับเข้า/ตัดออกคลาดเคลื่อน",
];

// ตัวเลือกเหตุผล + ช่อง "อื่น ๆ" — คืนค่าเหตุผลที่ใช้จริงผ่าน onChange
function ReasonPicker({
  options, value, onChange, placeholder = "ระบุเหตุผล...",
}: {
  options: string[]; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  // ถ้า value ไม่ตรงกับตัวเลือกใด (และไม่ว่าง) ถือว่าเป็น "อื่น ๆ"
  const isPreset = options.includes(value);
  const [mode, setMode] = useState<string>(value === "" ? options[0] : isPreset ? value : OTHER_REASON);
  const [other, setOther] = useState<string>(isPreset || value === "" ? "" : value);

  function pick(sel: string) {
    setMode(sel);
    onChange(sel === OTHER_REASON ? other : sel);
  }
  function typeOther(v: string) {
    setOther(v);
    onChange(v);
  }

  return (
    <div className="space-y-2">
      <select className={inputCls} value={mode} onChange={e => pick(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        <option value={OTHER_REASON}>{OTHER_REASON}</option>
      </select>
      {mode === OTHER_REASON && (
        <input className={inputCls} value={other} onChange={e => typeOther(e.target.value)} placeholder={placeholder} autoFocus />
      )}
    </div>
  );
}

const PRODUCT_CATEGORIES = ["แผงโซลล่าเซลล์", "อินเวอร์เตอร์", "แบตเตอรี่", "โครงสร้าง", "สายไฟ"];

/* ── เพิ่มสินค้า ── */
function AddProductModal({ suppliers, onClose, onSubmit }: {
  suppliers: Supplier[];
  onClose: () => void;
  onSubmit: (p: { sku: string; name: string; category: string; avgCost: number; price1: number; price2: number; price3: number; price4: number; stock: number; reorderPoint: number; reorderQty: number; supplier: string }) => void;
}) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [supplier, setSupplier] = useState(suppliers[0]?.id ?? "");
  const [avgCost, setAvgCost] = useState(0);
  const [price1, setPrice1] = useState(0);
  const [stock, setStock] = useState(0);
  const [reorderPoint, setReorderPoint] = useState(0);
  const [reorderQty, setReorderQty] = useState(0);
  const invalid = !sku.trim() || !name.trim() || price1 <= 0;

  return (
    <FormModal
      title="เพิ่มสินค้าใหม่" subtitle="เพิ่มรายการสินค้าเข้าระบบคลัง"
      onClose={onClose} submitLabel="เพิ่มสินค้า" disabled={invalid}
      onSubmit={() => onSubmit({
        sku, name, category, supplier, stock, reorderPoint, reorderQty, avgCost,
        price1, price2: Math.round(price1 * 0.95), price3: Math.round(price1 * 0.9), price4: Math.round(price1 * 0.85),
      })}
    >
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="SKU" required><input className={inputCls} value={sku} onChange={e => setSku(e.target.value)} placeholder="เช่น SC-MON-450W" /></Field>
        <Field label="หมวดหมู่" required>
          <select className={inputCls} value={category} onChange={e => setCategory(e.target.value)}>
            {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="ชื่อสินค้า" required><input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="เช่น แผงโซลาร์ Mono 450W" /></Field>
      <Field label="Supplier">
        <select className={inputCls} value={supplier} onChange={e => setSupplier(e.target.value)}>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="ต้นทุนเฉลี่ย (Avg Cost)"><input type="number" min={0} className={inputCls} value={avgCost} onChange={e => setAvgCost(Number(e.target.value))} /></Field>
        <Field label="ราคาขาย Tier 1" required><input type="number" min={0} className={inputCls} value={price1} onChange={e => setPrice1(Number(e.target.value))} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3.5">
        <Field label="สต็อกเริ่มต้น"><input type="number" min={0} className={inputCls} value={stock} onChange={e => setStock(Number(e.target.value))} /></Field>
        <Field label="Reorder Point"><input type="number" min={0} className={inputCls} value={reorderPoint} onChange={e => setReorderPoint(Number(e.target.value))} /></Field>
        <Field label="Reorder Qty"><input type="number" min={0} className={inputCls} value={reorderQty} onChange={e => setReorderQty(Number(e.target.value))} /></Field>
      </div>
    </FormModal>
  );
}

/* ── เพิ่มผู้ขาย ── */
function AddSupplierModal({ onClose, onSubmit, supplier }: {
  onClose: () => void;
  supplier?: Supplier;
  onSubmit: (s: { name: string; contact: string; phone: string; email: string; paymentTerm: string; taxId: string; bank: string }) => void;
}) {
  const [name, setName] = useState(supplier?.name ?? "");
  const [contact, setContact] = useState(supplier?.contact ?? "");
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [email, setEmail] = useState(supplier?.email ?? "");
  const [paymentTerm, setPaymentTerm] = useState(supplier?.paymentTerm ?? "30 วัน");
  const [taxId, setTaxId] = useState(supplier?.taxId ?? "");
  const [bank, setBank] = useState(supplier?.bank ?? "");
  const invalid = !name.trim() || !contact.trim() || !phone.trim();
  const editing = !!supplier;

  return (
    <FormModal
      title={editing ? "แก้ไขข้อมูลผู้ขาย" : "เพิ่มผู้ขาย (Supplier)"}
      subtitle={editing ? supplier!.name : "เพิ่มข้อมูลผู้ขายและเงื่อนไขการชำระเงิน"}
      onClose={onClose} submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มผู้ขาย"} disabled={invalid}
      onSubmit={() => onSubmit({ name, contact, phone, email, paymentTerm, taxId, bank })}
    >
      <Field label="ชื่อบริษัท" required><input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="เช่น บริษัท โซลาร์ไทย จำกัด" /></Field>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="ผู้ติดต่อ" required><input className={inputCls} value={contact} onChange={e => setContact(e.target.value)} /></Field>
        <Field label="เบอร์โทร" required><input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} /></Field>
      </div>
      <Field label="อีเมล"><input className={inputCls} value={email} onChange={e => setEmail(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="เงื่อนไขชำระ">
          <select className={inputCls} value={paymentTerm} onChange={e => setPaymentTerm(e.target.value)}>
            {["15 วัน", "30 วัน", "45 วัน", "60 วัน"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="เลขนิติบุคคล"><input className={inputCls} value={taxId} onChange={e => setTaxId(e.target.value)} /></Field>
      </div>
      <Field label="บัญชีธนาคาร"><input className={inputCls} value={bank} onChange={e => setBank(e.target.value)} placeholder="เช่น กสิกรไทย 123-4-56789-0" /></Field>
    </FormModal>
  );
}

/* ── สร้าง Purchase Order ── */
function CreatePOModal({ suppliers, products, onClose, onSubmit }: {
  suppliers: Supplier[];
  products: Product[];
  onClose: () => void;
  onSubmit: (po: { supplierId: string; product: string; qty: number; unitCost: number }) => void;
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [product, setProduct] = useState(products[0]?.name ?? "");
  const [qty, setQty] = useState(0);
  const [unitCost, setUnitCost] = useState(products[0]?.avgCost ?? 0);
  const invalid = !supplierId || !product || qty <= 0 || unitCost <= 0;

  function pickProduct(name: string) {
    setProduct(name);
    const p = products.find(x => x.name === name);
    if (p) setUnitCost(p.avgCost);
  }

  return (
    <FormModal
      title="สร้างใบสั่งซื้อ (PO)" subtitle="สั่งซื้อสินค้าจากผู้ขาย"
      onClose={onClose} submitLabel="สร้าง PO" disabled={invalid}
      onSubmit={() => onSubmit({ supplierId, product, qty, unitCost })}
    >
      <Field label="ผู้ขาย" required>
        <select className={inputCls} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field label="สินค้า" required>
        <select className={inputCls} value={product} onChange={e => pickProduct(e.target.value)}>
          {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="จำนวน" required><input type="number" min={0} className={inputCls} value={qty} onChange={e => setQty(Number(e.target.value))} /></Field>
        <Field label="ราคาต่อหน่วย" required><input type="number" min={0} className={inputCls} value={unitCost} onChange={e => setUnitCost(Number(e.target.value))} /></Field>
      </div>
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[var(--accent)] text-[0.8rem]">
        <span className="text-[var(--muted-foreground)]">มูลค่ารวม</span>
        <span className="font-700" style={{ color: "var(--primary)" }}>{formatCurrency(qty * unitCost)}</span>
      </div>
    </FormModal>
  );
}

/* ── รับสินค้าตาม PO (GR) จากแท็บ Goods Receipt ── */
function CreateGRModal({ purchaseOrders, onClose, onSubmit }: {
  purchaseOrders: PurchaseOrder[];
  onClose: () => void;
  onSubmit: (g: { poId: string; product: string; orderedQty: number; receivedQty: number; shortfallReason?: string | null }) => void;
}) {
  const receivable = purchaseOrders.filter(p => ["pending", "approved", "partial"].includes(p.status));
  const [poId, setPoId] = useState(receivable[0]?.id ?? "");
  const po = receivable.find(p => p.id === poId);
  const ordered = po?.items[0]?.qty ?? 0;
  const [qty, setQty] = useState(ordered);
  const [reason, setReason] = useState(GR_SHORTFALL_REASONS[0]);
  const partial = qty < ordered;
  const invalid = !po || qty <= 0 || qty > ordered || (partial && !reason.trim());

  function pickPO(id: string) {
    setPoId(id);
    const p = receivable.find(x => x.id === id);
    setQty(p?.items[0]?.qty ?? 0);
  }

  if (receivable.length === 0) {
    return (
      <FormModal title="รับสินค้าเข้าคลัง (GR)" onClose={onClose} submitLabel="ปิด" disabled onSubmit={onClose}>
        <div className="py-6 text-center text-[0.82rem] text-[var(--muted-foreground)]">ไม่มี PO ที่รอรับเข้าในขณะนี้</div>
      </FormModal>
    );
  }

  return (
    <FormModal
      title="รับสินค้าเข้าคลัง (GR)" subtitle="เลือก PO ที่จะรับเข้า + ระบุจำนวนจริง"
      onClose={onClose} submitLabel="ยืนยันรับเข้าคลัง" disabled={invalid}
      onSubmit={() => po && onSubmit({ poId: po.id, product: po.items[0].product, orderedQty: ordered, receivedQty: qty, shortfallReason: partial ? reason : null })}
    >
      <Field label="เลือก PO" required>
        <select className={inputCls} value={poId} onChange={e => pickPO(e.target.value)}>
          {receivable.map(p => <option key={p.id} value={p.id}>{p.id} · {p.items[0]?.product} ({p.items[0]?.qty})</option>)}
        </select>
      </Field>
      <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[0.8rem]">
        <div className="text-[var(--muted-foreground)] text-[0.7rem] mb-0.5">สินค้า · ผู้ขาย</div>
        <div className="font-500">{po?.items[0]?.product} · {po?.supplierName}</div>
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label="จำนวนที่สั่ง"><div className="h-9 px-3 flex items-center rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[0.82rem] font-600">{ordered} ชิ้น</div></Field>
        <Field label="รับเข้าจริง" required><input type="number" min={0} max={ordered} className={inputCls} value={qty} onChange={e => setQty(Math.max(0, Math.min(ordered, Number(e.target.value))))} /></Field>
      </div>
      {partial && (
        <Field label={`เหตุผลที่รับไม่ครบ (${qty}/${ordered} ชิ้น)`} required>
          <ReasonPicker options={GR_SHORTFALL_REASONS} value={reason} onChange={setReason} placeholder="ระบุเหตุผลที่รับเข้าไม่ครบ..." />
        </Field>
      )}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-[0.72rem] text-green-700">
        <Info size={13} className="mt-0.5 flex-shrink-0" />
        <span>ยืนยันแล้ว ระบบจะ <strong>+{qty} เข้าสต๊อก</strong> และลง Movement Log อัตโนมัติ</span>
      </div>
    </FormModal>
  );
}

/* ── สร้างใบปรับยอดสต๊อก ── */
function CreateAdjustmentModal({ products, onClose, onSubmit }: {
  products: Product[];
  onClose: () => void;
  onSubmit: (a: { product: string; sku: string; actualQty: number; reason: string }) => void;
}) {
  const [sku, setSku] = useState(products[0]?.sku ?? "");
  const prod = products.find(p => p.sku === sku);
  const systemQty = prod?.stock ?? 0;
  const [actualQty, setActualQty] = useState(systemQty);
  const [reason, setReason] = useState(ADJUST_REASONS[0]);
  const diff = actualQty - systemQty;
  const invalid = !prod || !reason.trim() || diff === 0;

  function pickSku(s: string) {
    setSku(s);
    const p = products.find(x => x.sku === s);
    setActualQty(p?.stock ?? 0);
  }

  return (
    <FormModal
      title="ปรับยอดสต๊อก" subtitle="ตรวจนับและบันทึกส่วนต่าง (ส่งผู้บริหารอนุมัติ)"
      onClose={onClose} submitLabel="ส่งขออนุมัติ" disabled={invalid}
      onSubmit={() => prod && onSubmit({ product: prod.name, sku, actualQty, reason })}
    >
      <Field label="สินค้า" required>
        <select className={inputCls} value={sku} onChange={e => pickSku(e.target.value)}>
          {products.map(p => <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-3.5">
        <Field label="ยอดในระบบ"><div className="h-9 px-3 flex items-center rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[0.82rem] font-600">{formatNumber(systemQty)}</div></Field>
        <Field label="นับจริง" required><input type="number" min={0} className={inputCls} value={actualQty} onChange={e => setActualQty(Number(e.target.value))} /></Field>
        <Field label="ส่วนต่าง">
          <div className="h-9 px-3 flex items-center rounded-lg border border-[var(--border)] text-[0.82rem] font-700">
            <span className={diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-[var(--muted-foreground)]"}>{diff > 0 ? "+" : ""}{diff}</span>
          </div>
        </Field>
      </div>
      <Field label="เหตุผล" required>
        <ReasonPicker options={ADJUST_REASONS} value={reason} onChange={setReason} placeholder="ระบุเหตุผลการปรับยอด..." />
      </Field>
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[0.72rem] text-amber-700">
        <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
        <span>ใบปรับยอดต้องผ่าน <strong>การอนุมัติของผู้บริหาร</strong> ก่อน ระบบจึง commit ยอด + ลง Movement Log</span>
      </div>
    </FormModal>
  );
}

/* ── บันทึกคำขอคืนสินค้า (จากแท็บ Return Inspection) ── */
function CreateReturnRequestModal({ salesOrders, onClose, onSubmit }: {
  salesOrders: SalesOrder[];
  onClose: () => void;
  onSubmit: (r: { soId: string; customer: string; product: string; qty: number; value: number; reason: string; by: string; returnDays: number }) => void;
}) {
  const eligible = salesOrders.filter(o => o.status === "closed");
  const [soId, setSoId] = useState(eligible[0]?.id ?? "");
  const so = eligible.find(o => o.id === soId);
  const [itemIdx, setItemIdx] = useState(0);
  const item = so?.items[itemIdx];
  const [qty, setQty] = useState(1);
  const [returnDays, setReturnDays] = useState(5);
  const [reason, setReason] = useState("");
  const maxQty = item?.qty ?? 1;
  const value = (item?.unitPrice ?? 0) * qty;
  const invalid = !so || !item || qty <= 0 || qty > maxQty || !reason.trim();

  function pickSO(id: string) {
    setSoId(id);
    setItemIdx(0);
    setQty(1);
  }

  if (eligible.length === 0) {
    return (
      <FormModal title="บันทึกคำขอคืนสินค้า" onClose={onClose} submitLabel="ปิด" disabled onSubmit={onClose}>
        <div className="py-6 text-center text-[0.82rem] text-[var(--muted-foreground)]">ไม่มีใบสั่งขายที่ปิดการขายให้คืนได้</div>
      </FormModal>
    );
  }

  return (
    <FormModal
      title="บันทึกคำขอคืนสินค้า" subtitle="สร้างใบขอคืน → ส่งให้สต๊อกรับของ"
      onClose={onClose} submitLabel="บันทึกคำขอคืน" disabled={invalid}
      onSubmit={() => so && item && onSubmit({ soId: so.id, customer: so.customer, product: item.name, qty, value, reason, by: so.salesBy, returnDays })}
    >
      <Field label="อ้างอิงใบสั่งขาย" required>
        <select className={inputCls} value={soId} onChange={e => pickSO(e.target.value)}>
          {eligible.map(o => <option key={o.id} value={o.id}>{o.id} · {o.customer}</option>)}
        </select>
      </Field>
      <Field label="สินค้าที่คืน" required>
        <select className={inputCls} value={itemIdx} onChange={e => { setItemIdx(Number(e.target.value)); setQty(1); }}>
          {so?.items.map((it, i) => <option key={i} value={i}>{it.name} (ขายไป {it.qty})</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3.5">
        <Field label={`จำนวนที่คืน (1–${maxQty})`} required><input type="number" min={1} max={maxQty} className={inputCls} value={qty} onChange={e => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value))))} /></Field>
        <Field label="คืนภายในกี่วัน"><input type="number" min={0} className={inputCls} value={returnDays} onChange={e => setReturnDays(Number(e.target.value))} /></Field>
      </div>
      <Field label="เหตุผลการคืน" required>
        <textarea rows={2} className="w-full px-3 py-2 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] resize-none bg-[var(--card)]" value={reason} onChange={e => setReason(e.target.value)} placeholder="เช่น ลูกค้าสั่งเกิน / สินค้าไม่ตรงสเปค" />
      </Field>
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[var(--accent)] text-[0.8rem]">
        <span className="text-[var(--muted-foreground)]">มูลค่าที่ขอคืน</span>
        <span className="font-700" style={{ color: "var(--primary)" }}>{formatCurrency(value)}</span>
      </div>
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-[0.72rem] text-blue-700">
        <Info size={13} className="mt-0.5 flex-shrink-0" />
        <span>{returnDays <= 30 ? "อยู่ในระยะเวลาคืน — ส่งให้แผนกสต๊อกรับของไปตรวจสอบ" : "เกินระยะเวลาคืน (30 วัน) — ต้องขออนุมัติพิเศษ"}</span>
      </div>
    </FormModal>
  );
}
