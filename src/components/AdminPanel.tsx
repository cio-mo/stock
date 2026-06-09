import React, { useState, useEffect } from "react";
import { User, SystemConfig } from "../types";
import { 
  Users, ShieldAlert, Sparkles, Plus, Edit2, Trash2, 
  Settings2, Copy, Check, Save, Link2, HelpCircle 
} from "lucide-react";
import { apiFetch } from "../utils";

interface AdminPanelProps {
  currentUser: User;
  systemConfig: SystemConfig;
  onConfigSaved: (newConfig: SystemConfig) => void;
  onUserActionHappened: () => void;
}

export default function AdminPanel({ currentUser, systemConfig, onConfigSaved, onUserActionHappened }: AdminPanelProps) {
  // Config states
  const [logoUrl, setLogoUrl] = useState(systemConfig.logoUrl);
  const [title, setTitle] = useState(systemConfig.title);
  const [loginTheme, setLoginTheme] = useState(systemConfig.loginTheme);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState(systemConfig.googleSheetsUrl);
  const [configSaving, setConfigSaving] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<string | null>(null);

  // User list states
  const [userList, setUserList] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  // New user form states
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [userFeedback, setUserFeedback] = useState<string | null>(null);

  // Edit user state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "user">("user");
  const [editPassword, setEditPassword] = useState("");

  const [copiedScript, setCopiedScript] = useState(false);

  // Sample Google Apps Script to synchronize sheets
  const googleAppsScriptCode = `/**
 * Google Apps Script for SmartStock Integration
 * 1. Open Google Sheet
 * 2. Extensions -> Apps Script
 * 3. Replace all code with this snippet
 * 4. Deploy -> New Deployment -> Web App
 * 5. Set Execute as: "Me", Access: "Anyone"
 * 6. Copy Web App URL and paste in Admin Panel
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var action = data.action;
    var payload = data.payload;
    
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "import_product") {
      var sheet = getOrCreateSheet(doc, "Imports_Log");
      sheet.appendRow([
        new Date().toISOString(),
        payload.id,
        payload.sku,
        payload.name,
        payload.quantity,
        payload.category,
        payload.user
      ]);
      updateInventory(doc, payload.sku, payload.name, payload.quantity, payload.category);
    } 
    else if (action === "export_product") {
      var sheet = getOrCreateSheet(doc, "Exports_Log");
      sheet.appendRow([
        new Date().toISOString(),
        payload.id,
        payload.sku,
        payload.name,
        payload.quantity,
        payload.platform,
        payload.courier,
        payload.user
      ]);
      updateInventory(doc, payload.sku, payload.name, -payload.quantity, "");
    }
    else if (action === "full_sync") {
      // Sync complete inventory list
      var invSheet = getOrCreateSheet(doc, "Stock_Inventory");
      invSheet.clear();
      invSheet.appendRow(["SKU Code", "Product Name", "Quantity Balance", "Category Group", "Last Sync Timestamp"]);
      
      payload.inventory.forEach(function(item) {
        invSheet.appendRow([item.sku, item.name, item.quantity, item.category, item.lastUpdated]);
      });
    }

    return ContentService.createTextOutput("Sync Completed Successfully!").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

function getOrCreateSheet(doc, name) {
  var sheet = doc.getSheetByName(name);
  if (!sheet) {
    sheet = doc.insertSheet(name);
    if (name === "Imports_Log") {
      sheet.appendRow(["Timestamp", "Import ID", "SKU", "Product Name", "Quantity", "Category", "User Operator"]);
    } else if (name === "Exports_Log") {
      sheet.appendRow(["Timestamp", "Export ID", "SKU", "Product Name", "Quantity", "Platform", "Courier Operator", "User Operator"]);
    }
  }
  return sheet;
}

function updateInventory(doc, sku, name, quantityAdjust, category) {
  var sheet = getOrCreateSheet(doc, "Stock_Inventory");
  var rows = sheet.getDataRange().getValues();
  var skuIndex = -1;
  
  if (rows.length <= 1) {
    sheet.appendRow(["SKU Code", "Product Name", "Quantity Balance", "Category Group", "Last Sync Timestamp"]);
  }
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === sku) {
      skuIndex = i + 1; // 1-indexed for rows
      break;
    }
  }
  
  if (skuIndex !== -1) {
    var cell = sheet.getRange(skuIndex, 3);
    var currentVal = Number(cell.getValue()) || 0;
    cell.setValue(currentVal + Number(quantityAdjust));
    sheet.getRange(skuIndex, 5).setValue(new Date().toISOString());
  } else {
    sheet.appendRow([sku, name, Number(quantityAdjust), category, new Date().toISOString()]);
  }
}`;

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const response = await apiFetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUserList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigFeedback(null);

    try {
      const response = await apiFetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl, title, loginTheme, googleSheetsUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกค่าระบบ");
      }

      setConfigFeedback("✅ บันทึกค่าระบบและโลโก้ผู้ดูแลระบบสำเร็จแล้ว!");
      onConfigSaved(data.config);
    } catch (err: any) {
      setConfigFeedback(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFeedback(null);

    if (!newUsername || !newPassword || !newName) {
      setUserFeedback("❌ กรุณากรอกข้อมูลผู้ใช้ใหม่ให้ครบถ้วน");
      return;
    }

    try {
      const response = await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newUsername, newPassword, newName, newRole }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "สร้างผู้ใช้ไม่สำเร็จ");
      }

      setUserFeedback("✅ ลงทะเบียนบัญชีพนักงานใหม่เสร็จสิ้น!");
      setNewUsername("");
      setNewPassword("");
      setNewName("");
      setNewRole("user");
      fetchUsers();
      onUserActionHappened();
    } catch (err: any) {
      setUserFeedback(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleDeleteUser = async (targetId: string, name: string) => {
    try {
      const response = await apiFetch(`/api/users/${targetId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ลบผู้ใช้ไม่สำเร็จ");
      }

      fetchUsers();
      onUserActionHappened();
      setUserFeedback(`✅ ลบข้อมูลพนักงาน "${name}" สำเร็จแล้ว!`);
    } catch (err: any) {
      setUserFeedback(`❌ ขัดข้องในการลบ: ${err.message}`);
    }
  };

  const handleEditUserClick = (user: User) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditRole(user.role);
    setEditPassword(""); // Blank default password
  };

  const handleSaveEditedUser = async (targetId: string) => {
    try {
      const response = await apiFetch(`/api/users/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: editName, 
          role: editRole,
          password: editPassword ? editPassword : undefined 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "บันทึกแก้ไขไม่สำเร็จ");
      }

      setEditingUserId(null);
      fetchUsers();
      onUserActionHappened();
      setUserFeedback("✅ แก้ไขข้อมูลพนักงานเสร็จตามต้องการ!");
    } catch (err: any) {
      setUserFeedback(`❌ เกิดข้อผิดพลาดในการแก้ไข: ${err.message}`);
    }
  };

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div id="admin-panel-view" className="space-y-8 animate-fade-in">
      
      {/* 1. Header Banner */}
      <div className="flex items-center space-x-2">
        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 id="admin-panel-title" className="text-xl font-bold text-gray-900 font-sans">ผู้ดูแลระบบคอลโทรล (Admin Control Panel)</h2>
          <p className="text-gray-500 text-xs">ควบคุมจัดแจงสิทธิ์พนักงาน การปรับแต่งหน้ากากแอป และเชื่อมฐานข้อมูล Google Sheets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Manage system logos, login styles, and Google Sheets URL */}
        <div id="admin-config-box" className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center space-x-1.5">
              <Settings2 className="w-4 h-4 text-slate-800" />
              <span>ปรับปรุงส่วนหน้ากากและแอปโลโก้ (Custom Branding)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">แก้ไขโลโก้ร้าน ข้อความพาดหัว และเปลี่ยนแต่งสีชุดธีมสีล็อกอินเพื่อมอบความพึงพอใจ</p>

            {configFeedback && (
              <div id="config-feedback-alert" className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-xs text-indigo-900 mb-4 font-bold">
                {configFeedback}
              </div>
            )}

            <form id="form-admin-config" onSubmit={handleConfigSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">ชื่อหัวข้อแสดงผลหลักของแอป</label>
                <input
                  id="input-config-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น SmartStock ระบบจัดการสต๊อกสินค้า"
                  className="block w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">ลิงก์รูปภาพโลโก้หลัก (Logo Image URL)</label>
                <input
                  id="input-config-logo"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="เช่น https://domain.com/logo.png"
                  className="block w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">สามารถคัดลอกลิงก์รูปภาพจากอินเทอร์เน็ตเพื่อเปลี่ยนโลโก้ระบบสต๊อก</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">จัดรูปแบบสีธีมล็อกอิน</label>
                  <select
                    id="select-config-theme"
                    value={loginTheme}
                    onChange={(e) => setLoginTheme(e.target.value as any)}
                    className="block w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="emerald">สีเขียวมรกต (Emerald Green)</option>
                    <option value="dark">สีกาแล็กซี่เข้ม (Galaxy Dark Slate)</option>
                    <option value="blue">สีฟ้ามหาสมุทร (Ocean Blue)</option>
                    <option value="light">สีเทาเรียบง่าย (Minimalist Light)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 font-sans">Google App Script Web URL</label>
                  <input
                    id="input-config-sheets-url"
                    type="url"
                    value={googleSheetsUrl}
                    onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="block w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  id="btn-save-branding"
                  type="submit"
                  disabled={configSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/15 cursor-pointer"
                >
                  {configSaving ? "กำลังบันทึก..." : "อัปเดตและเปลี่ยนแปลงหน้าตา"}
                </button>
              </div>
            </form>
          </div>

          {/* User CRUD forms */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>เพิ่มพนักงานดูแลสต๊อกใหม่ (New User Registration)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">ระบุชื่อและรหัสพนักงาน สำหรับเข้าทำงานหน้าที่เดินคลัง</p>

            {userFeedback && (
              <div id="user-registration-feedback" className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 mb-4">
                {userFeedback}
              </div>
            )}

            <form id="form-register-new-user-admin" onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ชื่อสตาฟฟ์สิทธิ์ใช้งาน</label>
                  <input
                    id="admin-new-user-name"
                    type="text"
                    required
                    placeholder="สมควร สมจิตร"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="block w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">กลุ่มตำแหน่งสิทธิ์</label>
                  <select
                    id="admin-new-user-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="block w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="user">พนักงานทั่วไป (User)</option>
                    <option value="admin">ผู้ควบคุมจัดการระบบ (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ชื่อผู้ใช้ (Username)</label>
                  <input
                    id="admin-new-user-username"
                    type="text"
                    required
                    placeholder="เช่น staff_somkuan"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="block w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">รหัสผ่าน (Password)</label>
                  <input
                    id="admin-new-user-password"
                    type="password"
                    required
                    placeholder="รหัสผ่านขั้นต่ำ 6 ตัว"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  id="btn-admin-submit-user"
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  เพิ่มพนักงานคุมคลังและบันทึก
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Active User management table & Google Sheet Apps Script helper */}
        <div id="admin-users-list-box" className="space-y-6">
          
          {/* Active users table list */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-gray-600" />
              <span>ทีมบุคลากรและขอบเขตระดับบัญญัติสิทธิ์</span>
            </h3>

            <div className="overflow-x-auto border border-gray-100 rounded-xl max-h-[220px]">
              <table className="min-w-full divide-y divide-gray-100 text-xs text-left">
                <thead className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-3 py-2">ชื่อบัญชีผู้ใช้</th>
                    <th className="px-3 py-2">ระดับของสิทธิ์</th>
                    <th className="px-3 py-2">ชื่อบุคลากรจริง</th>
                    <th className="px-3 py-2 text-right">การจัดการดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {userList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/55">
                      <td className="px-3 py-2">
                        <span className="font-mono font-bold text-slate-900">{user.username}</span>
                      </td>
                      <td className="px-3 py-2">
                        {editingUserId === user.id ? (
                          <select
                            id={`edit-role-${user.id}`}
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as any)}
                            className="p-1 border border-gray-200 text-xs rounded"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            user.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {user.role === "admin" ? "Admin" : "User"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {editingUserId === user.id ? (
                          <input
                            id={`edit-name-${user.id}`}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="p-1 border border-gray-200 text-xs rounded w-24"
                          />
                        ) : (
                          <span className="font-semibold text-slate-800">{user.name}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {editingUserId === user.id ? (
                          <div id={`editing-panel-row-${user.id}`} className="flex space-x-1 justify-end">
                            <button
                              id={`btn-edit-save-${user.id}`}
                              onClick={() => handleSaveEditedUser(user.id)}
                              className="px-2 py-1 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 text-[10px]"
                            >
                              บันทึก
                            </button>
                            <button
                              id={`btn-edit-cancel-${user.id}`}
                              onClick={() => setEditingUserId(null)}
                              className="px-2 py-1 bg-gray-150 text-gray-700 font-bold rounded hover:bg-gray-200 text-[10px]"
                            >
                              ปิด
                            </button>
                          </div>
                        ) : (
                          <div id={`normal-panel-row-${user.id}`} className="flex space-x-2.5 justify-end">
                            <button
                              id={`btn-user-edit-${user.id}`}
                              onClick={() => handleEditUserClick(user)}
                              className="text-indigo-600 hover:text-indigo-805"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-user-delete-${user.username}`}
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="text-red-500 hover:text-red-700"
                              disabled={user.username === currentUser.username}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Google Sheets Setup Sandbox Guide */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs text-xs">
            <h4 className="text-sm font-bold text-gray-800 mb-2.5 flex items-center space-x-1.5">
              <Link2 className="w-4 h-4 text-emerald-600" />
              <span>คำแนะนำการคัดลอกสคริปต์ลง Google Spreadsheet</span>
            </h4>
            
            <p className="text-gray-500 mb-3 block leading-relaxed">
              สคริปต์นี้ทำให้ Google Sheet เป็นคลังสินค้าหลักในฐานะ Cloud Database แบบเรียลไทม์:
            </p>

            <ol className="list-decimal pl-4 space-y-1.5 text-gray-600 mb-4 leading-relaxed">
              <li>สร้างไฟล์ Google Sheets ชื่อ <b>"SmartStockDB"</b></li>
              <li>เปิดเมนู <b>ส่วนขยาย (Extensions) &gt; Apps Script</b></li>
              <li>คัดลอกรหัสซอร์สโค้ดด้านล่าง แทนที่ชุดโค้ด default</li>
              <li>กด <b>การใช้งานใหม่ &gt; จัดการการใช้งาน (New Deployment &gt; Web App)</b></li>
              <li>เลือกสิทธิ์ใช้งานเป็น (Execute as: <b>ฉัน (Me)</b>) และ สิทธิ์เข้าถึงเป็น (Who has access: <b>ทุกคน (Anyone)</b>)</li>
              <li>คัดลอก <b>Web App URL</b> ปลายทาง แล้วนำมาวางป้อนช่องการตั้งค่าแอปด้านหน้าเพื่อเริ่มซิงก์!</li>
            </ol>

            {/* Apps Script Codeblock copy frame */}
            <div className="relative mt-2 rounded-xl bg-slate-900 border border-slate-800 p-3 h-[180px] overflow-hidden group">
              <pre className="text-[10px] text-emerald-400 font-mono overflow-y-auto h-full text-left leading-tight pr-5 no-scrollbar">
                {googleAppsScriptCode}
              </pre>
              <button
                id="btn-copy-script"
                onClick={copyScriptToClipboard}
                className="absolute top-2 right-2 p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-gray-300 transition-colors cursor-pointer"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
