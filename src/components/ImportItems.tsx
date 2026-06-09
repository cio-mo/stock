import React, { useState } from "react";
import { Product } from "../types";
import { ArrowUpToLine, Plus, Search, Archive, AlertCircle, Sparkles } from "lucide-react";
import { apiFetch } from "../utils";

interface ImportItemsProps {
  products: Product[];
  onImportSuccess: () => void;
}

export default function ImportItems({ products, onImportSuccess }: ImportItemsProps) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Derive categories already used for helpful suggestions
  const existingCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Filter products for the quick-select panel
  const filteredQuickSelect = products.filter(p => 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickSelect = (p: Product) => {
    setSku(p.sku);
    setName(p.name);
    setCategory(p.category);
    setNotification(null);
  };

  const handleClear = () => {
    setSku("");
    setName("");
    setQuantity("");
    setCategory("");
    setNotification(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name || !quantity || !category) {
      setNotification({ type: "error", text: "กรุณาระบุข้อมูลสำหรับรับสินค้าให้ครบถ้วน" });
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setNotification({ type: "error", text: "จำนวนสินค้านำเข้าต้องมากกว่า 0" });
      return;
    }

    setLoading(true);
    setNotification(null);

    try {
      const response = await apiFetch("/api/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, name, quantity: qty, category }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ล้มเหลวในการบันทึกข้อมูล");
      }

      setNotification({ 
        type: "success", 
        text: `รับเข้าสินค้าสำเร็จ! [SKU: ${data.product.sku}] จำนวนคงคลังใหม่: ${data.product.quantity} ชิ้น` 
      });

      // Clear input fields (keep some states or clean up)
      setSku("");
      setName("");
      setQuantity("");
      setCategory("");
      onImportSuccess(); // Refresh parents stock
    } catch (err: any) {
      setNotification({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="import-view-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Receiving Entry Form */}
      <div id="import-form-card" className="bg-white p-6 rounded-2xl border border-slate-205 lg:col-span-2 shadow-xs flex flex-col justify-between">
        <div>
          <h2 id="import-form-header" className="text-lg font-black text-slate-900 mb-2 flex items-center space-x-2">
            <ArrowUpToLine className="w-5 h-5 text-indigo-600" />
            <span>บันทึกการรับเข้าสินค้า (Stock Import)</span>
          </h2>
          <p className="text-slate-500 text-xs mb-6">กรอกข้อมูลเพื่อนำสินค้าเข้าสต๊อก หรือเลือกจากกล่องรายการด่วนขวาเพื่อดึงข้อมูลอย่างเร็วในสไตล์ Bento</p>

          {notification && (
            <div
              id="import-notification"
              className={`mb-5 p-4 rounded-xl text-xs flex items-start space-x-2 border ${
                notification.type === "success"
                  ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                  : "bg-rose-50 border-rose-250 text-rose-800"
              }`}
            >
              <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${notification.type === "success" ? "text-emerald-600" : "text-rose-600"}`} />
              <span className="font-semibold">{notification.text}</span>
            </div>
          )}

          <form id="form-import-entry" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* SKU Field with Scan hint */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">รหัสสินค้า / SKU *</label>
                <input
                  id="input-import-sku"
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="เช่น TSH-001"
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Category selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">หมวดหมู่สินค้า *</label>
                <div className="relative">
                  <input
                    id="input-import-category"
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="เช่น เสื้อผ้าแฟชั่น"
                    className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                  
                  {/* Small suggestion tags */}
                  {existingCategories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {existingCategories.slice(0, 4).map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg transition-colors border border-slate-200/50"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">ชื่อแสดงสินค้า *</label>
              <input
                id="input-import-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น เสื้อยืดคอตตอน Basic Black ไซส์ L"
                className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">จำนวนที่นำเข้าคลังสินค้า *</label>
              <div className="relative rounded-xl">
                <input
                  id="input-import-qty"
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="ระบุจำนวนตัวเลข เช่น 50"
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                id="btn-clear-import"
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-slate-300"
              >
                ล้างฟอร์ม
              </button>
              <button
                id="btn-submit-import"
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 transition-all border border-transparent"
              >
                {loading ? "กำลังทำรายการ..." : "ตรวจสอบและรับเข้าคลัง"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Search & Quick Select existing products */}
      <div id="import-quick-select-card" className="bg-white p-5 rounded-2xl border border-slate-200/90 flex flex-col h-[480px] shadow-xs">
        <h3 id="quick-select-header" className="text-sm font-black text-slate-900 mb-1 flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span>ดึงข้อมูลสินค้าด่วน</span>
        </h3>
        <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">ค้นหาและเลือกสินค้าเดิมที่มีในสต๊อก เพื่อดึงรหัส ประเภท และชื่อมาใช้ได้ทันที</p>

        {/* Quick select search */}
        <div className="relative mb-4">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            id="input-search-quickselect"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามชื่อ/รหัส SKU"
            className="block w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 no-scrollbar pr-1">
          {filteredQuickSelect.length > 0 ? (
            filteredQuickSelect.map((p) => (
              <button
                key={p.sku}
                type="button"
                id={`quick-select-item-${p.sku}`}
                onClick={() => handleQuickSelect(p)}
                className="w-full text-left py-2.5 px-2 hover:bg-slate-50 rounded-xl transition-all flex justify-between items-center group cursor-pointer border border-transparent hover:border-slate-100"
              >
                <div className="truncate pr-2">
                  <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-650 transition-colors">{p.name}</h5>
                  <p className="font-mono text-[10px] text-slate-400 mt-0.5">SKU: {p.sku} | {p.category}</p>
                </div>
                <div className="bg-slate-50 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 font-mono text-[10px] px-2 py-1 rounded-lg font-bold shrink-0 transition-all border border-slate-100">
                  {p.quantity} ชิ้น
                </div>
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Archive className="w-8 h-8 mx-auto text-slate-200 mb-1" />
              <span>ไม่พบสินค้าที่ตรงกับการค้นหา</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
