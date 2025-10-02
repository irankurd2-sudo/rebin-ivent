export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  description: string;
  image?: string;
  supplier?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  profit: number;
  customerId?: string;
  customerName?: string;
  paymentMethod: 'cash' | 'card' | 'credit';
  date: Date;
  status: 'completed' | 'pending' | 'cancelled';
  sellerId?: string;
  sellerName?: string;
  location?: string;
}

export interface Return {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  refundAmount: number;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  processedBy?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customerType: 'retail' | 'wholesale';
  creditLimit: number;
  currentCredit: number;
  totalPurchases: number;
  loyaltyPoints: number;
  createdAt: Date;
  lastPurchase?: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'viewer';
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface Permission {
  module: 'products' | 'sales' | 'customers' | 'reports' | 'settings' | 'users';
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  module: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'sales' | 'inventory' | 'financial' | 'customer';
  parameters: Record<string, any>;
  schedule?: 'daily' | 'weekly' | 'monthly';
  format: 'pdf' | 'excel' | 'csv';
  createdBy: string;
  createdAt: Date;
  lastRun?: Date;
}

export interface Forecast {
  productId: string;
  productName: string;
  currentStock: number;
  predictedDemand: number;
  recommendedOrder: number;
  confidence: number;
  period: string;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

export interface AlertRule {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'high_value_sale' | 'overdue_payment' | 'goal_achieved';
  enabled: boolean;
  threshold?: number;
  message: string;
  recipients: string[];
  conditions: Record<string, any>;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  date: Date;
  read: boolean;
  userId?: string;
  actionUrl?: string;
}

export interface Settings {
  currency: 'USD' | 'IQD';
  usdToIqdRate: number;
  dateFormat: string;
  lowStockThreshold: number;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxRate: number;
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  emailNotifications: boolean;
  smsNotifications: boolean;
  lastSeller?: string;
}

export interface Seller {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  commissionRate?: number;
  isActive: boolean;
  createdAt: Date;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface SellerReport {
  sellerId: string;
  sellerName: string;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  dailyPerformance: { date: string; sales: number; revenue: number }[];
  commissionEarned: number;
}

export interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categoriesCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalSales: number;
  totalReturns: number;
  averageOrderValue: number;
  inventoryTurnover: number;
}

export interface ChartData {
  name: string;
  value: number;
  revenue?: number;
  profit?: number;
  sales?: number;
  date?: string;
}

export interface APIEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  enabled: boolean;
  lastSync?: Date;
}

export interface MobileSession {
  deviceId: string;
  userId: string;
  lastSync: Date;
  isOnline: boolean;
  pendingChanges: number;
}