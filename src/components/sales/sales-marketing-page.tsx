"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Badge, statusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  mockCustomers, mockSalesOrders, mockCommissions, mockPromotions, mockProducts,
  mockPromoPerformance,
} from "@/lib/mock-data";
import { useRole } from "@/components/layout/role-context";
import { useSalesNav, tabsFor, type SalesTab, type SalesModule } from "@/components/layout/sales-nav-context";
import { useErpStore, type ReturnRec, type Customer, type CustomerPatch, type Tier, type TierPatch } from "@/components/layout/erp-store-context";
import {
  Users, ShoppingCart, Tag, Plus, Search, X, ChevronDown, Check,
  Trash2, Layers, FileMinus, Info, BarChart2, RotateCcw, FileEdit, Clock,
  Package, AlertTriangle,
} from "lucide-react";
import { BahtSign } from "@/components/ui/baht-sign";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { SalesDashboard, MarketingDashboard } from "@/components/dashboards/dept-dashboards";

type Tab = SalesTab;

interface SOItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  dept: string;
}

interface DraftSO {
  id: string;
  customerId: string;
  customerName: string;
  items: SOItem[];
  savedAt: string;
}

export function SalesMarketingPage({ module }: { module: SalesModule }) {
  const { config, role } = useRole();
  const { tab, setTab } = useSalesNav();
  const isMarketing = role === "marketing";

  // แท็บที่สิทธิ์นี้เข้าถึงได้ในโมดูลปัจจุบัน + แท็บเริ่มต้นของโมดูล
  const moduleTabKeys = tabsFor(module, role).map(t => t.key);
  const defaultTab = moduleTabKeys[0];
  // ถ้าแท็บปัจจุบันไม่อยู่ในโมดูลนี้ (เช่นเพิ่งสลับเมนู) → เด้งไปแท็บเริ่มต้น
  useEffect(() => {
    if (defaultTab && !moduleTabKeys.includes(tab)) setTab(defaultTab);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  // แท็บที่ใช้แสดงผลจริง (กันค่าค้างจากโมดูลอื่นระหว่างรอ effect)
  const activeTab: Tab = moduleTabKeys.includes(tab) ? tab : (defaultTab ?? tab);
  const [draftSOs, setDraftSOs] = useState<DraftSO[]>([]);
  const [editingDraft, setEditingDraft] = useState<DraftSO | null>(null);

  const [search, setSearch] = useState("");
  const [showCreateSO, setShowCreateSO] = useState(false);
  const [showCreateReturn, setShowCreateReturn] = useState(false);
  const [marketingModal, setMarketingModal] = useState<null | "customers" | "promotions" | "tiers">(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const { salesOrders, createSalesOrder, createReturnRequest, addCustomer, updateCustomer, addPromotion, addTier } = useErpStore();
  const orders = salesOrders;

  // ── จัดการลูกค้า: ผู้บริหาร/เซลล์ ทำได้ทันที · การตลาด ต้องรออนุมัติ · บัญชี ดูอย่างเดียว ──
  const customerManageMode: "direct" | "approval" | undefined =
    role === "admin" || role === "sales" ? "direct" : isMarketing ? "approval" : undefined;
  const canApproveCustomers = role === "admin";
  // จัดการนิยาม Tier: ผู้บริหารทำได้ทันที · การตลาดเสนอ (รออนุมัติ)
  const tierManageMode: "direct" | "approval" | undefined =
    role === "admin" ? "direct" : isMarketing ? "approval" : undefined;

  const ownScope = config.perms.commissionScope === "own";
  const ownName = config.user.name;
  const canSell = config.perms.canSell;
  const readOnlyViewer = !canSell && !ownScope && !isMarketing;
  const promoCanManage = isMarketing || role === "admin";

  // เซลล์/ผู้บริหารไม่มีปุ่มเพิ่มลูกค้า/แก้ราคา Tier บนหน้านี้ (จัดการที่ส่วนกลาง)
  const createLabel: Partial<Record<Tab, string>> = {};
  const marketingCreateTabs: Partial<Record<Tab, string>> = {
    customers: "เพิ่มลูกค้า",
    promotions: "เพิ่มโปรโมชั่น (ต้องอนุมัติ)",
  };

  const allTabs: { key: Tab; label: string; icon: React.ElementType; desc: string; module: SalesModule; roles?: string[] }[] = [
    { key: "orders", label: "ใบสั่งขาย", icon: ShoppingCart, desc: "สร้างและติดตามใบสั่งขาย ดึงราคา Tier + โปรอัตโนมัติ", module: "sales", roles: ["admin", "sales", "accounting"] },
    { key: "customers", label: "ลูกค้า", icon: Users, desc: "ข้อมูลลูกค้าและ Tier ที่รับผิดชอบ", module: "sales" },
    { key: "commission", label: "Commission & KPI", icon: BahtSign, desc: "คอมมิชชั่นและเป้า KPI", module: "sales", roles: ["admin", "sales", "accounting"] },
    { key: "creditnote", label: "Credit Note", icon: FileMinus, desc: "ใบลดหนี้ที่เกิดจากการคืนสินค้า", module: "sales", roles: ["admin", "sales", "accounting"] },
    { key: "promotions", label: "โปรโมชั่น", icon: Tag, desc: "โปรโมชั่นที่กำลังใช้งานในระบบ", module: "marketing" },
    { key: "performance", label: "Promo Performance", icon: BarChart2, desc: "ประสิทธิภาพของแต่ละแคมเปญโปรโมชั่น", module: "marketing", roles: ["admin", "marketing"] },
    { key: "tiers", label: "จัดการ Tier", icon: Layers, desc: "นิยาม Tier ลูกค้า — การตลาดเสนอ ผู้บริหารอนุมัติ", module: "marketing", roles: ["admin", "marketing"] },
  ];
  const tabs = allTabs.filter(t => t.module === module && (!t.roles || t.roles.includes(role)));
  const currentTab = allTabs.find(t => t.key === activeTab) ?? tabs[0] ?? allTabs[0];

  function handleSaveDraft(draft: DraftSO) {
    setDraftSOs(prev => {
      const idx = prev.findIndex(d => d.id === draft.id);
      if (idx >= 0) return prev.map((d, i) => i === idx ? draft : d);
      return [draft, ...prev];
    });
  }

  // ── ชิ้นส่วนที่ใช้ร่วมกันระหว่างดีไซน์ผู้บริหาร (แท็บแนวนอน) กับสิทธิ์อื่น (เมนูด้านข้าง) ──
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

  const actionButtons = readOnlyViewer ? (
    <span className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.78rem] font-500 text-[var(--muted-foreground)] border border-[var(--border)] whitespace-nowrap">
      ดูอย่างเดียว
    </span>
  ) : activeTab === "tiers" && (role === "admin" || isMarketing) ? (
    <button
      onClick={() => setMarketingModal("tiers")}
      className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.8rem] font-500 text-white transition-colors hover:opacity-90 whitespace-nowrap"
      style={{ background: isMarketing ? "#ea580c" : "var(--primary)" }}
    >
      <Plus size={13} />
      {isMarketing ? "เสนอเพิ่ม Tier" : "เพิ่ม Tier"}
    </button>
  ) : isMarketing && marketingCreateTabs[activeTab] ? (
    <button
      onClick={() => setMarketingModal(activeTab as "customers" | "promotions")}
      className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.8rem] font-500 text-white transition-colors hover:opacity-90 whitespace-nowrap"
      style={{ background: "#ea580c" }}
    >
      <Plus size={13} />
      {marketingCreateTabs[activeTab]}
    </button>
  ) : canSell && activeTab === "customers" ? (
    <button
      onClick={() => setMarketingModal("customers")}
      className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.8rem] font-500 text-white transition-colors hover:opacity-90 whitespace-nowrap"
      style={{ background: "var(--primary)" }}
    >
      <Plus size={13} />
      เพิ่มลูกค้า
    </button>
  ) : canSell && activeTab === "orders" ? (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowCreateReturn(true)}
        className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.8rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors whitespace-nowrap"
      >
        <RotateCcw size={13} />
        สร้างใบขอคืน
      </button>
      <button
        onClick={() => { setEditingDraft(null); setShowCreateSO(true); }}
        className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.8rem] font-500 text-white transition-colors hover:opacity-90 whitespace-nowrap"
        style={{ background: "var(--primary)" }}
      >
        <Plus size={13} />
        สร้างใบสั่งขาย
      </button>
    </div>
  ) : canSell && createLabel[activeTab] ? (
    <button
      className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.8rem] font-500 text-white transition-colors hover:opacity-90 whitespace-nowrap"
      style={{ background: "var(--primary)" }}
    >
      <Plus size={13} />
      {createLabel[tab]}
    </button>
  ) : null;

  const draftSection = activeTab === "orders" && draftSOs.length > 0 ? (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-200 text-[0.78rem] font-600 text-amber-800">
        <Clock size={13} />
        ร่างใบสั่งขายที่บันทึกไว้ ({draftSOs.length}) · คลิกเพื่อแก้ไขต่อ
      </div>
      <div className="flex flex-wrap gap-3 p-3">
        {draftSOs.map(d => (
          <div
            key={d.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-amber-200 cursor-pointer hover:border-amber-400 transition-colors group"
            onClick={() => { setEditingDraft(d); setShowCreateSO(true); }}
          >
            <FileEdit size={14} className="text-amber-600 flex-shrink-0" />
            <div>
              <div className="text-[0.8rem] font-500">{d.customerName}</div>
              <div className="text-[0.7rem] text-[var(--muted-foreground)]">{d.items.length} รายการ · บันทึก {d.savedAt}</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setDraftSOs(prev => prev.filter(x => x.id !== d.id)); }}
              className="ml-1 w-5 h-5 rounded flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
            >
              <X size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const contentCard = activeTab === "dashboard" ? (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
      {module === "marketing" ? <MarketingDashboard /> : <SalesDashboard />}
    </div>
  ) : (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden">
      {activeTab === "orders" && <SOTable orders={orders} search={search} ownScope={ownScope} ownName={ownName} />}
      {activeTab === "customers" && (
        <CustomerTable
          search={search} ownScope={ownScope} ownName={ownName}
          manageMode={customerManageMode} canApprove={canApproveCustomers}
          onEdit={(c) => setEditCustomer(c)}
        />
      )}
      {activeTab === "commission" && <CommissionTable search={search} ownScope={ownScope} ownName={ownName} />}
      {activeTab === "promotions" && <PromotionTable search={search} canManage={promoCanManage} />}
      {activeTab === "performance" && <PromoPerformanceTab />}
      {activeTab === "creditnote" && <CreditNoteTable search={search} canCreate={canSell} />}
      {activeTab === "tiers" && <TierManageTable search={search} manageMode={tierManageMode} canApprove={role === "admin"} requestedBy={ownName} />}
    </div>
  );

  // หัวข้อแท็บปัจจุบัน + ค้นหา + ปุ่มสร้าง (ใช้ในดีไซน์เซลล์และการตลาด/บัญชี)
  const headingBar = (
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
        {actionButtons}
      </div>
    </div>
  );

  return (
    <>
      <Topbar
        title={module === "marketing" ? "Marketing" : "Sales"}
        subtitle={module === "marketing" ? "จัดการโปรโมชั่นและวิเคราะห์แคมเปญ" : "จัดการการขาย ลูกค้า ราคา Tier และคอมมิชชั่น"}
      />
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
        {isMarketing && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-orange-200 bg-orange-50 mb-4 text-[0.8rem]">
            <Info size={14} className="text-orange-500 flex-shrink-0" />
            <span className="text-orange-700">
              มุมมอง <span className="font-600">การตลาด</span> — จัดการ Promotion & Customer Tier ได้ (ต้องขออนุมัติก่อนมีผล) · ดู Promotion Performance ทั้งหมด
            </span>
          </div>
        )}

        {/* ทุกสิทธิ์ใช้เมนูย่อยในแถบซ้าย → เนื้อหาเต็มความกว้าง */}
        {activeTab !== "dashboard" && headingBar}
        {draftSection}
        {contentCard}
      </div>

      {showCreateSO && (
        <CreateSOModal
          onClose={() => { setShowCreateSO(false); setEditingDraft(null); }}
          myName={ownName}
          onSubmit={(input) => createSalesOrder(input)}
          onSaveDraft={handleSaveDraft}
          initialDraft={editingDraft ?? undefined}
        />
      )}

      {showCreateReturn && (
        <CreateReturnModal
          orders={orders.filter(o => o.status === "closed")}
          onClose={() => setShowCreateReturn(false)}
          onCreate={createReturnRequest}
        />
      )}

      {marketingModal === "customers" && (
        <AddCustomerModal
          approval={customerManageMode === "approval"}
          onClose={() => setMarketingModal(null)}
          onSubmit={(c) => {
            addCustomer(c, customerManageMode === "approval" ? { needsApproval: true, requestedBy: ownName } : undefined);
            setMarketingModal(null);
          }}
        />
      )}
      {editCustomer && (
        <EditCustomerModal
          customer={editCustomer}
          approval={customerManageMode === "approval"}
          onClose={() => setEditCustomer(null)}
          onSubmit={(patch) => {
            updateCustomer(editCustomer.id, patch, customerManageMode === "approval" ? { needsApproval: true, requestedBy: ownName } : undefined);
            setEditCustomer(null);
          }}
        />
      )}
      {marketingModal === "promotions" && (
        <AddPromotionModal onClose={() => setMarketingModal(null)} createdBy={ownName} onSubmit={(p) => { addPromotion(p); setMarketingModal(null); }} />
      )}
      {marketingModal === "tiers" && (
        <AddTierModal
          approval={tierManageMode === "approval"}
          onClose={() => setMarketingModal(null)}
          onSubmit={(t) => { addTier(t, tierManageMode === "approval" ? { needsApproval: true, requestedBy: ownName } : undefined); setMarketingModal(null); }}
        />
      )}
    </>
  );
}

/* ── Create SO Modal ─────────────────────────────── */
function CreateSOModal({
  onClose, onSubmit, onSaveDraft, myName, initialDraft,
}: {
  onClose: () => void;
  onSubmit: (input: { customer: string; tier: string; items: { name: string; qty: number; unitPrice: number; dept: string }[]; discount: number; salesBy: string }) => void;
  onSaveDraft: (draft: DraftSO) => void;
  myName: string;
  initialDraft?: DraftSO;
}) {
  const [customerId, setCustomerId] = useState(initialDraft?.customerId ?? mockCustomers[0].id);
  const [items, setItems] = useState<SOItem[]>(
    initialDraft?.items ?? [
      { productId: mockProducts[0].id, name: mockProducts[0].name, qty: 1, unitPrice: mockProducts[0].price3, dept: mockProducts[0].category },
    ]
  );
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [draftId] = useState(initialDraft?.id ?? `DRAFT-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`);

  const customer = mockCustomers.find(c => c.id === customerId)!;
  const tierPriceKey = customer.tier === "Founder" ? "price4" : customer.tier === "Dealer" ? "price3" : customer.tier === "ผู้รับเหมา" ? "price2" : "price1";

  useEffect(() => {
    const promos = mockPromotions.filter(p => p.status === "active" && p.tier.includes(customer.tier));
    if (promos.length > 0) {
      const best = promos.reduce((a, b) => a.priority < b.priority ? a : b);
      setSelectedPromoId(best.id);
    } else {
      setSelectedPromoId(null);
    }
  }, [customerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const activePromos = mockPromotions.filter(p => p.status === "active" && p.tier.includes(customer.tier));
  const selectedPromo = mockPromotions.find(p => p.id === selectedPromoId) ?? null;
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const promoDiscount = selectedPromo
    ? selectedPromo.type === "percent"
      ? Math.round(subtotal * selectedPromo.value / 100)
      : selectedPromo.value
    : 0;
  const subtotalAfterDiscount = subtotal - promoDiscount;
  const vat = Math.round(subtotalAfterDiscount * 0.07);
  const total = subtotalAfterDiscount + vat;

  function addItem() {
    const p = mockProducts[0];
    setItems(prev => [...prev, { productId: p.id, name: p.name, qty: 1, unitPrice: (p as any)[tierPriceKey], dept: p.category }]);
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function updateProduct(idx: number, productId: string) {
    const p = mockProducts.find(p => p.id === productId)!;
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, productId, name: p.name, unitPrice: (p as any)[tierPriceKey], dept: p.category } : item
    ));
  }

  function handleSaveDraftClick() {
    const d = new Date();
    const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    onSaveDraft({ id: draftId, customerId, customerName: customer.name, items, savedAt: timeStr });
    onClose();
  }

  function handleSubmit() {
    onSubmit({
      customer: customer.name,
      tier: customer.tier,
      items: items.map(({ name, qty, unitPrice, dept }) => ({ name, qty, unitPrice, dept })),
      discount: promoDiscount,
      salesBy: myName,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[var(--card)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-700 text-base">{initialDraft ? "แก้ไขร่างใบสั่งขาย" : "สร้างใบสั่งขาย"}</h2>
            <p className="text-[0.72rem] text-[var(--muted-foreground)]">ระบบดึงราคา Tier และโปรโมชั่น Active อัตโนมัติ</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Customer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.78rem] font-500 mb-1.5">ลูกค้า</label>
              <div className="relative">
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] appearance-none bg-[var(--card)] cursor-pointer"
                >
                  {mockCustomers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

          {/* Promotions */}
          <div>
            <label className="block text-[0.78rem] font-500 mb-1.5">
              โปรโมชั่นที่ใช้ได้
              {activePromos.length > 0 && (
                <span className="ml-2 text-[0.72rem] font-400 text-[var(--muted-foreground)]">· เลือกโปรที่ต้องการใช้</span>
              )}
            </label>
            {activePromos.length === 0 ? (
              <div className="px-3 py-2 rounded-lg border border-[var(--border)] text-[0.78rem] text-[var(--muted-foreground)] bg-[var(--muted)]">
                ไม่มีโปรโมชั่น Active สำหรับ Tier {customer.tier} ในขณะนี้
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPromoId(null)}
                  className={`px-3 h-7 rounded-full text-[0.75rem] font-500 border transition-colors ${
                    selectedPromoId === null
                      ? "bg-gray-100 border-gray-400 text-gray-700"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  ไม่ใช้โปร
                </button>
                {activePromos.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPromoId(p.id)}
                    className={`px-3 h-7 rounded-full text-[0.75rem] font-500 border transition-colors ${
                      selectedPromoId === p.id
                        ? "bg-orange-100 border-orange-400 text-orange-700"
                        : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    {p.name} ({p.type === "percent" ? `${p.value}%` : formatCurrency(p.value)})
                  </button>
                ))}
              </div>
            )}
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
                <Plus size={11} />เพิ่มรายการ
              </button>
            </div>
            <div className="border border-[var(--border)] rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[0.72rem] font-600 text-[var(--muted-foreground)]" style={{ background: "var(--muted)" }}>
                <div className="col-span-5">สินค้า · คงเหลือ</div>
                <div className="col-span-2 text-center">จำนวน</div>
                <div className="col-span-3 text-right">ราคา/ชิ้น</div>
                <div className="col-span-1 text-right">รวม</div>
                <div className="col-span-1" />
              </div>
              {items.map((item, idx) => {
                const prod = mockProducts.find(p => p.id === item.productId);
                const stockLeft = prod?.stock ?? 0;
                const stockLow = stockLeft <= (prod?.reorderPoint ?? 0);
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-t border-[var(--border)] items-start">
                    <div className="col-span-5">
                      <div className="relative">
                        <select
                          value={item.productId}
                          onChange={e => updateProduct(idx, e.target.value)}
                          className="w-full h-8 pl-2 pr-6 text-[0.78rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] appearance-none bg-[var(--card)] cursor-pointer"
                        >
                          {mockProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 px-1">
                        <span className="text-[0.68rem] text-[var(--muted-foreground)]">{item.dept}</span>
                        <span className="text-[0.68rem]" style={{ color: stockLow ? "#dc2626" : "#16a34a" }}>
                          · คงเหลือ {stockLeft.toLocaleString()}{stockLow ? " ⚠" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number" min={1} value={item.qty}
                        onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: Number(e.target.value) } : it))}
                        className="w-full h-8 px-2 text-center text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number" value={item.unitPrice}
                        onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: Number(e.target.value) } : it))}
                        className="w-full h-8 px-2 text-right text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]"
                      />
                    </div>
                    <div className="col-span-1 text-right text-[0.78rem] font-500 pt-1.5">
                      {(item.qty * item.unitPrice).toLocaleString()}
                    </div>
                    <div className="col-span-1 flex justify-end pt-1">
                      <button onClick={() => removeItem(idx)} disabled={items.length === 1}>
                        <Trash2 size={13} className={items.length === 1 ? "text-[var(--border)]" : "text-[var(--muted-foreground)] hover:text-red-500 transition-colors"} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              <div className="flex justify-between px-4 py-2.5 text-[0.82rem]">
                <span className="text-[var(--muted-foreground)]">ยอดรวมก่อนส่วนลด</span>
                <span className="font-500">{subtotal.toLocaleString()} ฿</span>
              </div>
              {selectedPromo ? (
                <div className="flex justify-between px-4 py-2.5 text-[0.82rem]">
                  <span className="text-orange-600">
                    ส่วนลดโปร "{selectedPromo.name}"{selectedPromo.type === "percent" ? ` (${selectedPromo.value}%)` : ""}
                  </span>
                  <span className="font-600 text-orange-600">−{promoDiscount.toLocaleString()} ฿</span>
                </div>
              ) : (
                <div className="flex justify-between px-4 py-2.5 text-[0.82rem]">
                  <span className="text-[var(--muted-foreground)]">ส่วนลด</span>
                  <span className="text-[var(--muted-foreground)]">—</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-2.5 text-[0.82rem]">
                <span className="text-[var(--muted-foreground)]">ยอดหลังส่วนลด</span>
                <span className="font-500">{subtotalAfterDiscount.toLocaleString()} ฿</span>
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

        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-[0.82rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
            ยกเลิก
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleSaveDraftClick}
              className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-[0.82rem] font-500 border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
            >
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

/* ── Create Return Modal ─────────────────────────── */
// ระยะเวลาคืนสินค้า (Return Period) — กำหนดโดยผู้บริหาร
const RETURN_PERIOD_DAYS = 30;
// วันที่อ้างอิงของระบบเดโม (ตรงกับ 14 มิ.ย. 2567 บนแถบด้านบน)
const DEMO_TODAY = new Date("2024-06-14");
function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.round((DEMO_TODAY.getTime() - d.getTime()) / 86400000);
}

// เหตุผลการคืนสำเร็จรูป — กดเลือกเป็นปุ่ม
const RETURN_REASONS = [
  "สินค้าชำรุด/เสียหาย",
  "สั่งเกินจำนวน",
  "สินค้าไม่ตรงสเปค",
  "ส่งผิดรุ่น/ผิดสินค้า",
  "ลูกค้าเปลี่ยนใจ",
];

function CreateReturnModal({
  orders, onClose, onCreate,
}: {
  orders: typeof mockSalesOrders;
  onClose: () => void;
  onCreate: (r: { soId: string; customer: string; product: string; qty: number; value: number; reason: string; by: string; returnDays: number }) => void;
}) {
  const [soId, setSoId] = useState(orders[0]?.id ?? "");
  const [itemIdx, setItemIdx] = useState(0);
  const [returnQty, setReturnQty] = useState(1);
  const [reason, setReason] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedSO = orders.find(o => o.id === soId);
  const soItems = (selectedSO as any)?.items ?? [];
  const selectedItem = soItems[itemIdx] ?? null;
  const returnDays = selectedSO ? daysSince(selectedSO.date) : 0;
  const withinPeriod = returnDays <= RETURN_PERIOD_DAYS;
  const isInvalid = !soId || !reason.trim() || returnQty < 1 || (selectedItem && returnQty > selectedItem.qty);
  const returnId = selectedSO ? `RET${selectedSO.id.replace("SO", "")}` : "RET——";

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-[var(--card)] rounded-2xl shadow-[var(--shadow-lg)] p-8 text-center">
          {withinPeriod ? (
            <>
              <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <Package size={24} className="text-teal-600" />
              </div>
              <h3 className="font-700 text-base mb-1">ส่งใบขอคืนไปยังแผนกสต๊อกแล้ว</h3>
              <div className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-teal-50 border border-teal-200 text-[0.72rem] font-600 text-teal-700 mb-3">
                <span className="font-mono">{returnId}</span> · รอสต๊อกรับสินค้าไปตรวจ
              </div>
              <p className="text-[0.8rem] text-[var(--muted-foreground)] mb-5">
                อยู่ในระยะเวลาคืน ({returnDays}/{RETURN_PERIOD_DAYS} วัน) — เจ้าหน้าที่แผนกสต๊อกจะเข้ามารับสินค้าไปตรวจสภาพ
                เมื่อผ่านการตรวจ ระบบจะออก Credit Note ให้อัตโนมัติ
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <h3 className="font-700 text-base mb-1">ส่งคำขอให้ผู้บริหารพิจารณา</h3>
              <div className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-amber-50 border border-amber-200 text-[0.72rem] font-600 text-amber-700 mb-3">
                เกินระยะเวลาคืน ({returnDays} วัน)
              </div>
              <p className="text-[0.8rem] text-[var(--muted-foreground)] mb-5">
                เกินระยะเวลาคืน {RETURN_PERIOD_DAYS} วัน จึงต้องให้ผู้บริหารอนุมัติเป็นกรณีพิเศษก่อน
                หากอนุมัติ ระบบจะส่งต่อให้แผนกสต๊อกรับสินค้าไปตรวจสภาพ
              </p>
            </>
          )}
          <button onClick={onClose} className="px-6 h-9 rounded-lg text-[0.82rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
            ปิด
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[var(--card)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-700 text-base">สร้างใบขอคืนสินค้า</h2>
            <p className="text-[0.72rem] text-[var(--muted-foreground)]">ส่งให้แผนกสต๊อกรับสินค้าไปตรวจสภาพ ก่อนออก Credit Note</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[0.78rem] font-500 mb-1.5">ใบสั่งขายอ้างอิง</label>
            {orders.length === 0 ? (
              <div className="px-3 py-2 rounded-lg border border-[var(--border)] text-[0.78rem] text-[var(--muted-foreground)] bg-[var(--muted)]">
                ไม่มีใบสั่งขายที่ปิดแล้ว (status: closed) ในขณะนี้
              </div>
            ) : (
              <div className="relative">
                <select
                  value={soId}
                  onChange={e => { setSoId(e.target.value); setItemIdx(0); setReturnQty(1); }}
                  className="w-full h-9 pl-3 pr-8 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] appearance-none bg-[var(--card)] cursor-pointer"
                >
                  {orders.map(o => <option key={o.id} value={o.id}>{o.id} — {o.customer}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
              </div>
            )}
          </div>

          {selectedSO && (
            <div className="grid grid-cols-4 gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[0.78rem]">
              <div>
                <div className="text-[var(--muted-foreground)] text-[0.7rem] mb-0.5">ลูกค้า</div>
                <div className="font-500 truncate">{selectedSO.customer}</div>
              </div>
              <div>
                <div className="text-[var(--muted-foreground)] text-[0.7rem] mb-0.5">Tier</div>
                <TierBadge tier={selectedSO.tier} />
              </div>
              <div>
                <div className="text-[var(--muted-foreground)] text-[0.7rem] mb-0.5">วันที่ขาย</div>
                <div className="font-500">{selectedSO.date}</div>
              </div>
              <div>
                <div className="text-[var(--muted-foreground)] text-[0.7rem] mb-0.5">ระยะเวลาคืน</div>
                {withinPeriod ? (
                  <span className="inline-flex items-center px-2 h-5 text-[0.66rem] font-600 rounded-full bg-green-100 text-green-700 border border-green-300">
                    อยู่ในระยะ {returnDays}/{RETURN_PERIOD_DAYS} วัน
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 h-5 text-[0.66rem] font-600 rounded-full bg-red-100 text-red-700 border border-red-300">
                    เกิน {returnDays} วัน
                  </span>
                )}
              </div>
            </div>
          )}

          {soItems.length > 0 && (
            <div>
              <label className="block text-[0.78rem] font-500 mb-1.5">สินค้าที่คืน</label>
              <div className="relative">
                <select
                  value={itemIdx}
                  onChange={e => { setItemIdx(Number(e.target.value)); setReturnQty(1); }}
                  className="w-full h-9 pl-3 pr-8 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] appearance-none bg-[var(--card)] cursor-pointer"
                >
                  {soItems.map((item: any, i: number) => (
                    <option key={i} value={i}>{item.name} (สั่ง {item.qty} ชิ้น · ฿{item.unitPrice.toLocaleString()}/ชิ้น)</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.78rem] font-500 mb-1.5">
                จำนวนที่คืน
                {selectedItem && <span className="ml-1 font-400 text-[var(--muted-foreground)]">(สูงสุด {selectedItem.qty})</span>}
              </label>
              <input
                type="number" min={1} max={selectedItem?.qty ?? 99}
                value={returnQty}
                onChange={e => setReturnQty(Math.max(1, Number(e.target.value)))}
                className="w-full h-9 px-3 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)]"
              />
              {selectedItem && returnQty > selectedItem.qty && (
                <p className="text-[0.7rem] text-red-500 mt-1">เกินจำนวนที่สั่ง</p>
              )}
            </div>
            <div>
              <label className="block text-[0.78rem] font-500 mb-1.5">มูลค่าโดยประมาณ</label>
              <div className="h-9 px-3 flex items-center rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[0.82rem] font-600" style={{ color: "var(--primary)" }}>
                {selectedItem ? formatCurrency(returnQty * selectedItem.unitPrice) : "—"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[0.78rem] font-500 mb-1.5">เหตุผลการคืน</label>
            <div className="flex flex-wrap gap-2">
              {RETURN_REASONS.map((r) => {
                const active = !showCustom && reason === r;
                return (
                  <button
                    key={r}
                    onClick={() => { setShowCustom(false); setReason(r); }}
                    className={`px-3 h-8 rounded-full text-[0.76rem] font-500 border transition-colors ${
                      active
                        ? "bg-[var(--accent)] border-[var(--primary)] text-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    {r}
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
                placeholder="ระบุเหตุผลการคืน..."
                rows={2}
                autoFocus
                className="mt-2 w-full px-3 py-2 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] resize-none"
              />
            )}
          </div>

          {/* Dynamic routing notice */}
          {withinPeriod ? (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-teal-200 bg-teal-50 text-[0.75rem] text-teal-700">
              <Package size={13} className="mt-0.5 flex-shrink-0" />
              <span>
                <span className="font-600">อยู่ในระยะเวลาคืน</span> — ส่งใบขอคืนไปยัง <span className="font-600">แผนกสต๊อก</span> เพื่อเข้ามารับสินค้าไปตรวจสภาพ
                หากผ่าน ระบบออก Credit Note อัตโนมัติ · หากไม่ผ่าน ออก Partial / ปฏิเสธ
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-[0.75rem] text-amber-700">
              <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
              <span>
                <span className="font-600">เกินระยะเวลาคืน {RETURN_PERIOD_DAYS} วัน</span> — ต้องส่ง <span className="font-600">ผู้บริหาร</span> อนุมัติเป็นกรณีพิเศษก่อน
                จึงจะส่งต่อให้แผนกสต๊อกตรวจสภาพ
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 h-9 rounded-lg text-[0.82rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
            ยกเลิก
          </button>
          {withinPeriod ? (
            <button
              onClick={() => {
                if (selectedSO && selectedItem) {
                  onCreate({
                    soId: selectedSO.id, customer: selectedSO.customer, product: selectedItem.name,
                    qty: returnQty, value: selectedItem.unitPrice * returnQty, reason,
                    by: selectedSO.salesBy, returnDays,
                  });
                }
                setSubmitted(true);
              }}
              disabled={!!isInvalid}
              className="flex items-center gap-1.5 px-5 h-9 rounded-lg text-[0.82rem] font-600 text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--primary)" }}
            >
              <Package size={14} />
              ส่งให้แผนกสต๊อกตรวจสอบ
            </button>
          ) : (
            <button
              onClick={() => setSubmitted(true)}
              disabled={!!isInvalid}
              className="flex items-center gap-1.5 px-5 h-9 rounded-lg text-[0.82rem] font-600 text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#d97706" }}
            >
              <AlertTriangle size={14} />
              ส่งผู้บริหารอนุมัติ (เกิน Period)
            </button>
          )}
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

const PENDING_LABEL: Record<string, string> = {
  add: "รออนุมัติเพิ่ม", edit: "รออนุมัติแก้ไข", delete: "รออนุมัติลบ",
};

function CustomerTable({
  search, ownScope, ownName, manageMode, canApprove, onEdit,
}: {
  search: string; ownScope?: boolean; ownName?: string;
  manageMode?: "direct" | "approval"; canApprove?: boolean;
  onEdit?: (c: Customer) => void;
}) {
  const { customers, deleteCustomer, approveCustomer, rejectCustomer } = useErpStore();
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
  const data = customers
    .filter(c => !ownScope || c.salesOwner === ownName)
    .filter(c => c.name.includes(search) || c.tier.includes(search));
  const showActions = !!manageMode || !!canApprove;

  const headers = ["ชื่อลูกค้า", "Tier", "ผู้ติดต่อ", "เบอร์โทร", "เซลส์เจ้าของ", "Total Orders", "Total Value", "สถานะ"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[0.82rem]">
        <thead style={{ background: "var(--muted)" }}>
          <tr>
            {headers.map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
            ))}
            {showActions && <th className="px-4 py-2.5 text-right font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">จัดการ</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((c) => {
            const pending = c.pendingAction ?? null;
            // ค่าที่จะแสดง: ถ้ารออนุมัติแก้ไข แสดงค่าใหม่ในวงเล็บ
            const patch = pending === "edit" ? (c.pendingPatch ?? {}) : {};
            return (
              <tr key={c.id} className={`border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors ${pending === "delete" ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 font-500">
                  {c.name}
                  {patch.name && patch.name !== c.name && <span className="ml-1.5 text-[0.72rem] text-orange-600">→ {patch.name}</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <TierBadge tier={c.tier} />
                    {patch.tier && patch.tier !== c.tier && (
                      <><span className="text-orange-400">→</span><TierBadge tier={patch.tier} /></>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{patch.contact ?? c.contact}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{patch.phone ?? c.phone}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{patch.salesOwner ?? c.salesOwner}</td>
                <td className="px-4 py-3 font-500">{c.totalOrders}</td>
                <td className="px-4 py-3 font-600">{formatCurrency(c.totalValue)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {statusBadge(c.status)}
                    {pending && (
                      <Badge variant="warning"><Clock size={10} />{PENDING_LABEL[pending]}</Badge>
                    )}
                  </div>
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* ผู้บริหารอนุมัติ/ปฏิเสธคำขอที่ค้าง */}
                      {pending && canApprove ? (
                        <>
                          <button
                            onClick={() => approveCustomer(c.id)}
                            className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[0.73rem] font-500 text-white bg-green-600 hover:bg-green-700 transition-colors"
                          >
                            <Check size={12} />อนุมัติ
                          </button>
                          <button
                            onClick={() => rejectCustomer(c.id)}
                            className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[0.73rem] font-500 border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <X size={12} />ปฏิเสธ
                          </button>
                        </>
                      ) : pending && !canApprove ? (
                        <span className="text-[0.72rem] text-[var(--muted-foreground)] italic">รอผู้บริหารอนุมัติ</span>
                      ) : manageMode ? (
                        <>
                          <button
                            onClick={() => onEdit?.(c)}
                            className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[0.73rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                          >
                            <FileEdit size={12} />แก้ไข
                          </button>
                          <button
                            onClick={() => setConfirmDelete(c)}
                            className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[0.73rem] font-500 border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={12} />ลบ
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {confirmDelete && (
        <ConfirmDeleteCustomerModal
          customer={confirmDelete}
          approval={manageMode === "approval"}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteCustomer(confirmDelete.id, manageMode === "approval" ? { needsApproval: true, requestedBy: ownName } : undefined);
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
  );
}

function ConfirmDeleteCustomerModal({ customer, approval, onClose, onConfirm }: {
  customer: Customer; approval: boolean; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <MarketingModal
      title="ยืนยันการลบลูกค้า"
      subtitle={approval ? "คำขอลบจะถูกส่งให้ผู้บริหารอนุมัติก่อน" : "ลบข้อมูลลูกค้าออกจากระบบทันที"}
      onClose={onClose} submitLabel={approval ? "ส่งขออนุมัติลบ" : "ลบลูกค้า"}
      onSubmit={onConfirm} danger
    >
      <div className="text-[0.85rem]">
        ต้องการลบ <span className="font-700">{customer.name}</span> ({customer.tier}) หรือไม่?
      </div>
      {approval && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[0.72rem] text-amber-700">
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          <span>การลบจะมีผลก็ต่อเมื่อ <strong>ผู้บริหารอนุมัติ</strong> เท่านั้น</span>
        </div>
      )}
    </MarketingModal>
  );
}

function CommissionTable({ search, ownScope, ownName }: { search: string; ownScope?: boolean; ownName?: string }) {
  const { commissions } = useErpStore();
  const data = commissions
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

function CreditNoteTable({ search, canCreate }: { search: string; canCreate?: boolean }) {
  const { creditNotes, returns, createCreditNote } = useErpStore();
  const [reviewing, setReviewing] = useState<ReturnRec | null>(null);
  const pending = returns.filter(r => r.status === "awaiting-cn");
  const data = creditNotes.filter(c => c.id.includes(search) || c.customer.includes(search) || c.soId.includes(search));

  return (
    <div>
      {/* รอออก Credit Note — สต๊อกรับของแล้ว รอเซลล์ตรวจยอด */}
      {canCreate && pending.length > 0 && (
        <div className="border-b border-[var(--border)] bg-blue-50">
          <div className="flex items-center gap-2 px-4 py-2.5 text-[0.78rem] font-600 text-blue-800">
            <RotateCcw size={14} />
            รอออก Credit Note ({pending.length}) — สต๊อกรับของคืนแล้ว ตรวจยอดและออกเอกสารได้เลย
          </div>
          <div className="px-3 pb-3 flex flex-col gap-2">
            {pending.map((r) => {
              const unitPrice = r.qty > 0 ? Math.round(r.value / r.qty) : r.value;
              const amount = unitPrice * (r.receivedQty ?? 0);
              return (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-blue-200">
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.8rem] font-500 truncate">{r.customer}</div>
                    <div className="text-[0.7rem] text-[var(--muted-foreground)]">
                      <span className="font-mono">{r.id}</span> · {r.product} · รับจริง <span className={`font-600 ${(r.receivedQty ?? 0) < r.qty ? "text-amber-600" : "text-green-600"}`}>{r.receivedQty}</span>/{r.qty} ชิ้น
                    </div>
                    {r.shortfallReason && (
                      <div className="text-[0.68rem] text-amber-600 mt-0.5">รับไม่ครบ: {r.shortfallReason}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[0.7rem] text-[var(--muted-foreground)]">ยอด CN</div>
                    <div className="text-[0.85rem] font-700" style={{ color: "var(--primary)" }}>{formatCurrency(amount)}</div>
                  </div>
                  <button
                    onClick={() => setReviewing(r)}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[0.78rem] font-600 text-white transition-colors hover:opacity-90 whitespace-nowrap"
                    style={{ background: "var(--primary)" }}
                  >
                    <FileMinus size={13} />
                    ตรวจยอด & ออก CN
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {reviewing && (
        <ReviewCreditNoteModal
          rec={reviewing}
          onClose={() => setReviewing(null)}
          onConfirm={() => { createCreditNote(reviewing.id); setReviewing(null); }}
        />
      )}
    </div>
  );
}

function ReviewCreditNoteModal({
  rec, onClose, onConfirm,
}: {
  rec: ReturnRec;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const unitPrice = rec.qty > 0 ? Math.round(rec.value / rec.qty) : rec.value;
  const received = rec.receivedQty ?? 0;
  const amount = unitPrice * received;
  const isFull = received >= rec.qty;
  const vat = Math.round(amount * 0.07 / 1.07); // ยอดรวม VAT แล้ว

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--card)] rounded-2xl shadow-[var(--shadow-lg)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-700 text-base">ตรวจยอด & ออก Credit Note</h2>
            <p className="text-[0.72rem] text-[var(--muted-foreground)]">ดึงจำนวนที่สต๊อกรับจริงมาคำนวณยอดอัตโนมัติ</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-[0.8rem]">
            <InfoCell label="อ้างอิง Return" value={rec.id} mono />
            <InfoCell label="อ้างอิง SO" value={rec.soId} mono />
            <InfoCell label="ลูกค้า" value={rec.customer} />
            <InfoCell label="สินค้า" value={rec.product} />
          </div>

          <div className="rounded-xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)] text-[0.82rem]">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-[var(--muted-foreground)]">จำนวนที่รับจริง × ราคา/ชิ้น</span>
              <span className="font-500">{received} × {formatCurrency(unitPrice)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-[var(--muted-foreground)]">ประเภท</span>
              <Badge variant={isFull ? "secondary" : "warning"}>{isFull ? "เต็มจำนวน" : "บางส่วน"}</Badge>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-[var(--muted-foreground)]">VAT ในยอด (7%)</span>
              <span className="font-500">{formatCurrency(vat)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 font-700" style={{ background: "var(--muted)" }}>
              <span>ยอด Credit Note รวม</span>
              <span style={{ color: "var(--primary)" }}>{formatCurrency(amount)}</span>
            </div>
          </div>

          {!isFull && rec.shortfallReason && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-[0.74rem] text-amber-700">
              <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
              <span>สต๊อกรับไม่ครบ ({received}/{rec.qty} ชิ้น) — เหตุผล: <span className="font-600">{rec.shortfallReason}</span></span>
            </div>
          )}

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-blue-200 bg-blue-50 text-[0.74rem] text-blue-700">
            <Info size={13} className="mt-0.5 flex-shrink-0" />
            <span>เมื่อยืนยัน ระบบจะออก Credit Note และ <span className="font-600">Push เข้า Peak ให้อัตโนมัติ</span></span>
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
            <FileMinus size={14} />
            ยืนยันออก Credit Note
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[0.7rem] text-[var(--muted-foreground)] mb-0.5">{label}</div>
      <div className={`font-500 truncate ${mono ? "font-mono text-[0.75rem]" : ""}`}>{value}</div>
    </div>
  );
}

function PromotionTable({ search, canManage }: { search: string; canManage?: boolean }) {
  const { promotions } = useErpStore();
  const data = promotions.filter(p => p.name.includes(search));
  return (
    <div>
      {canManage && (
        <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--muted)] flex items-center gap-2 text-[0.75rem] text-[var(--muted-foreground)]">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          การตลาด: สร้าง/แก้ไขโปรโมชั่นได้ · โปรที่สร้างใหม่ต้องรอผู้บริหารอนุมัติก่อนมีผล
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-[0.82rem]">
          <thead style={{ background: "var(--muted)" }}>
            <tr>
              {["ชื่อโปรโมชั่น", "ประเภท", "มูลค่า", "Tier ที่ใช้ได้", "ใช้แล้ว", "ยอดขาย", "วันเริ่ม", "วันสิ้นสุด", "Priority", "สร้างโดย", "สถานะ"].map(h => (
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
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{(p as any).usedCount ?? "—"} ครั้ง</td>
                <td className="px-4 py-3 font-500">{(p as any).revenue ? formatCurrency((p as any).revenue) : "—"}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.startDate}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.endDate}</td>
                <td className="px-4 py-3 text-center font-700">{p.priority}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)] text-[0.75rem]">{(p as any).createdBy ?? "—"}</td>
                <td className="px-4 py-3">{statusBadge(p.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PromoPerformanceTab() {
  const totalPromo = mockPromoPerformance.reduce((s, m) => s + m.promoRevenue, 0);
  const totalNormal = mockPromoPerformance.reduce((s, m) => s + m.normalRevenue, 0);
  const total = totalPromo + totalNormal;
  const promoShare = total > 0 ? Math.round((totalPromo / total) * 100) : 0;

  return (
    <div className="p-4 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "ยอดขายผ่านโปรโมชั่น (6 เดือน)", value: formatCurrency(totalPromo), color: "#e60023" },
          { label: "ยอดขายปกติ (6 เดือน)", value: formatCurrency(totalNormal), color: "#f87171" },
          { label: "สัดส่วนยอดขายผ่านโปร", value: `${promoShare}%`, color: "#059669" },
          { label: "โปรโมชั่นที่วิเคราะห์", value: `${mockPromotions.length} แคมเปญ`, color: "#7c3aed" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-[var(--border)] p-3.5">
            <div className="text-[0.72rem] text-[var(--muted-foreground)] mb-1">{kpi.label}</div>
            <div className="text-[1.15rem] font-700" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] p-4">
        <div className="text-[0.82rem] font-600 mb-3">ยอดขายผ่านโปรโมชั่น vs ปกติ (รายเดือน)</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={mockPromoPerformance} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v, name) => [formatCurrency(Number(v)), name === "promoRevenue" ? "ผ่านโปร" : "ปกติ"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
            />
            <Bar dataKey="promoRevenue" fill="#e60023" radius={[4, 4, 0, 0]} name="promoRevenue" />
            <Bar dataKey="normalRevenue" fill="#f87171" radius={[4, 4, 0, 0]} name="normalRevenue" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-end text-[0.72rem] text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#e60023" }} />ผ่านโปรโมชั่น</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#f87171" }} />ปกติ</span>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--muted)] text-[0.78rem] font-600">ผลลัพธ์รายโปรโมชั่น</div>
        <table className="w-full text-[0.82rem]">
          <thead style={{ background: "var(--muted)" }}>
            <tr>
              {["โปรโมชั่น", "ประเภท", "ส่วนลด", "ใช้แล้ว", "ยอดขายที่เกิด", "Tier", "วันสิ้นสุด", "สถานะ"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockPromotions.map((p) => (
              <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                <td className="px-4 py-3 font-500">{p.name}</td>
                <td className="px-4 py-3"><Badge variant="secondary">{p.type === "percent" ? "%" : "฿"}</Badge></td>
                <td className="px-4 py-3 font-600" style={{ color: "#ea580c" }}>
                  {p.type === "percent" ? `${p.value}%` : formatCurrency(p.value)}
                </td>
                <td className="px-4 py-3">
                  <span className="font-500">{(p as any).usedCount ?? 0}</span>
                  <span className="text-[var(--muted-foreground)] text-[0.72rem]"> ครั้ง</span>
                </td>
                <td className="px-4 py-3 font-600">
                  {(p as any).revenue ? formatCurrency((p as any).revenue) : <span className="text-[var(--muted-foreground)]">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.tier.map(t => <TierBadge key={t} tier={t} />)}
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.endDate}</td>
                <td className="px-4 py-3">{statusBadge(p.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── โมดอลฟอร์มฝั่งการตลาด ───────────────────────── */
const mInput = "w-full h-9 px-3 text-[0.82rem] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--ring)] bg-[var(--card)]";

function MarketingModal({
  title, subtitle, onClose, onSubmit, submitLabel, disabled, danger, children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled?: boolean;
  danger?: boolean;
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
            style={{ background: danger ? "#dc2626" : "#ea580c" }}
          >
            {danger ? <Trash2 size={14} /> : <Plus size={14} />}{submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function MField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[0.78rem] font-500 mb-1.5">{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
    </div>
  );
}

const TIER_COLORS = ["#6b7280", "#d97706", "#2563eb", "#7c3aed", "#059669", "#dc2626", "#0d9488", "#db2777"];

/* ── ฟอร์มลูกค้า (ใช้ร่วมกันระหว่างเพิ่ม/แก้ไข) ── */
function CustomerFields({ name, setName, tier, setTier, contact, setContact, phone, setPhone, salesOwner, setSalesOwner, tierOptions }: {
  name: string; setName: (v: string) => void; tier: string; setTier: (v: string) => void;
  contact: string; setContact: (v: string) => void; phone: string; setPhone: (v: string) => void;
  salesOwner: string; setSalesOwner: (v: string) => void; tierOptions: string[];
}) {
  return (
    <>
      <MField label="ชื่อลูกค้า / บริษัท" required><input className={mInput} value={name} onChange={e => setName(e.target.value)} placeholder="เช่น บริษัท กรีนโซลาร์ จำกัด" /></MField>
      <div className="grid grid-cols-2 gap-3.5">
        <MField label="Tier" required>
          <select className={mInput} value={tier} onChange={e => setTier(e.target.value)}>
            {tierOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </MField>
        <MField label="ผู้ดูแล (Sales)"><input className={mInput} value={salesOwner} onChange={e => setSalesOwner(e.target.value)} /></MField>
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        <MField label="ผู้ติดต่อ" required><input className={mInput} value={contact} onChange={e => setContact(e.target.value)} /></MField>
        <MField label="เบอร์โทร" required><input className={mInput} value={phone} onChange={e => setPhone(e.target.value)} /></MField>
      </div>
    </>
  );
}

function ApprovalNote({ verb }: { verb: string }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[0.72rem] text-amber-700">
      <Info size={13} className="mt-0.5 flex-shrink-0" />
      <span>คำขอ{verb}นี้จะอยู่สถานะ <strong>รออนุมัติ</strong> จนกว่าผู้บริหารจะอนุมัติ จึงจะมีผล</span>
    </div>
  );
}

/* ── เพิ่มลูกค้า ── */
function AddCustomerModal({ onClose, onSubmit, approval }: {
  onClose: () => void;
  approval?: boolean;
  onSubmit: (c: { name: string; tier: string; contact: string; phone: string; salesOwner: string }) => void;
}) {
  const tierOptions = useErpStore().tiers.filter(t => t.status === "active").map(t => t.label);
  const [name, setName] = useState("");
  const [tier, setTier] = useState(tierOptions[0] ?? "ทั่วไป");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [salesOwner, setSalesOwner] = useState("วิภา สุขใจ");
  const invalid = !name.trim() || !contact.trim() || !phone.trim();

  return (
    <MarketingModal
      title="เพิ่มลูกค้าใหม่" subtitle={approval ? "ลูกค้าใหม่ต้องผ่านการอนุมัติก่อนใช้งาน" : "เพิ่มข้อมูลลูกค้าและ Tier"}
      onClose={onClose} submitLabel={approval ? "ส่งขออนุมัติ" : "เพิ่มลูกค้า"} disabled={invalid}
      onSubmit={() => onSubmit({ name, tier, contact, phone, salesOwner })}
    >
      <CustomerFields {...{ name, setName, tier, setTier, contact, setContact, phone, setPhone, salesOwner, setSalesOwner, tierOptions }} />
      {approval && <ApprovalNote verb="เพิ่มลูกค้า" />}
    </MarketingModal>
  );
}

/* ── แก้ไขลูกค้า (รวมแก้ Tier) ── */
function EditCustomerModal({ customer, onClose, onSubmit, approval }: {
  customer: Customer;
  onClose: () => void;
  approval?: boolean;
  onSubmit: (patch: CustomerPatch) => void;
}) {
  const activeTiers = useErpStore().tiers.filter(t => t.status === "active").map(t => t.label);
  const tierOptions = activeTiers.includes(customer.tier) ? activeTiers : [customer.tier, ...activeTiers];
  const [name, setName] = useState(customer.name);
  const [tier, setTier] = useState(customer.tier);
  const [contact, setContact] = useState(customer.contact);
  const [phone, setPhone] = useState(customer.phone);
  const [salesOwner, setSalesOwner] = useState(customer.salesOwner);
  const invalid = !name.trim() || !contact.trim() || !phone.trim();

  return (
    <MarketingModal
      title="แก้ไขข้อมูลลูกค้า" subtitle={approval ? "การแก้ไขต้องผ่านการอนุมัติก่อนมีผล" : `แก้ไข ${customer.name}`}
      onClose={onClose} submitLabel={approval ? "ส่งขออนุมัติแก้ไข" : "บันทึกการแก้ไข"} disabled={invalid}
      onSubmit={() => onSubmit({ name, tier, contact, phone, salesOwner })}
    >
      <CustomerFields {...{ name, setName, tier, setTier, contact, setContact, phone, setPhone, salesOwner, setSalesOwner, tierOptions }} />
      {approval && <ApprovalNote verb="แก้ไขลูกค้า" />}
    </MarketingModal>
  );
}

/* ── เพิ่มโปรโมชั่น (ต้องอนุมัติ) ── */
function AddPromotionModal({ onClose, onSubmit, createdBy }: {
  onClose: () => void;
  createdBy: string;
  onSubmit: (p: { name: string; type: string; value: number; tier: string[]; startDate: string; endDate: string; createdBy: string }) => void;
}) {
  const tierOptions = useErpStore().tiers.filter(t => t.status === "active").map(t => t.label);
  const [name, setName] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState(5);
  const [tier, setTier] = useState<string[]>(["Dealer"]);
  const [startDate, setStartDate] = useState("2024-07-01");
  const [endDate, setEndDate] = useState("2024-09-30");
  const invalid = !name.trim() || value <= 0 || tier.length === 0;

  function toggleTier(t: string) {
    setTier(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  return (
    <MarketingModal
      title="เพิ่มโปรโมชั่น" subtitle="โปรโมชั่นใหม่ต้องผ่านการอนุมัติก่อนมีผล"
      onClose={onClose} submitLabel="ส่งขออนุมัติ" disabled={invalid}
      onSubmit={() => onSubmit({ name, type, value, tier, startDate, endDate, createdBy })}
    >
      <MField label="ชื่อแคมเปญ" required><input className={mInput} value={name} onChange={e => setName(e.target.value)} placeholder="เช่น โปรกลางปี Q3" /></MField>
      <div className="grid grid-cols-2 gap-3.5">
        <MField label="ประเภทส่วนลด" required>
          <select className={mInput} value={type} onChange={e => setType(e.target.value)}>
            <option value="percent">เปอร์เซ็นต์ (%)</option>
            <option value="fixed">จำนวนเงิน (฿)</option>
          </select>
        </MField>
        <MField label={type === "percent" ? "ส่วนลด (%)" : "ส่วนลด (บาท)"} required>
          <input type="number" min={0} className={mInput} value={value} onChange={e => setValue(Number(e.target.value))} />
        </MField>
      </div>
      <MField label="Tier ที่ใช้ได้" required>
        <div className="flex flex-wrap gap-2">
          {tierOptions.map(t => {
            const on = tier.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTier(t)}
                className={`px-3 h-8 rounded-full text-[0.76rem] font-500 border transition-colors ${on ? "bg-orange-50 border-orange-300 text-orange-600" : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </MField>
      <div className="grid grid-cols-2 gap-3.5">
        <MField label="เริ่ม"><input className={mInput} value={startDate} onChange={e => setStartDate(e.target.value)} /></MField>
        <MField label="สิ้นสุด"><input className={mInput} value={endDate} onChange={e => setEndDate(e.target.value)} /></MField>
      </div>
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[0.72rem] text-amber-700">
        <Info size={13} className="mt-0.5 flex-shrink-0" />
        <span>โปรโมชั่นจะอยู่สถานะ <strong>รออนุมัติ</strong> จนกว่าผู้บริหารจะอนุมัติ จึงจะ Active</span>
      </div>
    </MarketingModal>
  );
}

/* ── จัดการนิยาม Tier ลูกค้า (การตลาดเสนอ · ผู้บริหารอนุมัติ) ── */
function TierManageTable({ search, manageMode, canApprove, requestedBy }: {
  search: string;
  manageMode?: "direct" | "approval";
  canApprove?: boolean;
  requestedBy?: string;
}) {
  const { tiers, updateTier, deleteTier, approveTier, rejectTier } = useErpStore();
  const [editing, setEditing] = useState<Tier | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tier | null>(null);
  const data = tiers.filter(t => t.label.includes(search));
  const showActions = !!manageMode || !!canApprove;
  const headers = ["Tier", "ส่วนลดจากราคาฐาน", "รับโปรโมชั่นอื่น", "สถานะ"];

  return (
    <div>
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)] text-[0.75rem] text-[var(--muted-foreground)]">
        นิยาม Tier ลูกค้า · <span className="font-500">ส่วนลดจากราคาฐาน</span> = ส่วนลดจากราคา &ldquo;ทั่วไป&rdquo; (ยิ่ง % สูง ยิ่งถูก) · <span className="font-500">รับโปรโมชั่นอื่น</span> = ใช้โปรโมชั่นซ้อนได้หรือไม่
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[0.82rem]">
          <thead style={{ background: "var(--muted)" }}>
            <tr>
              {headers.map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
              ))}
              {showActions && <th className="px-4 py-2.5 text-right font-600 text-[0.75rem] text-[var(--muted-foreground)] whitespace-nowrap">จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((t) => {
              const pending = t.pendingAction ?? null;
              const patch = pending === "edit" ? (t.pendingPatch ?? {}) : {};
              const dispLabel = patch.label ?? t.label;
              const dispColor = patch.color ?? t.color;
              const dispDiscount = patch.discountPercent ?? t.discountPercent;
              const dispAllow = patch.allowPromotions ?? t.allowPromotions;
              return (
                <tr key={t.id} className={`border-t border-[var(--border)] hover:bg-[var(--muted)] transition-colors ${pending === "delete" ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: dispColor }} />
                      <span className="font-500">{dispLabel}</span>
                      {patch.label && patch.label !== t.label && <span className="text-[0.72rem] text-orange-600">(เดิม {t.label})</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {dispDiscount}%
                    {patch.discountPercent != null && patch.discountPercent !== t.discountPercent && (
                      <span className="ml-1.5 text-[0.72rem] text-orange-600">(เดิม {t.discountPercent}%)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {dispAllow ? <Badge variant="success">ได้</Badge> : <Badge variant="ghost">ไม่ได้</Badge>}
                    {patch.allowPromotions != null && patch.allowPromotions !== t.allowPromotions && (
                      <span className="ml-1.5 text-[0.72rem] text-orange-600">(เดิม {t.allowPromotions ? "ได้" : "ไม่ได้"})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {statusBadge(t.status)}
                      {pending && <Badge variant="warning"><Clock size={10} />{PENDING_LABEL[pending]}</Badge>}
                    </div>
                  </td>
                  {showActions && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {pending && canApprove ? (
                          <>
                            <button
                              onClick={() => approveTier(t.id)}
                              className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[0.73rem] font-500 text-white bg-green-600 hover:bg-green-700 transition-colors"
                            >
                              <Check size={12} />อนุมัติ
                            </button>
                            <button
                              onClick={() => rejectTier(t.id)}
                              className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[0.73rem] font-500 border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <X size={12} />ปฏิเสธ
                            </button>
                          </>
                        ) : pending && !canApprove ? (
                          <span className="text-[0.72rem] text-[var(--muted-foreground)] italic">รอผู้บริหารอนุมัติ</span>
                        ) : manageMode ? (
                          <>
                            <button
                              onClick={() => setEditing(t)}
                              className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[0.73rem] font-500 border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                            >
                              <FileEdit size={12} />แก้ไข
                            </button>
                            <button
                              onClick={() => setConfirmDelete(t)}
                              className="flex items-center gap-1 px-2.5 h-7 rounded-md text-[0.73rem] font-500 border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={12} />ลบ
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditTierModal
          tier={editing}
          approval={manageMode === "approval"}
          onClose={() => setEditing(null)}
          onSubmit={(patch) => {
            updateTier(editing.id, patch, manageMode === "approval" ? { needsApproval: true, requestedBy } : undefined);
            setEditing(null);
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmDeleteTierModal
          tier={confirmDelete}
          approval={manageMode === "approval"}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteTier(confirmDelete.id, manageMode === "approval" ? { needsApproval: true, requestedBy } : undefined);
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
  );
}

/* ── ฟอร์ม Tier (ใช้ร่วมกันระหว่างเพิ่ม/แก้ไข) ── */
function TierFields({ label, setLabel, color, setColor, discount, setDiscount, allow, setAllow }: {
  label: string; setLabel: (v: string) => void;
  color: string; setColor: (v: string) => void;
  discount: number; setDiscount: (v: number) => void;
  allow: boolean; setAllow: (v: boolean) => void;
}) {
  return (
    <>
      <MField label="ชื่อ Tier" required><input className={mInput} value={label} onChange={e => setLabel(e.target.value)} placeholder="เช่น พรีเมี่ยม" /></MField>
      <MField label="สี">
        <div className="flex flex-wrap gap-2">
          {TIER_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? "border-[var(--foreground)] scale-110" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </MField>
      <MField label="ส่วนลดจากราคาฐาน (%)">
        <input type="number" min={0} max={100} className={mInput} value={discount} onChange={e => setDiscount(Number(e.target.value))} />
      </MField>
      <MField label="รับโปรโมชั่นอื่นซ้อนได้ไหม">
        <div className="flex gap-2">
          <button
            onClick={() => setAllow(true)}
            className={`px-4 h-9 rounded-lg text-[0.8rem] font-500 border transition-colors ${allow ? "bg-green-50 border-green-300 text-green-700" : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}
          >
            ได้
          </button>
          <button
            onClick={() => setAllow(false)}
            className={`px-4 h-9 rounded-lg text-[0.8rem] font-500 border transition-colors ${!allow ? "bg-red-50 border-red-300 text-red-600" : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"}`}
          >
            ไม่ได้
          </button>
        </div>
      </MField>
    </>
  );
}

/* ── เพิ่ม Tier ── */
function AddTierModal({ onClose, onSubmit, approval }: {
  onClose: () => void;
  approval?: boolean;
  onSubmit: (t: { label: string; color: string; discountPercent: number; allowPromotions: boolean }) => void;
}) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(TIER_COLORS[4]);
  const [discount, setDiscount] = useState(0);
  const [allow, setAllow] = useState(true);
  const invalid = !label.trim();

  return (
    <MarketingModal
      title="เพิ่ม Tier ใหม่" subtitle={approval ? "Tier ใหม่ต้องผ่านการอนุมัติก่อนใช้งาน" : "กำหนดนิยาม Tier ลูกค้า"}
      onClose={onClose} submitLabel={approval ? "ส่งขออนุมัติ" : "เพิ่ม Tier"} disabled={invalid}
      onSubmit={() => onSubmit({ label, color, discountPercent: discount, allowPromotions: allow })}
    >
      <TierFields {...{ label, setLabel, color, setColor, discount, setDiscount, allow, setAllow }} />
      {approval && <ApprovalNote verb="เพิ่ม Tier" />}
    </MarketingModal>
  );
}

/* ── แก้ไข Tier ── */
function EditTierModal({ tier, onClose, onSubmit, approval }: {
  tier: Tier;
  onClose: () => void;
  approval?: boolean;
  onSubmit: (patch: TierPatch) => void;
}) {
  const [label, setLabel] = useState(tier.label);
  const [color, setColor] = useState(tier.color);
  const [discount, setDiscount] = useState(tier.discountPercent);
  const [allow, setAllow] = useState(tier.allowPromotions);
  const invalid = !label.trim();

  return (
    <MarketingModal
      title="แก้ไข Tier" subtitle={approval ? "การแก้ไขต้องผ่านการอนุมัติก่อนมีผล" : `แก้ไข ${tier.label}`}
      onClose={onClose} submitLabel={approval ? "ส่งขออนุมัติแก้ไข" : "บันทึกการแก้ไข"} disabled={invalid}
      onSubmit={() => onSubmit({ label, color, discountPercent: discount, allowPromotions: allow })}
    >
      <TierFields {...{ label, setLabel, color, setColor, discount, setDiscount, allow, setAllow }} />
      {approval && <ApprovalNote verb="แก้ไข Tier" />}
    </MarketingModal>
  );
}

/* ── ยืนยันลบ Tier ── */
function ConfirmDeleteTierModal({ tier, approval, onClose, onConfirm }: {
  tier: Tier; approval: boolean; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <MarketingModal
      title="ยืนยันการลบ Tier"
      subtitle={approval ? "คำขอลบจะถูกส่งให้ผู้บริหารอนุมัติก่อน" : "ลบนิยาม Tier ออกจากระบบทันที"}
      onClose={onClose} submitLabel={approval ? "ส่งขออนุมัติลบ" : "ลบ Tier"}
      onSubmit={onConfirm} danger
    >
      <div className="text-[0.85rem]">
        ต้องการลบ Tier <span className="font-700">{tier.label}</span> หรือไม่?
      </div>
      {approval && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[0.72rem] text-amber-700">
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          <span>คำขอลบจะอยู่สถานะ <strong>รออนุมัติ</strong> จนกว่าผู้บริหารจะอนุมัติ จึงจะมีผล</span>
        </div>
      )}
    </MarketingModal>
  );
}
