"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Badge, statusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  mockCustomers, mockSalesOrders, mockCommissions, mockPromotions, mockProducts,
  mockTierPricing, tierMeta, mockCreditNotes,
} from "@/lib/mock-data";
import { useRole } from "@/components/layout/role-context";
import { Users, ShoppingCart, DollarSign, Tag, Plus, Search, X, ChevronDown, Trash2, Layers, FileMinus, Info } from "lucide-react";

type Tab = "customers" | "orders" | "pricing" | "commission" | "promotions" | "creditnote";

interface SOItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  dept: string;
}

export default function SalesPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [search, setSearch] = useState("");
  const [showCreateSO, setShowCreateSO] = useState(false);
  const [orders, setOrders] = useState(mockSalesOrders.map(o => ({ ...o })));
  const { config } = useRole();
  // เซลส์เห็นเฉพาะข้อมูลของตัวเอง (Row-Level Security)
  const ownScope = config.perms.commissionScope === "own";
  const ownName = config.user.name;
  const canSell = config.perms.canSell;
  // บัญชีเข้ามาดูได้แต่แก้ไม่ได้ (read-only viewer)
  const readOnlyViewer = !canSell && !ownScope;

  // ปุ่ม "สร้าง/เพิ่ม" เฉพาะแท็บที่สร้างเองได้ — Commission & Credit Note ระบบ gen อัตโนมัติ จึงไม่มีปุ่ม
  const createLabel: Partial<Record<Tab, string>> = {
    orders: "สร้างใบสั่งขาย",
    customers: "เพิ่มลูกค้า",
    pricing: "แก้ราคา Tier",
    promotions: "เพิ่มโปรโมชั่น",
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "orders", label: "ใบสั่งขาย", icon: ShoppingCart },
    { key: "customers", label: "ลูกค้า", icon: Users },
    { key: "pricing", label: "Tier Pricing", icon: Layers },
    { key: "commission", label: "Commission & KPI", icon: DollarSign },
    { key: "promotions", label: "โปรโมชั่น", icon: Tag },
    { key: "creditnote", label: "Credit Note", icon: FileMinus },
  ];

  return (
    <>
      <Topbar title="Sales & Marketing" subtitle="จัดการการขาย ลูกค้า คอมมิชชั่น และโปรโมชั่น" />
      <div className="p-6">
        {ownScope && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-blue-200 bg-blue-50 mb-4 text-[0.8rem]">
            <Info size={14} className="text-blue-500 flex-shrink-0" />
            <span className="text-blue-700">
              คุณกำลังดูในมุมมอง <span className="font-600">เซลส์</span> — เห็นเฉพาะลูกค้า ใบสั่งขาย และคอมมิชชั่นของ <span className="font-600">{ownName}</span> เท่านั้น
            </span>
          </div>
        )}
        {readOnlyViewer && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-violet-200 bg-violet-50 mb-4 text-[0.8rem]">
            <Info size={14} className="text-violet-500 flex-shrink-0" />
            <span className="text-violet-700">
              มุมมอง <span className="font-600">บัญชี</span> — ดูข้อมูลการขาย คอมมิชชั่น และ Credit Note ได้ทุกคน (โหมดดูอย่างเดียว)
            </span>
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="flex gap-1 p-1 rounded-lg overflow-x-auto" style={{ background: "var(--muted)" }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
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
            {!canSell ? (
              <span className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.78rem] font-500 text-[var(--muted-foreground)] border border-[var(--border)] whitespace-nowrap">
                ดูอย่างเดียว
              </span>
            ) : createLabel[tab] ? (
              <button
                onClick={() => { if (tab === "orders") setShowCreateSO(true); }}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.8rem] font-500 text-white transition-colors hover:opacity-90 whitespace-nowrap"
                style={{ background: "var(--primary)" }}
              >
                <Plus size={13} />
                {createLabel[tab]}
              </button>
            ) : null}
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
          {tab === "orders" && <SOTable orders={orders} search={search} ownScope={ownScope} ownName={ownName} />}
          {tab === "customers" && <CustomerTable search={search} ownScope={ownScope} ownName={ownName} />}
          {tab === "pricing" && <TierPricingTable search={search} />}
          {tab === "commission" && <CommissionTable search={search} ownScope={ownScope} ownName={ownName} />}
          {tab === "promotions" && <PromotionTable search={search} />}
          {tab === "creditnote" && <CreditNoteTable search={search} />}
        </div>
      </div>

      {showCreateSO && (
        <CreateSOModal
          onClose={() => setShowCreateSO(false)}
          myName={ownName}
          onSubmit={(newSO) => setOrders(prev => [newSO, ...prev])}
        />
      )}
    </>
  );
}

/* ── Create SO Modal ─────────────────────────────── */
function CreateSOModal({ onClose, onSubmit, myName }: { onClose: () => void; onSubmit: (so: typeof mockSalesOrders[0]) => void; myName: string }) {
  const [customerId, setCustomerId] = useState(mockCustomers[0].id);
  const [items, setItems] = useState<SOItem[]>([
    { productId: mockProducts[0].id, name: mockProducts[0].name, qty: 1, unitPrice: mockProducts[0].price3, dept: mockProducts[0].category },
  ]);

  const customer = mockCustomers.find(c => c.id === customerId)!;
  const tierPriceKey = customer.tier === "Founder" ? "price4" : customer.tier === "Dealer" ? "price3" : customer.tier === "ผู้รับเหมา" ? "price2" : "price1";

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const vat = Math.round(subtotal * 0.07);
  const total = subtotal + vat;

  function addItem() {
    const p = mockProducts[0];
    setItems(prev => [...prev, {
      productId: p.id, name: p.name, qty: 1,
      unitPrice: (p as any)[tierPriceKey], dept: p.category,
    }]);
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit() {
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const newId = `SO${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}`;
    onSubmit({
      id: newId,
      customer: customer.name,
      tier: customer.tier,
      subtotal,
      discount: 0,
      vat,
      total,
      salesBy: myName,
      date: dateStr,
      invoicePushed: false,
      status: "pending",
    } as typeof mockSalesOrders[0]);
    onClose();
  }

  function updateProduct(idx: number, productId: string) {
    const p = mockProducts.find(p => p.id === productId)!;
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, productId, name: p.name, unitPrice: (p as any)[tierPriceKey], dept: p.category } : item
    ));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[var(--card)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-700 text-base">สร้างใบสั่งขาย</h2>
            <p className="text-[0.72rem] text-[var(--muted-foreground)]">ระบบดึงราคา Tier และโปรโมชั่น Active อัตโนมัติ</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Customer select */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.78rem] font-500 mb-1.5">ลูกค้า</label>
              <div className="relative">
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] appearance-none bg-[var(--card)] cursor-pointer"
                >
                  {mockCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[0.78rem] font-500 mb-1.5">ข้อมูลลูกค้า</label>
              <div className="h-9 px-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]">
                <TierBadge tier={customer.tier} />
                <span className="text-[0.8rem] text-[var(--muted-foreground)]">{customer.salesOwner}</span>
              </div>
            </div>
          </div>

          {/* Promo notice */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[0.75rem]" style={{ background: "var(--accent)" }}>
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
            <span>โปรที่ Active: <strong>โปร Mid-Year Sale 5%</strong> สำหรับ Dealer · Tier Price ดึงอัตโนมัติ</span>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[0.78rem] font-500">รายการสินค้า</label>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-[0.72rem] font-500 px-2 py-1 rounded-lg hover:bg-[var(--muted)] transition-colors"
                style={{ color: "var(--primary)" }}
              >
                <Plus size={11} />
                เพิ่มรายการ
              </button>
            </div>
            <div className="border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[0.72rem] font-600 text-[var(--muted-foreground)]" style={{ background: "var(--muted)" }}>
                <div className="col-span-5">สินค้า</div>
                <div className="col-span-2 text-center">จำนวน</div>
                <div className="col-span-3 text-right">ราคา/ชิ้น</div>
                <div className="col-span-1 text-right">รวม</div>
                <div className="col-span-1" />
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-t border-[var(--border)] items-center">
                  <div className="col-span-5">
                    <div className="relative">
                      <select
                        value={item.productId}
                        onChange={e => updateProduct(idx, e.target.value)}
                        className="w-full h-8 pl-2 pr-6 text-[0.78rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] appearance-none bg-[var(--card)] cursor-pointer"
                      >
                        {mockProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
                    </div>
                    <div className="text-[0.68rem] text-[var(--muted-foreground)] mt-0.5 px-1">{item.dept}</div>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: Number(e.target.value) } : it))}
                      className="w-full h-8 px-2 text-center text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: Number(e.target.value) } : it))}
                      className="w-full h-8 px-2 text-right text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]"
                    />
                  </div>
                  <div className="col-span-1 text-right text-[0.78rem] font-500">
                    {(item.qty * item.unitPrice).toLocaleString()}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => removeItem(idx)} disabled={items.length === 1}>
                      <Trash2 size={13} className={items.length === 1 ? "text-[var(--border)]" : "text-[var(--muted-foreground)] hover:text-red-500 transition-colors"} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              <div className="flex justify-between px-4 py-2.5 text-[0.82rem]">
                <span className="text-[var(--muted-foreground)]">ยอดก่อน VAT</span>
                <span className="font-500">{subtotal.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-[0.82rem]">
                <span className="text-[var(--muted-foreground)]">VAT 7%</span>
                <span className="font-500">{vat.toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-[0.9rem] font-700" style={{ background: "var(--muted)" }}>
                <span>ยอดรวมทั้งสิ้น</span>
                <span style={{ color: "var(--primary)" }}>{total.toLocaleString()} ฿</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-[0.82rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
            ยกเลิก
          </button>
          <div className="flex gap-2">
            <button className="px-4 h-9 rounded-lg text-[0.82rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
              บันทึกเป็นร่าง
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 h-9 rounded-lg text-[0.82rem] font-600 text-white transition-colors hover:opacity-90"
              style={{ background: "var(--primary)" }}
            >
              ยืนยันและปิดการขาย
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tables ──────────────────────────────────────── */
function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    "Founder": "bg-purple-100 text-purple-700 border border-purple-300",
    "Dealer": "bg-blue-100 text-blue-700 border border-blue-300",
    "ผู้รับเหมา": "bg-amber-100 text-amber-700 border border-amber-300",
    "ทั่วไป": "bg-gray-100 text-gray-600 border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 h-5 text-[0.68rem] font-500 rounded-full ${colors[tier] ?? ""}`}>
      {tier}
    </span>
  );
}

function SOTable({ orders, search, ownScope, ownName }: { orders: typeof mockSalesOrders; search: string; ownScope?: boolean; ownName?: string }) {
  const data = orders
    .filter(o => !ownScope || o.salesBy === ownName)
    .filter(o => o.id.includes(search) || o.customer.includes(search));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {["เลข SO", "ลูกค้า", "Tier", "มูลค่า", "ส่วนลด", "VAT", "ยอดรวม", "เซลส์", "วันที่", "Invoice", "สถานะ"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((o) => (
            <tr key={o.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
              <td className="px-4 py-3 font-mono text-[0.75rem] font-500" style={{ color: "var(--primary)" }}>{o.id}</td>
              <td className="px-4 py-3 font-500 max-w-[160px] truncate">{o.customer}</td>
              <td className="px-4 py-3"><TierBadge tier={o.tier} /></td>
              <td className="px-4 py-3">{formatCurrency(o.subtotal)}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{o.discount > 0 ? formatCurrency(o.discount) : "—"}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{formatCurrency(o.vat)}</td>
              <td className="px-4 py-3 font-700">{formatCurrency(o.total)}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{o.salesBy}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">{o.date}</td>
              <td className="px-4 py-3">
                {o.invoicePushed
                  ? <Badge variant="success">ส่ง Peak แล้ว</Badge>
                  : <Badge variant="ghost">ยังไม่ส่ง</Badge>}
              </td>
              <td className="px-4 py-3">{statusBadge(o.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerTable({ search, ownScope, ownName }: { search: string; ownScope?: boolean; ownName?: string }) {
  const data = mockCustomers
    .filter(c => !ownScope || c.salesOwner === ownName)
    .filter(c => c.name.includes(search) || c.tier.includes(search));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {["ชื่อลูกค้า", "Tier", "ผู้ติดต่อ", "เบอร์โทร", "เซลส์เจ้าของ", "แผนกหลัก", "Total Orders", "Total Value", "สถานะ"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
              <td className="px-4 py-3 font-500">{c.name}</td>
              <td className="px-4 py-3"><TierBadge tier={c.tier} /></td>
              <td className="px-4 py-3">{c.contact}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{c.phone}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{c.salesOwner}</td>
              <td className="px-4 py-3">{c.dept}</td>
              <td className="px-4 py-3 font-500">{c.totalOrders}</td>
              <td className="px-4 py-3 font-600">{formatCurrency(c.totalValue)}</td>
              <td className="px-4 py-3">{statusBadge(c.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommissionTable({ search, ownScope, ownName }: { search: string; ownScope?: boolean; ownName?: string }) {
  const data = mockCommissions
    .filter(c => !ownScope || c.sales === ownName)
    .filter(c => c.sales.includes(search) || c.soId.includes(search));
  const confirmed = data.filter(c => c.status === "confirmed").reduce((s, c) => s + c.amount, 0);
  const pending = data.filter(c => c.status === "pending").reduce((s, c) => s + c.amount, 0);
  return (
    <div>
      <div className="px-4 py-3 border-b border-[var(--border)] flex gap-6 text-[0.8rem] bg-[var(--muted)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[var(--muted-foreground)]">Confirmed</span>
          <span className="font-700 text-green-600">{formatCurrency(confirmed)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[var(--muted-foreground)]">Pending</span>
          <span className="font-700 text-amber-600">{formatCurrency(pending)}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[0.82rem]">
          <thead style={{ background: "var(--muted)" }}>
            <tr>
              {["อ้างอิง SO", "เซลส์", "แผนก", "อัตรา", "คอมมิชชั่น", "วันที่", "สถานะ"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                <td className="px-4 py-3 font-mono text-[0.75rem]" style={{ color: "var(--primary)" }}>{c.soId}</td>
                <td className="px-4 py-3 font-500">{c.sales}</td>
                <td className="px-4 py-3"><Badge variant="secondary">{c.dept}</Badge></td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{c.rate}%</td>
                <td className="px-4 py-3 font-700">{formatCurrency(c.amount)}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{c.date}</td>
                <td className="px-4 py-3">{statusBadge(c.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TierPricingTable({ search }: { search: string }) {
  const data = mockTierPricing.filter(p => p.name.includes(search) || p.sku.includes(search));
  return (
    <div>
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)] flex flex-wrap items-center gap-3 text-[0.75rem]">
        <span className="text-[var(--muted-foreground)]">Tier Price เป็นราคาฐาน · Promotion ซ้อนเพิ่มได้ · ราคาสุดท้ายห้ามต่ำกว่า Floor Price</span>
        <div className="flex items-center gap-2 ml-auto">
          {tierMeta.map(t => (
            <span key={t.key} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: t.color }} />
              <span className="text-[var(--muted-foreground)]">{t.label}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[0.82rem]">
          <thead style={{ background: "var(--muted)" }}>
            <tr>
              <th className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">สินค้า</th>
              <th className="px-4 py-2.5 text-right font-600 text-[0.75rem] text-[var(--muted-foreground)]">ต้นทุนเฉลี่ย</th>
              <th className="px-4 py-2.5 text-right font-600 text-[0.75rem] text-red-500">Floor Price</th>
              {tierMeta.map(t => (
                <th key={t.key} className="px-4 py-2.5 text-right font-600 text-[0.75rem] whitespace-nowrap" style={{ color: t.color }}>{t.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.sku} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                <td className="px-4 py-3">
                  <div className="font-500">{p.name}</div>
                  <div className="text-[0.7rem] text-[var(--muted-foreground)] font-mono">{p.sku}</div>
                </td>
                <td className="px-4 py-3 text-right text-[var(--muted-foreground)]">{formatCurrency(p.avgCost)}</td>
                <td className="px-4 py-3 text-right text-red-600 font-500">{formatCurrency(p.floorPrice)}</td>
                <td className="px-4 py-3 text-right font-500">{formatCurrency(p.tier1)}</td>
                <td className="px-4 py-3 text-right font-500">{formatCurrency(p.tier2)}</td>
                <td className="px-4 py-3 text-right font-500">{formatCurrency(p.tier3)}</td>
                <td className="px-4 py-3 text-right font-500">{formatCurrency(p.tier4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreditNoteTable({ search }: { search: string }) {
  const data = mockCreditNotes.filter(c => c.id.includes(search) || c.customer.includes(search) || c.soId.includes(search));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {["เลข Credit Note", "อ้างอิง SO", "อ้างอิง Return", "ลูกค้า", "ประเภท", "มูลค่า", "เหตุผล", "Commission", "Peak", "วันที่"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
              <td className="px-4 py-3 font-mono text-[0.73rem] font-500" style={{ color: "var(--primary)" }}>{c.id}</td>
              <td className="px-4 py-3 font-mono text-[0.73rem]">{c.soId}</td>
              <td className="px-4 py-3 font-mono text-[0.73rem]">{c.returnId}</td>
              <td className="px-4 py-3 font-500 max-w-[150px] truncate">{c.customer}</td>
              <td className="px-4 py-3">
                <Badge variant={c.type === "full" ? "secondary" : "warning"}>{c.type === "full" ? "เต็มจำนวน" : "บางส่วน"}</Badge>
              </td>
              <td className="px-4 py-3 font-700">{formatCurrency(c.amount)}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-[180px]">{c.reason}</td>
              <td className="px-4 py-3"><Badge variant="ghost">Cancelled</Badge></td>
              <td className="px-4 py-3">{statusBadge(c.peakStatus)}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">{c.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PromotionTable({ search }: { search: string }) {
  const data = mockPromotions.filter(p => p.name.includes(search));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {["ชื่อโปรโมชั่น", "ประเภท", "มูลค่า", "Tier ที่ใช้ได้", "วันเริ่ม", "วันสิ้นสุด", "Priority", "สถานะ"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
              <td className="px-4 py-3 font-500">{p.name}</td>
              <td className="px-4 py-3"><Badge variant="secondary">{p.type === "percent" ? "% ส่วนลด" : "ลดคงที่"}</Badge></td>
              <td className="px-4 py-3 font-600">{p.type === "percent" ? `${p.value}%` : formatCurrency(p.value)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {p.tier.map(t => <TierBadge key={t} tier={t} />)}
                </div>
              </td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.startDate}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.endDate}</td>
              <td className="px-4 py-3 text-center font-700">{p.priority}</td>
              <td className="px-4 py-3">{statusBadge(p.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
