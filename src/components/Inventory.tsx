import React, { useState } from "react";
import { Product, SystemConfig } from "../types";
import { 
  Plus, Search, Download, Trash2, Calendar, ShieldCheck, 
  RefreshCcw, FileSpreadsheet, ArrowRightLeft, SlidersHorizontal, Settings2 
} from "lucide-react";
import { apiFetch } from "../utils";

interface InventoryProps {
  products: Product[];
  transactions: Array<any>;
  config: SystemConfig;
  userRole: string;
  onRefresh: () => void;
  setView: (view: string) => void;
}

export default function Inventory({ products, transactions, config, userRole, onRefresh, setView }: InventoryProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"balance" | "history">("balance");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Extract list of all unique categories present in inventory
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.sku.toLowerCase().includes(search.toLowerCase()) || 
                          p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Export functions to trigger instant client-side downloads as CSV
  // works perfectly without server requirements!
  const downloadInventoryCSV = () => {
    const headers = ["SKU Code", "Product Name", "Available Quantity", "Category Group", "Last Timestamp"];
    const rows = filteredProducts.map(p => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.quantity,
      `"${p.category.replace(/"/g, '""')}"`,
      p.lastUpdated
    ]);

    const csvContent = "\ufeff" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Stock_Balance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTransactionsCSV = () => {
    const headers = ["Activity ID", "Record Type", "SKU Code", "Product Description", "Volume Quantity", "Platform Market", "Courier Carrier", "Timestamp", "Operated User"];
    const rows = transactions.map(t => [
      t.id,
      t.type === "import" ? "IMPORT" : "EXPORT",
      t.sku,
      `"${t.name.replace(/"/g, '""')}"`,
      t.quantity,
      t.platform || "N/A",
      t.courier || "N/A",
      t.timestamp,
      t.user || "system"
    ]);

    const csvContent = "\ufeff" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Inventory_Activity_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sync fully to the Google Web App Hook
  const handleFullSyncToSheets = async () => {
    if (!config.googleSheetsUrl) {
      setSyncFeedback("❌ ไม่พบ URL สำหรับประสานข้อมูล Google Sheets! แอดมินกรุณาตั้งค่า URL บนแผงควบคุมแอดมิน");
      return;
    }

    setSyncLoading(true);
    setSyncFeedback(null);

    try {
      const resp = await apiFetch("/api/settings/sheets-sync-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const resData = await resp.json();
      if (!resp.ok) {
        throw new Error(resData.error || "ขัดข้องการเชื่อมส่ง");
      }

      setSyncFeedback(`✅ จัดเก็บสำเร็จ! Google Web App ตอบกลับ: ${resData.message}`);
    } catch (err: any) {
      setSyncFeedback(`❌ เช็คสคริปต์ล้มเหลว: ${err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div id="inventory-view-panel" className="space-y-6">
      
      {/* Visual Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 id="inventory-main-title" className="text-2xl font-black text-slate-950 font-sans tracking-tight">จัดการระดับคลังสินค้า & รายงาน</h2>
          <p className="text-slate-500 text-xs">ตรวจสอบปริมาณสินค้า เช็คประวัตินำส่งออก และออกรายงานเป็นไฟล์ CSV/Sheet</p>
        </div>
        
        {/* Quick action triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-trigger-import-view"
            onClick={() => setView("import")}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-neutral-950 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-950/10 transition-all cursor-pointer border border-transparent"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>รับสินค้าเข้า [+]</span>
          </button>
          <button
            id="btn-trigger-export-view"
            onClick={() => setView("export")}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-all cursor-pointer border border-transparent"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>ส่งสินค้าออก [-]</span>
          </button>
        </div>
      </div>

      {/* Main Container Sections tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/40 justify-between items-center px-4 py-1">
          <div className="flex space-x-1.5">
            <button
              id="tab-inventory-balance"
              onClick={() => setActiveTab("balance")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeTab === "balance"
                  ? "bg-white text-indigo-600 border-indigo-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-50/50"
              }`}
            >
              คลังสินค้าคงเหลือจริง
            </button>
            <button
              id="tab-inventory-history"
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeTab === "history"
                  ? "bg-white text-indigo-600 border-indigo-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-50/50"
              }`}
            >
              ประวัติการเดินสต๊อกรับเข้า-จ่ายออก
            </button>
          </div>

          <div id="quick-refresh-sec" className="flex items-center space-x-2 shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden xs:inline">Live System Running</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden xs:inline"></span>
            <button
              id="btn-refresh-inventory"
              onClick={onRefresh}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Content 1: Live Stock Balance */}
        {activeTab === "balance" && (
          <div id="tab-balance-content" className="p-5 space-y-4">
            
            {/* Filter toolbars block */}
            <div className="flex flex-col md:flex-row gap-3">
              
              {/* Searchbox tool */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  id="input-inventory-live-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาสินค้าด้วยชื่อ หรือรหัสสินค้า SKU..."
                  className="block w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white placeholder:text-slate-300 transition-all"
                />
              </div>

              {/* Category picker dropdown */}
              <div className="flex items-center space-x-2 shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-450" />
                <select
                  id="select-inventory-category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-medium cursor-pointer focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="all">ทุกประเภทหมวดหมู่</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Reporting export actions */}
              <div className="flex gap-2">
                <button
                  id="btn-export-excel-csv"
                  onClick={downloadInventoryCSV}
                  className="flex items-center justify-center space-x-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-all hover:border-slate-305"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ส่งออก Excel/CSV</span>
                </button>

                <button
                  id="btn-export-google-sheets-sync"
                  onClick={handleFullSyncToSheets}
                  disabled={syncLoading}
                  className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-emerald-50 border border-emerald-150 hover:bg-emerald-100/50 text-emerald-700 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40 transition-all font-sans"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${syncLoading ? "animate-spin" : ""}`} />
                  <span>ซิงก์ Google Sheet</span>
                </button>
              </div>
            </div>

            {/* Sync sheets operation logs feedback */}
            {syncFeedback && (
              <div id="sheets-sync-status-alert" className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs flex items-center justify-between font-sans">
                <span className="font-semibold text-slate-800">{syncFeedback}</span>
                {config.googleSheetsUrl && (
                  <a
                    id="link-google-sheet-db"
                    href={config.googleSheetsUrl.split("/exec")[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-650 hover:text-indigo-800 hover:underline font-bold transition-all"
                  >
                    เปิดไฟล์ชีต ↗
                  </a>
                )}
              </div>
            )}

            {/* Main Products Stock Balance Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="min-w-full divide-y divide-slate-100 text-xs sm:text-xs">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-left font-bold border-b border-slate-100">
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">รหัสสินค้า / SKU</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">หมวดหมู่</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">ชื่อสินค้าคงคลั่ง</th>
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">จำนวนสินค้าคงคลังปัจจุบัน</th>
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">วันเวลาอัปเดตล่าสุด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => {
                      const isLowStock = p.quantity <= 10;
                      return (
                        <tr key={p.sku} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.sku}</td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 bg-slate-50 text-slate-650 rounded-lg text-[10px] font-bold border border-slate-100">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-850">{p.name}</td>
                          <td className="px-4 py-3 text-right font-bold">
                            <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-black ${
                              isLowStock 
                                ? "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse" 
                                : "bg-slate-50 text-slate-700 border border-slate-100/80"
                            }`}>
                              {p.quantity.toLocaleString()} ชิ้น
                              {isLowStock && " (สต๊อกใกล้หมด!)"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400 text-xs font-mono">
                            {new Date(p.lastUpdated).toLocaleString("th-TH")}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-sans">
                        ไม่พบข้อมูลสินค้าที่ต้องการแสดงในขณะนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 2: Raw Transaction History Logging */}
        {activeTab === "history" && (
          <div id="tab-history-content" className="p-5 space-y-4">
            
            {/* Toolbar row with export list buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h4 className="text-xs font-black text-slate-900 font-sans uppercase tracking-tight">บันทึกธุรกรรมความต้องการเดินคลังสินค้าสะสม</h4>
              <button
                id="btn-export-history-csv"
                onClick={downloadTransactionsCSV}
                className="flex items-center justify-center space-x-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>ดาวน์โหลดรายงานประวัติ (CSV)</span>
              </button>
            </div>

            {/* History grid lists table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="min-w-full divide-y divide-slate-100 text-xs sm:text-xs">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-left font-bold border-b border-slate-100">
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">ประเภท</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">รหัส SKU</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">ชื่อสินค้าแสดง</th>
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">จำนวนปริมาณ</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">ข้อมูลจัดส่ง (ส่งออกเท่านั้น)</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">ผู้ทำรายการ</th>
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider">วันเวลาเดินคลัง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium font-sans">
                  {transactions.length > 0 ? (
                    transactions.map((trans) => {
                      const isImport = trans.type === "import";
                      return (
                        <tr key={trans.id} className="hover:bg-slate-50/40 transition-all">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${
                              isImport ? "bg-slate-900 border-transparent text-white" : "bg-indigo-50 border-indigo-150 text-indigo-750 font-bold"
                            }`}>
                              {isImport ? "นำเข้า [+] " : "ส่งออก [-]"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400 font-bold">{trans.sku}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{trans.name}</td>
                          <td className="px-4 py-3 text-right font-black text-slate-950 font-mono">
                            {isImport ? "+" : "-"}{trans.quantity}
                          </td>
                          <td className="px-4 py-3">
                            {!isImport ? (
                              <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                                <span className="bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded-lg">
                                  {trans.platform}
                                </span>
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-lg">
                                  {trans.courier}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-semibold">{trans.user || "ระบบออโต้"}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">
                            {new Date(trans.timestamp).toLocaleString("th-TH")}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        ยังไม่พบประวัติข้อมูลกิจกรรมเดินสต๊อกสินค้าในระบบ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
