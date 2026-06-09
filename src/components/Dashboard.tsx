import React, { useState, useEffect } from "react";
import { Product, ImportRecord, ExportRecord } from "../types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { 
  TrendingUp, TrendingDown, Layers, Box, Calendar, ShoppingBag, 
  RefreshCcw, ArrowUpToLine, ShieldAlert, CheckCircle2, ChevronRight 
} from "lucide-react";

interface DashboardProps {
  products: Product[];
  transactions: Array<any>;
  onRefresh: () => void;
  setView: (view: string) => void;
}

export default function Dashboard({ products, transactions, onRefresh, setView }: DashboardProps) {
  const [totalImported, setTotalImported] = useState(0);
  const [totalExported, setTotalExported] = useState(0);
  
  // Color palette for charts
  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  useEffect(() => {
    // Process summaries
    const importedCount = transactions
      .filter(t => t.type === "import")
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    
    const exportedCount = transactions
      .filter(t => t.type === "export")
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    setTotalImported(importedCount);
    setTotalExported(exportedCount);
  }, [transactions]);

  // Calculations for charts
  // 1. Stock Category Distribution
  const categoryMap: Record<string, number> = {};
  products.forEach(p => {
    const cat = p.category || "อื่นๆ";
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(p.quantity || 0);
  });
  const categoryData = Object.keys(categoryMap).map(key => ({
    name: key,
    quantity: categoryMap[key],
  }));

  // 2. Export platform distribution
  const platformMap: Record<string, number> = {
    TikTok: 0,
    Shopee: 0,
    Lazada: 0,
    Facebook: 0,
  };
  transactions
    .filter(t => t.type === "export")
    .forEach(t => {
      const plat = t.platform || "อื่นๆ";
      platformMap[plat] = (platformMap[plat] || 0) + Number(t.quantity || 0);
    });
  const platformData = Object.keys(platformMap).map(key => ({
    name: key,
    value: platformMap[key],
  }));

  // 3. Export courier distribution
  const courierMap: Record<string, number> = {
    Flash: 0,
    "J&T": 0,
    LEX: 0,
    Best: 0,
  };
  transactions
    .filter(t => t.type === "export")
    .forEach(t => {
      const cour = t.courier || "อื่นๆ";
      courierMap[cour] = (courierMap[cour] || 0) + Number(t.quantity || 0);
    });
  const courierData = Object.keys(courierMap).map(key => ({
    name: key,
    value: courierMap[key],
  }));

  // Total current stock units in inventory
  const totalInStock = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);

  return (
    <div id="dashboard-view-panel" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 id="dashboard-title" className="text-2xl font-black text-slate-950 tracking-tight font-sans">แดชบอร์ดสรุปกิจกรรมคลังสินค้า</h1>
          <p className="text-slate-500 text-xs">ข้อมูลสรุปสต๊อก สถิติการขนส่ง และสัดส่วนยอดขายส่งออกแบบเรียลไทม์ในสไตล์ Bento Grid</p>
        </div>
        <button
          id="btn-refresh-dashboard"
          onClick={onRefresh}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-xl text-xs font-bold hover:bg-indigo-100/70 transition-all shadow-xs cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5 animate-pulse text-indigo-600" />
          <span>รีเฟรชอัปเดต</span>
        </button>
      </div>

      {/* Stats Bento Grid Panel */}
      <div id="dashboard-stats-bento" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Stat Item 1: Total SKU Count */}
        <div id="stat-card-instock" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total SKU Stock</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{totalInStock.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">SKU ในระบบ: {products.length} รายการ</span>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 shrink-0">
            <Box className="w-5 h-5" />
          </div>
        </div>

        {/* Stat Item 2: Daily Inbound (Imports) */}
        <div id="stat-card-imports" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily Inbound</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">+{totalImported.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">นำเข้ารวบรวมเสร็จแล้ว</span>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Stat Item 3: Daily Outbound (Exports) */}
        <div id="stat-card-exports" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daily Outbound</p>
            <p className="text-2xl font-black text-rose-600 mt-1">-{totalExported.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400 font-medium block mt-1">จ่ายออกคู่ขนส่งหลัก</span>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-xl text-rose-650 shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Stat Item 4: Google Sheets Sync (Slate 900 Dark Card) */}
        <div id="stat-card-sync-status" className="bg-slate-900 p-5 rounded-2xl text-white shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-[-15px] bottom-[-15px] text-slate-800 opacity-20 pointer-events-none">
            <Layers className="w-24 h-24 stroke-1" />
          </div>
          <div className="flex items-center justify-between mb-1.5 z-10">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Database Sync</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-450 animate-pulse"></span>
          </div>
          <p className="text-sm font-bold z-10">Google Sheets Sync: Live</p>
          <p className="text-[10px] text-slate-400 mt-1 italic z-10">หมวดหมู่แอป: {Object.keys(categoryMap).length} ประเภท</p>
        </div>

      </div>

      {/* Visual Analytics Grid Charts */}
      <div id="dashboard-charts-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Chart 1: Stock Quantity Bar Chart */}
        <div id="chart-card-categories" className="bg-white p-5 rounded-2xl border border-gray-100 lg:col-span-2">
          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>ระดับจำนวนสินค้าคงเหลือแยกตามหมวดหมู่</span>
          </h4>
          <div className="h-[280px] w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${value} ชิ้น`, "จำนวนคงเหลือ"]} />
                  <Bar dataKey="quantity" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                ไม่มีข้อมูลสินค้าคงคลังสำหรับการสร้างกราฟ
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: E-commerce Platform Shares */}
        <div id="chart-card-platforms" className="bg-white p-5 rounded-2xl border border-gray-100">
          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>อัตราส่วนยอดส่งออกแบ่งตามตลาดขายออนไลน์</span>
          </h4>
          <div className="h-[210px] w-full relative flex items-center justify-center">
            {platformData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} ชิ้น`, "จำนวนยอดขาย"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400 text-xs">
                ไม่มีสัดส่วนยอดขายชะลอนำส่งในขณะนี้
              </div>
            )}
          </div>

          {/* Dynamic Platform Legends */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {platformData.map((plat, idx) => (
              <div key={plat.name} className="flex items-center text-xs space-x-1.5 justify-start">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-gray-600 truncate">{plat.name}:</span>
                <span className="font-bold text-gray-850">{plat.value.toLocaleString()} ชิ้น</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform split by Courier logistics & Recent log bento */}
      <div id="dashboard-couriers-log" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Logistics Pie Distribution Chart */}
        <div id="chart-card-couriers" className="bg-white p-5 rounded-2xl border border-gray-100">
          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>ช่องทางการใช้บริการขนส่งพาร์ทเนอร์</span>
          </h4>
          <div className="h-[180px] w-full relative flex items-center justify-center">
            {courierData.some(c => c.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={courierData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={65}
                    dataKey="value"
                  >
                    {courierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} ชิ้น`, "นำส่ง"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400 text-xs">
                ยังไม่พบข้อมูลบริการทางขนส่ง
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 block">
            {courierData.map((item, idx) => (
              <div key={item.name} className="flex items-center text-xs space-x-1.5 justify-start">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }}></span>
                <span className="text-gray-500 truncate">{item.name}:</span>
                <span className="font-bold text-gray-800">{item.value ? `${item.value} ชิ้น` : "0"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent inventory log table listing imports/exports */}
        <div id="dashboard-recent-log" className="bg-white p-5 rounded-2xl border border-gray-100 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
              <span>กิจกรรมการนำเข้า-นำออก ล่าสุด</span>
            </h4>
            <button
              id="btn-goto-inventory-to-export"
              onClick={() => setView("inventory")}
              className="text-xs text-emerald-600 font-semibold flex items-center hover:underline hover:text-emerald-700 cursor-pointer"
            >
              <span>ดูข้อมูลทั้งหมด</span>
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1 h-[220px]">
            {transactions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <th className="px-3 py-2 text-left">ประเภท</th>
                    <th className="px-3 py-2 text-left">SKU / ชื่อสินค้า</th>
                    <th className="px-3 py-2 text-right">จำนวน</th>
                    <th className="px-3 py-2 text-left">ผู้ทำรายการ</th>
                    <th className="px-3 py-2 text-right">วันเวลาทำของ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {transactions.slice(0, 5).map((trans) => {
                    const isImport = trans.type === "import";
                    return (
                      <tr key={trans.id} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isImport ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {isImport ? "นำเข้า (+] " : "ส่งออก [-]"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-semibold text-gray-800 truncate max-w-[200px]">{trans.name}</p>
                          <span className="font-mono text-[10px] text-gray-450">{trans.sku}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-800">
                          {isImport ? "+" : "-"}{trans.quantity}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {trans.user || "ระบบออโต้"}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-450 text-[10px]">
                          {new Date(trans.timestamp).toLocaleString("th-TH", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs py-8">
                ยังไม่มีรายการความเคลื่อนไหวทางประวัติสินค้า
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bento Row 3: LINE Bot AI Widget & Quick Sync Actions */}
      <div id="dashboard-bento-row-3" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LINE Bot AI Box (col-span-4 equivalent) */}
        <div className="lg:col-span-4 bg-indigo-600 p-5 rounded-2xl text-white shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm3.19 14.35l-1.54.5c-.17.06-.35.09-.53.09-.64 0-1.25-.38-1.5-.97l-.42-1-.95.14c-.06.01-.13.01-.19.01-.58 0-1.11-.34-1.34-.89l-.53-1.25c-.29-.68.04-1.46.72-1.75l1.54-.5.53 1.25-.95.14.42 1 .95-.14.53 1.25.95-.14-.42-1-.95.14-.53-1.25.95-.14.42 1 1.54-.5c.68-.29 1.46.04 1.75.72l.53 1.25c.23.55-.1 1.23-.72 1.52z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-bold leading-tight">LINE Responder Bot</h3>
                <p className="text-[9px] text-indigo-200 uppercase tracking-widest font-bold">Auto-Responder Active</p>
              </div>
            </div>
            
            <div className="bg-indigo-700/50 rounded-xl p-3 text-xs mb-4 space-y-2.5">
              <p className="opacity-80 font-bold text-[10px] uppercase">คำค้นหาล่าสุดจากลูกค้า:</p>
              <p className="italic bg-indigo-700/40 p-1.5 rounded text-[11px]">"เช็คสต๊อกของคงคลัง"</p>
              <p className="text-emerald-300 font-bold">→ บอตตอบ: สต๊อกทั้งหมดรวม {totalInStock.toLocaleString()} ชิ้น</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setView("line-guide")}
              className="flex-1 bg-white text-indigo-600 hover:bg-slate-50 text-[11px] font-bold py-2 rounded-xl text-center cursor-pointer transition-colors"
            >
              ดูคู่มือบอต API
            </button>
            <button 
              onClick={() => setView("line-guide")}
              className="flex-1 bg-indigo-500/50 hover:bg-indigo-600/55 text-white text-[11px] font-bold py-2 rounded-xl text-center cursor-pointer transition-colors"
            >
              ทดสอบยิงคำตอบ
            </button>
          </div>
        </div>

        {/* Quick Actions / Export Bottom Bar (col-span-8 equivalent) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Google Sheet & Bento Actions</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2 min-w-[10px] animate-pulse"></div>
                <p className="text-xs font-semibold text-slate-700">เชื่อมโยงสดกับ Google Sheet #SmartStockDB</p>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-slate-400 mr-2 min-w-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p className="text-xs text-slate-500">รายงานสต๊อกสินค้าปรับปรุงทุกๆ 10 วินาที</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-4 border-t border-slate-100 mt-4 md:mt-0">
            <button 
              onClick={() => setView("inventory")}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors cursor-pointer"
            >
              ดูสต๊อกสินค้าทั้งหมด
            </button>
            <button 
              onClick={() => setView("import")}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              + รับเข้าด่วน
            </button>
            <button 
              onClick={() => setView("export")}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              - ส่งออกด่วน
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
