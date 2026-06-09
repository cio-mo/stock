export type UserRole = "admin" | "user";

export interface User {
  id: string;
  username: string;
  password?: string; // Hidden or omitted in client-side responses
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  sku: string;
  name: string;
  quantity: number;
  category: string;
  lastUpdated: string;
}

export interface ImportRecord {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  category: string;
  timestamp: string;
  user: string;
}

export interface ExportRecord {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  platform: "TikTok" | "Shopee" | "Lazada" | "Facebook";
  courier: "Flash" | "J&T" | "LEX" | "Best";
  timestamp: string;
  user: string;
}

export interface SystemConfig {
  logoUrl: string;
  title: string;
  loginTheme: "light" | "dark" | "blue" | "emerald";
  googleSheetsUrl: string;
}

export interface DashboardStats {
  totalImported: number;
  totalExported: number;
  totalBalance: number;
  categoryCount: number;
  platformShares: Record<string, number>;
  courierShares: Record<string, number>;
  recentTransactions: Array<{
    id: string;
    type: "import" | "export";
    sku: string;
    name: string;
    quantity: number;
    timestamp: string;
    details?: string;
  }>;
}
