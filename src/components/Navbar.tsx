import React from "react";
import { User, SystemConfig } from "../types";
import { LogOut, Package, ClipboardList, LayoutDashboard, Truck, ShieldAlert, ArrowDownToLine, MessageSquare } from "lucide-react";

interface NavbarProps {
  user: User;
  config: SystemConfig;
  currentView: string;
  setView: (view: string) => void;
  onLogout: () => void;
}

export default function Navbar({ user, config, currentView, setView, onLogout }: NavbarProps) {
  const menuItems = [
    { id: "dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
    { id: "inventory", label: "สต๊อกคงเหลือ", icon: Package },
    { id: "import", label: "รับเข้าสินค้า", icon: ArrowDownToLine },
    { id: "export", label: "ส่งออกสินค้า", icon: Truck },
    { id: "line-guide", label: "LINE Bot API", icon: MessageSquare },
  ];

  // Admin-only menu items
  if (user.role === "admin") {
    menuItems.push({ id: "admin", label: "ผู้ดูแลระบบ", icon: ShieldAlert });
  }

  return (
    <nav id="app-navbar" className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            {config.logoUrl ? (
              <img
                id="navbar-logo"
                src={config.logoUrl}
                alt="App Logo"
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-xl object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div id="navbar-logo-placeholder" className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                S
              </div>
            )}
            <span id="navbar-title" className="font-sans font-black text-slate-900 text-lg tracking-tight uppercase hidden sm:block">
              {config.title || "StockMaster Pro"}
            </span>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-650 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase">
              Bento Panel
            </span>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex space-x-2 items-center">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setView(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-105 shadow-2xs"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <div id="navbar-user-info" className="text-right hidden xs:block">
              <p id="navbar-user-name" className="text-sm font-semibold text-gray-700">{user.name}</p>
              <span
                id="navbar-user-role-badge"
                className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                  user.role === "admin"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-indigo-50 text-indigo-700 border-indigo-150"
                }`}
              >
                {user.role === "admin" ? "ผู้ควบคุมสิทธิ์ (Admin)" : "พนักงาน (User)"}
              </span>
            </div>

            <button
              id="navbar-btn-logout"
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all border border-transparent hover:border-rose-100 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer Items */}
      <div id="mobile-navbar-drawer" className="md:hidden flex py-2 px-4 border-t border-gray-100 bg-gray-50/50 space-x-1 overflow-x-auto select-none no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-mobile-${item.id}`}
              onClick={() => setView(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
