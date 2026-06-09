import React, { useState } from "react";
import { SystemConfig, User } from "../types";
import { KeyRound, User as UserIcon, LogIn, Lock, ArrowLeft, RefreshCw, BadgeHelp, CheckCircle2, Settings2, Globe } from "lucide-react";
import { apiFetch } from "../utils";

interface LoginProps {
  config: SystemConfig;
  onLoginSuccess: (user: User) => void;
}

export default function Login({ config, onLoginSuccess }: LoginProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // API settings for Vercel/External host deployment
  const [showApiConfig, setShowApiConfig] = useState(
    typeof window !== "undefined" && 
    (window.location.hostname.includes("vercel") || window.location.hostname.includes("github.io"))
  );
  const [backendUrlInput, setBackendUrlInput] = useState(
    localStorage.getItem("backend_api_url") || ""
  );
  const [apiSaveFeedback, setApiSaveFeedback] = useState<string | null>(null);

  // Register fields
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState<"admin" | "user">("user"); // Register defaults to user

  // Forgot password fields
  const [forgotUsername, setForgotUsername] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Derive theme styles
  const getThemeClasses = () => {
    switch (config.loginTheme) {
      case "dark":
        return {
          bg: "bg-slate-950 text-gray-100",
          card: "bg-slate-900 border-slate-800 text-gray-100 shadow-2xl",
          inputBefore: "bg-slate-800 border-slate-700 text-gray-200 focus:border-emerald-500 focus:ring-emerald-500",
          button: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20",
          accentText: "text-emerald-400 hover:text-emerald-300",
        };
      case "blue":
        return {
          bg: "bg-radial from-blue-50 to-blue-200 text-gray-800",
          card: "bg-white border-blue-100 text-gray-800 shadow-xl",
          inputBefore: "bg-white border-gray-200 text-gray-800 focus:border-blue-500 focus:ring-blue-500",
          button: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20",
          accentText: "text-blue-600 hover:text-blue-700",
        };
      case "light":
        return {
          bg: "bg-gray-50 text-gray-800",
          card: "bg-white border-gray-200 text-gray-800 shadow-md",
          inputBefore: "bg-white border-gray-300 text-gray-800 focus:border-gray-500 focus:ring-gray-500",
          button: "bg-gray-800 hover:bg-gray-900 text-white shadow-gray-800/10",
          accentText: "text-gray-600 hover:text-gray-800 underline",
        };
      case "emerald":
      default:
        return {
          bg: "bg-radial from-slate-50 to-slate-100 text-slate-800",
          card: "bg-white border-slate-200 text-slate-800 shadow-xl",
          inputBefore: "bg-white border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500",
          button: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10",
          accentText: "text-indigo-600 hover:text-indigo-750",
        };
    }
  };

  const theme = getThemeClasses();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setFeedback({ type: "error", text: "กรุณาระบุข้อมูลให้ครบถ้วน" });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ล้มเหลวในการเข้าสู่ระบบ");
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regPassword || !regName) {
      setFeedback({ type: "error", text: "กรุณากรอกข้อมูลให้ครบถ้วน" });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      // Direct registration creates user on server. Since registering via login page is allowed,
      // we use custom endpoint on backend (we will use /api/users, but let's implement bypass so regular user registration works)
      const response = await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "bypass-admin-check-for-register": "true" }, // Express server can handle this
        body: JSON.stringify({
          newUsername: regUsername,
          newPassword: regPassword,
          newName: regName,
          newRole: regRole,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "การสมัครสมาชิกขัดข้อง");
      }

      setFeedback({ type: "success", text: "สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบด้วยบัญชีคนใหม่ของคุณ" });
      setActiveTab("login");
      setUsername(regUsername);
      setPassword("");
      
      // Clear fields
      setRegUsername("");
      setRegPassword("");
      setRegName("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername) {
      setFeedback({ type: "error", text: "กรุณาระบุชื่อผู้ใช้งานของคุณ" });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const response = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ไม่สามารถกู้คืนรหัสผ่านได้");
      }

      setFeedback({ type: "success", text: data.message });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className={`min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500 ${theme.bg}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {config.logoUrl ? (
          <img
            id="login-logo-img"
            className="mx-auto h-20 w-20 rounded-2xl object-cover shadow-md border-2 border-white/50"
            src={config.logoUrl}
            alt="Customer Logo"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div id="login-logo-placeholder" className="mx-auto h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-extrabold text-2xl shadow-inner border border-emerald-200">
            ST
          </div>
        )}
        <h2 id="login-title-h2" className="mt-6 text-3xl font-extrabold tracking-tight font-sans text-shadow-sm">
          {config.title || "ระบบคลังสินค้าอัจฉริยะ"}
        </h2>
        <p className="mt-2 text-sm opacity-80 max-w-sm mx-auto">
          ระบบจัดการรับสินค้า ส่งสินค้าออก และคำนวณคงคลังแบบเรียลไทม์
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div id="login-card-body" className={`py-8 px-6 sm:px-10 rounded-2xl border transition-all duration-300 ${theme.card}`}>
          
          {/* Detect unconfigured static deployment warning */}
          {typeof window !== "undefined" && 
           (window.location.hostname.includes("vercel") || window.location.hostname.includes("github.io")) && 
           !localStorage.getItem("backend_api_url") && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-400 text-xs leading-relaxed space-y-1">
              <p className="font-bold flex items-center space-x-1">
                <span>⚠️ ตรวจพบแอปพลิเคชันทำงานบน Vercel</span>
              </p>
              <p>กรุณาระบุที่อยู่เซิร์ฟเวอร์หลัก (Cloud Run API Base URL) ในแถบเมนู <b>"⚙️ ตั้งค่า API Server ... "</b> ด้านล่างการ์ดนี้เพื่อให้ระบบสามารถเชื่อมต่อข้อมูลสต็อกสินค้าและสมาชิกพนักงานได้อย่างถูกต้องค่ะ</p>
            </div>
          )}

          {/* Feedback alerts */}
          {feedback && (
            <div
              id="login-feedback-alert"
              className={`mb-5 p-4 rounded-xl flex items-start space-x-2 text-sm border ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
              ) : (
                <BadgeHelp className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {activeTab === "login" && (
            <form id="form-login" onSubmit={handleLogin} className="space-y-5">
              <div>
                <label id="lbl-login-username" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  ชื่อผู้ใช้งาน (Demonstration: admin)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <input
                    id="input-login-username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Username"
                    className={`block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 border ${theme.inputBefore}`}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label id="lbl-login-password" className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                    รหัสผ่าน (Demonstration: password123)
                  </label>
                  <button
                    type="button"
                    id="btn-trigger-forgot"
                    onClick={() => {
                      setActiveTab("forgot");
                      setFeedback(null);
                    }}
                    className={`text-xs font-semibold ${theme.accentText}`}
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="input-login-password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 border ${theme.inputBefore}`}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold shadow-lg transition-all focus:outline-none focus:ring-2 cursor-pointer ${theme.button}`}
                >
                  {loading ? "กำลังดำเนินการ..." : "เข้าสู่ระบบคลัง"}
                </button>
              </div>

              <div className="pt-4 border-t border-gray-150 text-center">
                <span className="text-xs text-gray-400">ยังไม่มีรหัสผ่านเข้าใช้งาน ใช่หรือไม่? </span>
                <button
                  type="button"
                  id="btn-toggle-register"
                  onClick={() => {
                    setActiveTab("register");
                    setFeedback(null);
                  }}
                  className={`text-xs font-bold ${theme.accentText}`}
                >
                  สมัครสมาชิกสินค้าใหม่
                </button>
              </div>
            </form>
          )}

          {activeTab === "register" && (
            <form id="form-register" onSubmit={handleRegister} className="space-y-4">
              <div className="flex items-center space-x-1 text-sm font-bold text-gray-500 mb-4">
                <button
                  type="button"
                  id="btn-back-to-login"
                  onClick={() => {
                    setActiveTab("login");
                    setFeedback(null);
                  }}
                  className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 pointer-events-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับไปหน้าเข้าสู่ระบบ</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  ชื่อ-นามสกุล บุคลากร
                </label>
                <input
                  id="input-reg-name"
                  type="text"
                  required
                  placeholder="เช่น สมควร มีดี"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className={`block w-full px-3 py-2.5 rounded-xl text-sm transition-all border ${theme.inputBefore}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  ชื่อผู้ใช้งานใหม่ (Username)
                </label>
                <input
                  id="input-reg-username"
                  type="text"
                  required
                  placeholder="เช่น stock_staff"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className={`block w-full px-3 py-2.5 rounded-xl text-sm transition-all border ${theme.inputBefore}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  รหัสผ่านใช้งาน (Password)
                </label>
                <input
                  id="input-reg-password"
                  type="password"
                  required
                  placeholder="รหัสผ่านขั้นต่ำ 6 ตัวอักษร"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className={`block w-full px-3 py-2.5 rounded-xl text-sm transition-all border ${theme.inputBefore}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  ตำแหน่ง / สิทธิ์ผู้ใช้งาน
                </label>
                <select
                  id="select-reg-role"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as "admin" | "user")}
                  className={`block w-full px-3 py-2.5 rounded-xl text-sm transition-all border ${theme.inputBefore}`}
                >
                  <option value="user">พนักงานความดูแลคลังสินค้า (User)</option>
                  <option value="admin">ผู้ควบคุมจัดการระบบ (Admin)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-register-submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold shadow-lg transition-all focus:outline-none focus:ring-2 cursor-pointer ${theme.button}`}
                >
                  {loading ? "กำลังบันทึกข้อมูล..." : "ลงทะเบียนผู้ใช้ใหม่"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "forgot" && (
            <form id="form-forgot" onSubmit={handleForgot} className="space-y-4">
              <div className="flex items-center space-x-1 text-sm font-bold text-gray-500 mb-4">
                <button
                  type="button"
                  id="btn-forgot-to-login"
                  onClick={() => {
                    setActiveTab("login");
                    setFeedback(null);
                  }}
                  className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับไปเข้าสู่ระบบ</span>
                </button>
              </div>

              <div className="text-sm text-gray-500">
                กรุณากรอกชื่อผู้ใช้ที่ลงทะเบียนในระบบเพื่อกู้คืนข้อมูลเข้าใช้งานรหัสผ่าน
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  ชื่อผู้ใช้งาน (Username)
                </label>
                <input
                  id="input-forgot-username"
                  type="text"
                  required
                  placeholder="เช่น admin, user"
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  className={`block w-full px-3 py-2.5 rounded-xl text-sm transition-all border ${theme.inputBefore}`}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-forgot-submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold shadow-lg transition-all focus:outline-none focus:ring-2 cursor-pointer ${theme.button}`}
                >
                  {loading ? "กำลังค้นหา..." : "ค้นหารหัสผ่านระบบ"}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* API Settings configuration block specialized for Vercel/External host */}
        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/50 shadow-sm text-xs text-left">
            <button
              type="button"
              onClick={() => setShowApiConfig(!showApiConfig)}
              className="w-full flex items-center justify-between text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold transition-all cursor-pointer"
            >
              <span className="flex items-center space-x-1.5">
                <Settings2 className="w-4 h-4 text-indigo-500" />
                <span>⚙️ ตั้งค่า API Server (สำหรับ Vercel / Live Server)</span>
              </span>
              <span>{showApiConfig ? "ซ่อน ▲" : "แสดง ▼"}</span>
            </button>
            
            {showApiConfig && (
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-fade-in font-sans">
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  หากนำระบบนี้ขึ้นระบบภายนอกเช่น Vercel และพบปัญหาเข้าสู่ระบบไม่ได้ กรุณาระบุรหัส URL ของ Cloud Run หลังบ้าน (เช่น <code className="font-mono bg-slate-100 dark:bg-slate-800 text-indigo-600 px-1 py-0.5 rounded">https://...run.app</code>) เพื่อให้ระบบส่งคำสั่งเชื่อมฐานข้อมูลและดึงรายชื่อพนักงานได้ถูกต้อง
                </p>
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1.5">
                    Cloud Run API Base URL *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450">
                      <Globe className="h-4 w-4 text-indigo-400" />
                    </div>
                    <input
                      id="input-vercel-api-endpoint"
                      type="url"
                      placeholder="เช่น https://ais-dev-efoukm...run.app"
                      value={backendUrlInput}
                      onChange={(e) => setBackendUrlInput(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {apiSaveFeedback && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {apiSaveFeedback}
                  </p>
                )}

                <div className="flex space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!backendUrlInput) {
                        localStorage.removeItem("backend_api_url");
                        setApiSaveFeedback("✅ รีเซ็ตการเชื่อมต่อเป็นแบบเซิร์ฟเวอร์เดียวกันแล้ว!");
                      } else {
                        // Clean/Normalize URL
                        let cleanUrl = backendUrlInput.trim();
                        if (cleanUrl && !cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
                          cleanUrl = "https://" + cleanUrl;
                          setBackendUrlInput(cleanUrl);
                        }
                        localStorage.setItem("backend_api_url", cleanUrl);
                        setApiSaveFeedback("✅ บันทึกที่อยู่เชื่อมต่อสำเร็จ! กำลังรีโหลดเพจ...");
                      }
                      setTimeout(() => {
                        window.location.reload();
                      }, 1200);
                    }}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-center transition-all cursor-pointer"
                  >
                    บันทึก & รีโหลดแอป
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("backend_api_url");
                      setBackendUrlInput("");
                      setApiSaveFeedback("✅ รีเซ็ตใช้ค่าเริ่มต้นสำเร็จ! กำลังรีโหลดเพจ...");
                      setTimeout(() => {
                        window.location.reload();
                      }, 1200);
                    }}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    ล้างค่า
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
