import express from "express";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { User, Product, ImportRecord, ExportRecord, SystemConfig } from "./src/types";

const app = express();
const PORT = 3000;

// Resolve paths
const DATA_DIR = path.resolve("./data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const INVENTORY_FILE = path.join(DATA_DIR, "inventory.json");
const IMPORTS_FILE = path.join(DATA_DIR, "imports.json");
const EXPORTS_FILE = path.join(DATA_DIR, "exports.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

// Middleware
app.use(express.json());
app.use(cookieParser());

// Bootstrap database files
function ensureDatabaseExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Seed default Users
  if (!fs.existsSync(USERS_FILE) || fs.readFileSync(USERS_FILE, "utf-8").trim() === "") {
    const defaultUsers: User[] = [
      {
        id: "usr_admin",
        username: "admin",
        password: "password123", // Real simple implementation as requested
        name: "ผู้ดูแลระบบ (Admin)",
        role: "admin",
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr_staff",
        username: "user",
        password: "password123",
        name: "สมควร มีใจรัก (Staff)",
        role: "user",
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), "utf-8");
  }

  // Seed default Inventory
  if (!fs.existsSync(INVENTORY_FILE) || fs.readFileSync(INVENTORY_FILE, "utf-8").trim() === "") {
    const defaultInventory: Product[] = [
      {
        sku: "TSH-001",
        name: "เสื้อยืดคอตตอน Basic Black",
        quantity: 150,
        category: "เสื้อผ้าแฟชั่น",
        lastUpdated: new Date().toISOString(),
      },
      {
        sku: "MUG-002",
        name: "แก้วเก็บความร้อน 500ml Space Gray",
        quantity: 45,
        category: "ของใช้ครัวเรือน",
        lastUpdated: new Date().toISOString(),
      },
      {
        sku: "KEY-003",
        name: "บอร์ดกลไก RGB Bluetooth 75%",
        quantity: 12,
        category: "อุปกรณ์ไอที",
        lastUpdated: new Date().toISOString(),
      },
      {
        sku: "FAN-004",
        name: "พัดลมพกพาหมุนได้ 360 USB Mini",
        quantity: 85,
        category: "เครื่องใช้ไฟฟ้า",
        lastUpdated: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(defaultInventory, null, 2), "utf-8");
  }

  // Seed log files
  if (!fs.existsSync(IMPORTS_FILE) || fs.readFileSync(IMPORTS_FILE, "utf-8").trim() === "") {
    const defaultImports: ImportRecord[] = [
      {
        id: "imp_1",
        sku: "TSH-001",
        name: "เสื้อยืดคอตตอน Basic Black",
        quantity: 150,
        category: "เสื้อผ้าแฟชั่น",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 * 3).toISOString(), // 3 days ago
        user: "admin",
      },
      {
        id: "imp_2",
        sku: "MUG-002",
        name: "แก้วเก็บความร้อน 500ml Space Gray",
        quantity: 50,
        category: "ของใช้ครัวเรือน",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(), // 2 days ago
        user: "user",
      },
    ];
    fs.writeFileSync(IMPORTS_FILE, JSON.stringify(defaultImports, null, 2), "utf-8");
  }

  if (!fs.existsSync(EXPORTS_FILE) || fs.readFileSync(EXPORTS_FILE, "utf-8").trim() === "") {
    const defaultExports: ExportRecord[] = [
      {
        id: "exp_1",
        sku: "TSH-001",
        name: "เสื้อยืดคอตตอน Basic Black",
        quantity: 5,
        platform: "TikTok",
        courier: "Flash",
        timestamp: new Date(Date.now() - 60 * 1000 * 45).toISOString(), // 45 mins ago
        user: "user",
      },
      {
        id: "exp_2",
        sku: "MUG-002",
        name: "แก้วเก็บความร้อน 500ml Space Gray",
        quantity: 5,
        platform: "Shopee",
        courier: "J&T",
        timestamp: new Date(Date.now() - 120 * 1000 * 30).toISOString(), // 1 hour ago
        user: "user",
      },
    ];
    fs.writeFileSync(EXPORTS_FILE, JSON.stringify(defaultExports, null, 2), "utf-8");
  }

  // Seed system config
  if (!fs.existsSync(CONFIG_FILE) || fs.readFileSync(CONFIG_FILE, "utf-8").trim() === "") {
    const defaultConfig: SystemConfig = {
      logoUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=200",
      title: "ระบบสต๊อกสินค้า คูเรียร์ & อีคอมเมิร์ซ",
      loginTheme: "emerald",
      googleSheetsUrl: "",
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), "utf-8");
  }
}

ensureDatabaseExists();

// Helper to retrieve session username from both cookies and custom headers
function getSessionUsername(req: express.Request): string | undefined {
  const cookieUser = req.cookies?.session_username;
  const headerUser = req.headers["x-session-username"];
  if (headerUser === "undefined" || headerUser === "null") return undefined;
  return cookieUser || (headerUser as string) || undefined;
}

// Helper database functions
function readUsers(): User[] {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch (err) {
    return [];
  }
}

function writeUsers(users: User[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function readInventory(): Product[] {
  try {
    return JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf-8"));
  } catch (err) {
    return [];
  }
}

function writeInventory(inv: Product[]) {
  fs.writeFileSync(INVENTORY_FILE, JSON.stringify(inv, null, 2), "utf-8");
}

function readImports(): ImportRecord[] {
  try {
    return JSON.parse(fs.readFileSync(IMPORTS_FILE, "utf-8"));
  } catch (err) {
    return [];
  }
}

function writeImports(imports: ImportRecord[]) {
  fs.writeFileSync(IMPORTS_FILE, JSON.stringify(imports, null, 2), "utf-8");
}

function readExports(): ExportRecord[] {
  try {
    return JSON.parse(fs.readFileSync(EXPORTS_FILE, "utf-8"));
  } catch (err) {
    return [];
  }
}

function writeExports(exports: ExportRecord[]) {
  fs.writeFileSync(EXPORTS_FILE, JSON.stringify(exports, null, 2), "utf-8");
}

function readConfig(): SystemConfig {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch (err) {
    return {
      logoUrl: "",
      title: "ระบบสต๊อกสินค้า",
      loginTheme: "emerald",
      googleSheetsUrl: "",
    };
  }
}

function writeConfig(conf: SystemConfig) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(conf, null, 2), "utf-8");
}

// Simple push to Google Sheet logic (via webhook) if configured
async function syncToGoogleSheet(action: string, payload: any) {
  const cfg = readConfig();
  if (!cfg.googleSheetsUrl) return;
  try {
    // Send a non-blocking request to the Google App Script endpoint
    // to sync in real-time.
    await fetch(cfg.googleSheetsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload, timestamp: new Date().toISOString() }),
    }).catch(e => console.warn("Sync warning: Sheets API not reachable", e.message));
  } catch (err: any) {
    console.error("Failed to sync with Google Sheet:", err.message);
  }
}

// ---------------- API ENDPOINTS ----------------

// System config api
app.get("/api/config", (req, res) => {
  res.json(readConfig());
});

app.post("/api/config", (req, res) => {
  // Simple check: we get session from cookie or header
  const username = getSessionUsername(req);
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "สิทธิ์การเข้าใช้งานไม่พึงพอใจสำหรับขั้นตอนนี้" });
  }

  const newConfig: SystemConfig = {
    logoUrl: req.body.logoUrl || "",
    title: req.body.title || "ระบบจัดการสต๊อกสินค้า",
    loginTheme: req.body.loginTheme || "emerald",
    googleSheetsUrl: req.body.googleSheetsUrl || "",
  };

  writeConfig(newConfig);
  res.json({ success: true, config: newConfig });
});

// Authentication endpoints
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "กรุณาระบุชื่อผู้ใช้และรหัสผ่าน" });
  }

  const users = readUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
  }

  // Set Cookie for 7 days
  res.cookie("session_username", user.username, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
  });

  // Also return the user profile
  const { password: _, ...userProfile } = user;
  res.json({ success: true, user: userProfile });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("session_username");
  res.json({ success: true });
});

app.get("/api/auth/me", (req, res) => {
  const username = getSessionUsername(req);
  if (!username) {
    return res.json({ user: null });
  }

  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.json({ user: null });
  }

  const { password: _, ...userProfile } = user;
  res.json({ user: userProfile });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "กรุณาระบุชื่อผู้ใช้งาน" });
  }

  const users = readUsers();
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ error: "ไม่พบชื่อผู้ใช้งานนี้ในระบบ" });
  }

  // Simple feedback: In real, would send email. Here, we safely let them know the hint or password reset flow.
  res.json({
    success: true,
    message: `คุณสมบัติลืมรหัสผ่าน: รหัสผ่านของคุณคือ "${user.password}" (สำหรับสาธิต)`,
  });
});

// User Management (Admin Only)
app.get("/api/users", (req, res) => {
  const username = getSessionUsername(req);
  const users = readUsers();
  const currentUser = users.find(u => u.username === username);

  if (!currentUser || currentUser.role !== "admin") {
    return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถดูรายการผู้ใช้ได้" });
  }

  // Remove passwords for client delivery
  const safeUsers = users.map(({ password: _, ...rest }) => rest);
  res.json(safeUsers);
});

app.post("/api/users", (req, res) => {
  const username = getSessionUsername(req);
  const users = readUsers();
  const currentUser = users.find(u => u.username === username);
  const isBypass = req.headers["bypass-admin-check-for-register"] === "true";

  if (!isBypass && (!currentUser || currentUser.role !== "admin")) {
    return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้นที่ทำรายการนี้ได้" });
  }

  const { newUsername, newPassword, newName, newRole } = req.body;

  if (!newUsername || !newPassword || !newName || !newRole) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลผู้ใช้รายใหม่ให้ครบถ้วน" });
  }

  if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
    return res.status(400).json({ error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" });
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    username: newUsername,
    password: newPassword,
    name: newName,
    role: newRole,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  // Sync log to Google Sheet
  syncToGoogleSheet("create_user", { username: newUser.username, name: newUser.name, role: newUser.role });

  res.json({ success: true, user: { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role } });
});

app.put("/api/users/:id", (req, res) => {
  const username = getSessionUsername(req);
  const users = readUsers();
  const currentUser = users.find(u => u.username === username);

  if (!currentUser || currentUser.role !== "admin") {
    return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้นที่ทำรายการนี้ได้" });
  }

  const targetId = req.params.id;
  const { name, role, password } = req.body;

  const userIdx = users.findIndex(u => u.id === targetId);
  if (userIdx === -1) {
    return res.status(404).json({ error: "ไม่พบผู้ใช้ที่ระบุ" });
  }

  // Admin cannot modify or downgrade their own user record directly to prevent logout state locks
  if (users[userIdx].username === currentUser.username && role !== "admin") {
    return res.status(400).json({ error: "คุณไม่สามารถลดสิทธิ์ผู้ดูแลระบบของตัวเองได้" });
  }

  if (name) users[userIdx].name = name;
  if (role) users[userIdx].role = role;
  if (password) users[userIdx].password = password;

  writeUsers(users);

  syncToGoogleSheet("update_user", { id: targetId, username: users[userIdx].username, name: users[userIdx].name, role: users[userIdx].role });

  res.json({ success: true });
});

app.delete("/api/users/:id", (req, res) => {
  const username = getSessionUsername(req);
  const users = readUsers();
  const currentUser = users.find(u => u.username === username);

  if (!currentUser || currentUser.role !== "admin") {
    return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้นที่ทำรายการนี้ได้" });
  }

  const targetId = req.params.id;
  const targetUser = users.find(u => u.id === targetId);

  if (!targetUser) {
    return res.status(404).json({ error: "ไม่พบผู้ใช้ที่ระบุ" });
  }

  if (targetUser.username === currentUser.username) {
    return res.status(400).json({ error: "คุณไม่สามารถลบบัญชีผู้ใช้ของคุณเองได้" });
  }

  const updatedUsers = users.filter(u => u.id !== targetId);
  writeUsers(updatedUsers);

  syncToGoogleSheet("delete_user", { id: targetId, username: targetUser.username });

  res.json({ success: true });
});

// Inventory Management
app.get("/api/inventory", (req, res) => {
  res.json(readInventory());
});

app.post("/api/inventory/import", (req, res) => {
  const username = getSessionUsername(req) || "anonymous";
  const { sku, name, quantity, category } = req.body;

  if (!sku || !name || quantity === undefined || !category) {
    return res.status(400).json({ error: "กรุณาระบุข้อมูลนำเข้าให้ครบถ้วน (SKU, ชื่อสินค้า, จำนวน, หมวดหมู่)" });
  }

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: "จำนวนสินค้าต้องเป็นตัวเลขที่มากกว่า 0" });
  }

  const inventory = readInventory();
  const existingProduct = inventory.find(p => p.sku === sku);

  if (existingProduct) {
    existingProduct.quantity += qty;
    existingProduct.name = name; // Update name just in case
    existingProduct.category = category; // Update category just in case
    existingProduct.lastUpdated = new Date().toISOString();
  } else {
    inventory.push({
      sku,
      name,
      quantity: qty,
      category,
      lastUpdated: new Date().toISOString(),
    });
  }

  writeInventory(inventory);

  const importRecord: ImportRecord = {
    id: `imp_${Date.now()}`,
    sku,
    name,
    quantity: qty,
    category,
    timestamp: new Date().toISOString(),
    user: username,
  };

  const imports = readImports();
  imports.push(importRecord);
  writeImports(imports);

  // Sync to Google Sheet
  syncToGoogleSheet("import_product", importRecord);

  res.json({ success: true, product: existingProduct || inventory[inventory.length - 1] });
});

app.post("/api/inventory/export", (req, res) => {
  const username = getSessionUsername(req) || "anonymous";
  const { sku, quantity, platform, courier } = req.body;

  if (!sku || quantity === undefined || !platform || !courier) {
    return res.status(400).json({ error: "กรุณาระบุข้อมูลสำหรับส่งออกให้ครบถ้วน" });
  }

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: "จำนวนส่งออกต้องเป็นตัวเลขที่มากกว่า 0" });
  }

  const inventory = readInventory();
  const productIdx = inventory.findIndex(p => p.sku === sku);

  if (productIdx === -1) {
    return res.status(404).json({ error: "ไม่พบสินค้า SKU นี้ในระบบสต๊อก" });
  }

  if (inventory[productIdx].quantity < qty) {
    return res.status(400).json({ error: `สินค้าคงเหลือไม่พอกับจำนวนที่ต้องการส่งออก (คงเหลือปัจจุบัน: ${inventory[productIdx].quantity})` });
  }

  inventory[productIdx].quantity -= qty;
  inventory[productIdx].lastUpdated = new Date().toISOString();

  writeInventory(inventory);

  const exportRecord: ExportRecord = {
    id: `exp_${Date.now()}`,
    sku,
    name: inventory[productIdx].name,
    quantity: qty,
    platform,
    courier,
    timestamp: new Date().toISOString(),
    user: username,
  };

  const exports = readExports();
  exports.push(exportRecord);
  writeExports(exports);

  // Sync to Google Sheet
  syncToGoogleSheet("export_product", exportRecord);

  res.json({ success: true, product: inventory[productIdx] });
});

// History Logs Export Endpoint
app.get("/api/inventory/transactions", (req, res) => {
  const imports = readImports();
  const exports = readExports();

  const combined = [
    ...imports.map(i => ({ ...i, type: "import" as const })),
    ...exports.map(e => ({ ...e, type: "export" as const })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(combined);
});

// Sync Trigger API (Full Database Migration sync to Sheets)
app.post("/api/settings/sheets-sync-full", async (req, res) => {
  const username = getSessionUsername(req);
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "เฉพาะผู้ดูแลสิทธิ์เท่านั้นที่เข้าทำงานส่วนนี้ได้" });
  }

  const cfg = readConfig();
  if (!cfg.googleSheetsUrl) {
    return res.status(400).json({ error: "ยังไม่อัพเดท URL ของ Google Web App!" });
  }

  try {
    const payload = {
      inventory: readInventory(),
      imports: readImports(),
      exports: readExports(),
      users: users.map(({ password: _, ...rest }) => rest),
    };

    // Forward complete dump
    const response = await fetch(cfg.googleSheetsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "full_sync", payload }),
    });

    const respText = await response.text();
    res.json({ success: true, message: `อัปเดตข้อมูลทั้งหมดสำเร็จ: ${respText}` });
  } catch (err: any) {
    res.status(500).json({ error: `ไม่สามารถเข้าถึงแอปสคริปต์ปลายทางได้: ${err.message}` });
  }
});

// ---------------- LINE BOT INTEGRATION API ----------------

// A clean endpoint designed specifically for LINE Bot Webhook or API query
// LINE Bot API can make a GET query or POST query to pull live inventory statistics
app.all("/api/line-bot", (req, res) => {
  // Can filter by parameter e.g., /api/line-bot?action=stock or actions via body
  const action = req.query.action || req.body.action || "stock";
  const sku = req.query.sku || req.body.sku;

  const inventory = readInventory();
  const exports = readExports();

  if (action === "stock") {
    if (sku) {
      const product = inventory.find(p => p.sku.toLowerCase() === sku.toString().toLowerCase());
      if (product) {
        return res.json({
          status: "success",
          text: `📦 สินค้า SKU: ${product.sku}\n📝 ชื่อ: ${product.name}\n📂 หมวดหมู่: ${product.category}\n🔢 สต๊อกคงเหลือ: ${product.quantity} ชิ้น\n⏰ อัปเดตล่าสุด: ${new Date(product.lastUpdated).toLocaleString("th-TH")}`,
          data: product,
        });
      } else {
        return res.json({
          status: "not_found",
          text: `❌ ไม่พบสินค้ารหัส SKU: ${sku} ในคลังปัจจุบัน`,
        });
      }
    }

    // Return general summary list
    const summaryText = inventory.map(p => `• [${p.sku}] ${p.name} (${p.quantity} ชิ้น)`).join("\n");
    return res.json({
      status: "success",
      text: `📦 รายงานสินค้าคงคลังปัจจุบัน:\n\n${summaryText || "ไม่มีสินค้าในระบบ"}\n\nดึงข้อมูลเรียลไทม์เวลา: ${new Date().toLocaleString("th-TH")}`,
      products: inventory,
    });
  }

  if (action === "exports" || action === "shipping") {
    // Return last 5 shipping orders
    const recentExports = exports
      .slice(-5)
      .reverse()
      .map((e, idx) => `🚚 ${idx + 1}. [SKU: ${e.sku}] ${e.name} จำนวน ${e.quantity} ชิ้น\n   ช่องทาง: ${e.platform} | ขนส่ง: ${e.courier}\n   ทำรายการเมื่อ: ${new Date(e.timestamp).toLocaleString("th-TH")}`)
      .join("\n\n");

    return res.json({
      status: "success",
      text: `🚚 ประวัติการส่งสินค้าล่าสุด 5 รายการ:\n\n${recentExports || "ไม่พบประวัติการทำรายการส่งออกสินค้า"}\n\nดึงข้อมูลเรียลไทม์เวลา: ${new Date().toLocaleString("th-TH")}`,
      exports: exports.slice(-10),
    });
  }

  res.json({
    status: "error",
    text: `❓ คำสั่ง LINE Bot ไม่ถูกต้อง กรุณาเลือกคีย์เวิร์ด 'เช็คสต๊อก' (action=stock) หรือ 'เช็คส่งสินค้า' (action=exports)`,
  });
});

// Serve frontend assets
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SmartStock Server] running on http://localhost:${PORT}`);
  });
}

startServer();
