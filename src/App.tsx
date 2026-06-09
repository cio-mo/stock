/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Product, SystemConfig } from "./types";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ImportItems from "./components/ImportItems";
import ExportItems from "./components/ExportItems";
import Inventory from "./components/Inventory";
import AdminPanel from "./components/AdminPanel";
import LineBotGuide from "./components/LineBotGuide";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "./utils";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [currentView, setView] = useState<string>("dashboard");
  const [appLoading, setAppLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Fetch critical app configs and active session on bootup
  const bootstrapApp = async () => {
    setAppLoading(true);
    setDataError(null);
    try {
      // 1. Load Custom System Branding
      try {
        const configRes = await apiFetch("/api/config");
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData);
        }
      } catch (configErr: any) {
        console.warn("Could not load initial config (ignore if backend not configured on static host yet):", configErr.message);
      }

      // 2. Validate session cookie via GET me
      try {
        const authRes = await apiFetch("/api/auth/me");
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.user) {
            setUser(authData.user);
            // Load active stocks indices
            await loadInventoryData();
          }
        }
      } catch (authErr: any) {
        console.warn("Could not validate active session during boot:", authErr.message);
      }
    } catch (err: any) {
      console.error("Critical app boot failure:", err.message);
    } finally {
      setAppLoading(false);
    }
  };

  // Pull real-time inventory indices and logs
  const loadInventoryData = async () => {
    try {
      const prodRes = await apiFetch("/api/inventory");
      const transRes = await apiFetch("/api/inventory/transactions");

      if (prodRes.ok && transRes.ok) {
        setProducts(await prodRes.json());
        setTransactions(await transRes.json());
      }
    } catch (err) {
      console.warn("Failed to fetch running inventory updates", err);
    }
  };

  useEffect(() => {
    bootstrapApp();
  }, []);

  const handleLoginSuccess = async (loggedInUser: User) => {
    localStorage.setItem("session_username", loggedInUser.username);
    setUser(loggedInUser);
    setAppLoading(true);
    await loadInventoryData();
    setAppLoading(false);
    setView("dashboard");
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("session_username");
      await apiFetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setView("dashboard");
    } catch (e) {
      console.error("Logout issue", e);
    }
  };

  const handleConfigChanged = (newConfig: SystemConfig) => {
    setConfig(newConfig);
  };

  // Helper renderer coordinating active routes
  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard 
            products={products}
            transactions={transactions}
            onRefresh={loadInventoryData}
            setView={setView}
          />
        );
      case "inventory":
        return (
          <Inventory
            products={products}
            transactions={transactions}
            config={config!}
            userRole={user?.role || "user"}
            onRefresh={loadInventoryData}
            setView={setView}
          />
        );
      case "import":
        return (
          <ImportItems 
            products={products}
            onImportSuccess={loadInventoryData}
          />
        );
      case "export":
        return (
          <ExportItems 
            products={products}
            onExportSuccess={loadInventoryData}
            setView={setView}
          />
        );
      case "line-guide":
        return <LineBotGuide />;
      case "admin":
        if (user?.role !== "admin") {
          return <div className="text-center py-12 text-red-500 font-bold">⚠️ คุณไม่มีระดับสิทธิ์เข้าถึงหน้านี้!</div>;
        }
        return (
          <AdminPanel 
            currentUser={user}
            systemConfig={config!}
            onConfigSaved={handleConfigChanged}
            onUserActionHappened={bootstrapApp}
          />
        );
      default:
        return <div className="text-center py-12 text-gray-400">View not found</div>;
    }
  };

  // 1. Initial State Spinner Screen
  if (appLoading) {
    return (
      <div id="app-loading-screen" className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
        <h4 className="text-sm font-bold text-gray-700 tracking-tight">กำลังตรวจสอบข้อมูลล็อกอินและการแสดงผลระบบ...</h4>
      </div>
    );
  }

  // 2. Fatal Server Error Screen
  if (dataError) {
    return (
      <div id="app-fatal-error-screen" className="min-h-screen bg-red-50 flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-gray-800 mb-1">ไม่สามารถเข้าสู่แอปพอร์ตเซิร์ฟเวอร์ได้</h3>
        <p className="text-sm text-gray-500 max-w-sm">{dataError}</p>
        <button
          onClick={bootstrapApp}
          className="mt-4 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
        >
          กลับมาพยายามซิงก์อีกครั้ง
        </button>
      </div>
    );
  }

  // 3. User Login Screen
  if (!user) {
    return (
      <Login 
        config={config || { logoUrl: "", title: "ระบบสต๊อกสินค้า", loginTheme: "emerald", googleSheetsUrl: "" }} 
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 4. Authenticated Main Layout workspace
  return (
    <div id="app-main-layout" className="min-h-screen bg-slate-50/55 flex flex-col">
      <Navbar 
        user={user} 
        config={config || { logoUrl: "", title: "ระบบมีสต๊อก", loginTheme: "emerald", googleSheetsUrl: "" }} 
        currentView={currentView}
        setView={setView} 
        onLogout={handleLogout}
      />

      <main id="app-workspace-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full"
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Humble literal footer details */}
      <footer id="app-workspace-footer" className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400 font-mono">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} ระบบตรวจสอบและควบคุมสต๊อกสินค้า - ทำการซิงก์ Google Sheets เรียลไทม์</p>
        </div>
      </footer>
    </div>
  );
}

