import React, { useState, useEffect } from "react";
import { Product } from "../types";
import { Truck, CheckCircle2, AlertTriangle, ArrowRight, CornerDownRight } from "lucide-react";
import { apiFetch } from "../utils";

interface ExportItemsProps {
  products: Product[];
  onExportSuccess: () => void;
  setView: (v: string) => void;
}

export default function ExportItems({ products, onExportSuccess, setView }: ExportItemsProps) {
  const [selectedSku, setSelectedSku] = useState("");
  const [quantity, setQuantity] = useState("");
  const [platform, setPlatform] = useState<"TikTok" | "Shopee" | "Lazada" | "Facebook">("TikTok");
  const [courier, setCourier] = useState<"Flash" | "J&T" | "LEX" | "Best">("Flash");

  const [loading, setLoading] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // Platforms options
  const platforms = [
    { name: "TikTok", color: "bg-slate-950 text-white hover:bg-slate-900", activeRing: "ring-slate-950" },
    { name: "Shopee", color: "bg-orange-600 text-white hover:bg-orange-700", activeRing: "ring-orange-600" },
    { name: "Lazada", color: "bg-indigo-600 text-white hover:bg-indigo-700", activeRing: "ring-indigo-600" },
    { name: "Facebook", color: "bg-blue-600 text-white hover:bg-blue-700", activeRing: "ring-blue-600" },
  ];

  // Courier options
  const couriers = [
    { name: "Flash", color: "bg-amber-400 hover:bg-amber-500 border border-amber-300 text-slate-950", activeRing: "ring-amber-400", desc: "Flash Express" },
    { name: "J&T", color: "bg-red-600 hover:bg-red-700 border border-red-500 text-white", activeRing: "ring-red-600", desc: "J&T Express" },
    { name: "LEX", color: "bg-teal-600 hover:bg-teal-700 border border-teal-500 text-white", activeRing: "ring-teal-600", desc: "Lazada Express" },
    { name: "Best", color: "bg-violet-700 hover:bg-violet-800 border border-violet-600 text-white", activeRing: "ring-violet-700", desc: "Best Express" },
  ];

  // Selected product details
  const currentProduct = products.find(p => p.sku === selectedSku);
  const currentQty = currentProduct ? currentProduct.quantity : 0;
  const parsedQty = parseInt(quantity) || 0;
  const remainingQty = currentProduct ? currentQty - parsedQty : 0;

  // Validate quantities on state changes
  useEffect(() => {
    if (parsedQty > currentQty) {
      setErrorFeedback(`จํานวนสินค้าสต๊อกคงเหลือไม่เพียงพอ (สต๊อกปัจจุบัน: ${currentQty} ชิ้น)`);
    } else {
      setErrorFeedback(null);
    }
  }, [quantity, selectedSku, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessFeedback(null);

    if (!selectedSku) {
      setErrorFeedback("กรุณาเลือกสินค้าที่ต้องการส่งออก");
      return;
    }

    if (parsedQty <= 0) {
      setErrorFeedback("ระบุจำนวนตัวเลขที่มากกว่า 0");
      return;
    }

    if (parsedQty > currentQty) {
      setErrorFeedback("ไม่สามารถส่งออกเกินสต๊อกคงเหลือรวมได้");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/api/inventory/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: selectedSku,
          quantity: parsedQty,
          platform,
          courier,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการนำออกสินค้า");
      }

      setSuccessFeedback(`ส่งออกสำเร็จ! จัดส่งโดย: ${courier} ปลายทางแพลตฟอร์ม: ${platform} สต๊อกคงเหลือล่าสุด: ${data.product.quantity} ชิ้น`);
      
      // Reset inputs
      setSelectedSku("");
      setQuantity("");
      onExportSuccess(); // Notify parent stock data changed
    } catch (err: any) {
      setErrorFeedback(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="export-view-panel" className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs">
      <div className="flex items-center space-x-2.5 mb-2">
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h2 id="export-title" className="text-lg font-black text-slate-900 font-sans tracking-tight">ทําเรื่องส่งออกสินค้า & การตัดสต๊อกขนส่ง</h2>
          <p className="text-slate-500 text-xs">เลือก SKU สินค้า ช่องทางการขาย E-Commerce และค่ายโลจิสติกส์เพื่อทำการตัดคลัง</p>
        </div>
      </div>

      <div className="mt-8">
        
        {/* Success Alert Banner */}
        {successFeedback && (
          <div id="export-success-banner" className="mb-6 p-4 bg-emerald-50 border border-emerald-250 rounded-xl text-emerald-800 text-xs flex items-start space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-slate-900">เสร็จสิ้นรายการส่งออกจากคลัง</p>
              <p className="opacity-90 mt-0.5">{successFeedback}</p>
              <button
                id="btn-nav-to-dash-from-export"
                onClick={() => setView("dashboard")}
                className="mt-2 text-xs text-indigo-600 hover:text-indigo-750 font-bold transition-all underline shrink-0 cursor-pointer"
              >
                ดูสรุปผลบนแดชบอร์ดด้านหน้า →
              </button>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorFeedback && (
          <div id="export-error-banner" className="mb-6 p-4 bg-rose-50 border border-rose-250 rounded-xl text-rose-800 text-xs flex items-start space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <span className="font-semibold">{errorFeedback}</span>
          </div>
        )}

        <form id="form-export-shipping-entry" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Double column info: Item selection and quantities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50/40 rounded-2xl border border-slate-200/50">
            
            {/* SKU selection */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">1. ค้นเลือกรายการสินค้าที่ส่งออก *</label>
              <select
                id="select-export-sku"
                required
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="block w-full px-3 py-2.5 rounded-xl border border-slate-205 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-white font-medium cursor-pointer"
              >
                <option value="">-- เลือกรายการรหัสค้างสต๊อก --</option>
                {products.map(p => (
                  <option key={p.sku} value={p.sku}>
                    [{p.sku}] {p.name} (คงเหลือ: {p.quantity} ชิ้น)
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity inputs */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">2. จํากัดจํานวนชิ้นส่งสินค้าออก *</label>
              <input
                id="input-export-qty"
                type="number"
                required
                min="1"
                disabled={!selectedSku}
                placeholder={selectedSku ? `กรอกจำนวนชิ้นส่งออก` : "กรุณาเลือก SKU สินค้าก่อน"}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="block w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-white font-medium disabled:opacity-50"
              />
            </div>

          </div>

          {/* Visual Dynamic Preview (Current -> Post Calculation Level) */}
          {currentProduct && parsedQty > 0 && (
            <div id="export-preview-box" className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex justify-between items-center animate-fade-in font-medium">
              <div className="flex items-center space-x-2">
                <CornerDownRight className="w-4 h-4 text-indigo-500" />
                <span className="font-bold text-slate-700">พรีวิวการตัดสต๊อก:</span>
                <span className="text-slate-500 truncate max-w-[150px]">{currentProduct.name}</span>
              </div>
              <div className="flex items-center space-x-3 font-mono text-xs">
                <span className="font-bold text-slate-500">{currentQty} ชิ้น</span>
                <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className={`font-bold ${remainingQty < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {remainingQty} ชิ้น {remainingQty < 0 && "(สต๊อกไม่พอ!)"}
                </span>
              </div>
            </div>
          )}

          {/* Platform selection (Grid blocks) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3">3. ช่องทางจัดจำหน่ายคลัง (E-Commerce Platform) *</label>
            <div id="export-platform-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {platforms.map((plat) => {
                const isActive = platform === plat.name;
                return (
                  <button
                    key={plat.name}
                    id={`btn-export-platform-${plat.name}`}
                    type="button"
                    onClick={() => setPlatform(plat.name as any)}
                    className={`p-3.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? `${plat.color} ring-4 ${plat.activeRing}/20 ring-offset-1 scale-[1.01]` 
                        : "bg-white border border-slate-205 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {plat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Courier selection (Grid blocks) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-3">4. ขนส่งที่จัดส่งสินค้าจัดของ (Courier Carrier) *</label>
            <div id="export-courier-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {couriers.map((cour) => {
                const isActive = courier === cour.name;
                return (
                  <button
                    key={cour.name}
                    id={`btn-export-courier-${cour.name}`}
                    type="button"
                    onClick={() => setCourier(cour.name as any)}
                    className={`p-3.5 rounded-xl text-center transition-all cursor-pointer ${
                      isActive 
                        ? `${cour.color} ring-4 ${cour.activeRing}/20 ring-offset-1 scale-[1.01]` 
                        : "bg-white border border-slate-205 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-xs font-extrabold">{cour.name}</span>
                    <span className="block text-[9px] opacity-80 mt-0.5 font-bold uppercase">{cour.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form action buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
            <button
              id="btn-export-submit"
              type="submit"
              disabled={loading || parsedQty <= 0 || (currentQty < parsedQty)}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-transparent"
            >
              {loading ? "กำลังบันทึกและส่งรายงาน..." : "ยืนยันการตัดคลังสเตตัสพร้อมส่ง"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
