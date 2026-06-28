import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Product,
  Sale,
  Return,
  Customer,
  Category,
  Seller,
  Notification,
  Settings,
  User,
  ActivityLog,
} from '../types';

export function useSupabaseData() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<Settings>({
    currency: 'IQD',
    usdToIqdRate: 1320,
    dateFormat: 'MM/dd/yyyy',
    lowStockThreshold: 10,
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    taxRate: 0,
    theme: 'light',
    language: 'en',
    autoBackup: false,
    backupFrequency: 'daily',
    emailNotifications: true,
    smsNotifications: false,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAllData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      await Promise.all([
        loadProducts(),
        loadSales(),
        loadReturns(),
        loadCustomers(),
        loadCategories(),
        loadSellers(),
        loadNotifications(),
        loadSettings(),
        loadActivityLogs(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading products:', error);
      return;
    }

    setProducts(
      (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category,
        price: parseFloat(p.price),
        cost: parseFloat(p.cost),
        stock: p.stock,
        minStock: p.min_stock,
        description: p.description,
        image: p.image,
        supplier: p.supplier,
        location: p.location,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        createdBy: p.created_by,
        updatedBy: p.updated_by,
      }))
    );
  };

  const loadSales = async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading sales:', error);
      return;
    }

    setSales(
      (data || []).map((s) => ({
        id: s.id,
        productId: s.product_id,
        productName: s.product_name,
        quantity: s.quantity,
        unitPrice: parseFloat(s.unit_price),
        discount: parseFloat(s.discount),
        tax: parseFloat(s.tax),
        total: parseFloat(s.total),
        profit: parseFloat(s.profit),
        customerId: s.customer_id,
        customerName: s.customer_name,
        paymentMethod: s.payment_method,
        date: new Date(s.created_at),
        status: s.status,
        sellerId: s.seller_id,
        sellerName: s.seller_name,
        location: s.location,
      }))
    );
  };

  const loadReturns = async () => {
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading returns:', error);
      return;
    }

    setReturns(
      (data || []).map((r) => ({
        id: r.id,
        saleId: r.sale_id,
        productId: r.product_id,
        productName: r.product_name,
        quantity: r.quantity,
        reason: r.reason,
        refundAmount: parseFloat(r.refund_amount),
        date: new Date(r.created_at),
        status: r.status,
        processedBy: r.processed_by,
      }))
    );
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading customers:', error);
      return;
    }

    setCustomers(
      (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        customerType: c.customer_type,
        creditLimit: parseFloat(c.credit_limit),
        currentCredit: parseFloat(c.current_credit),
        totalPurchases: parseFloat(c.total_purchases),
        loyaltyPoints: c.loyalty_points,
        createdAt: new Date(c.created_at),
        lastPurchase: c.last_purchase ? new Date(c.last_purchase) : undefined,
      }))
    );
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    setCategories(
      (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
      }))
    );
  };

  const loadSellers = async () => {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading sellers:', error);
      return;
    }

    setSellers(
      (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        commissionRate: s.commission_rate ? parseFloat(s.commission_rate) : undefined,
        isActive: s.is_active,
        createdAt: new Date(s.created_at),
        totalSales: s.total_sales,
        totalRevenue: parseFloat(s.total_revenue),
        totalProfit: parseFloat(s.total_profit),
      }))
    );
  };

  const loadNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    setNotifications(
      (data || []).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        date: new Date(n.created_at),
        read: n.read,
        userId: n.user_id,
        actionUrl: n.action_url,
      }))
    );
  };

  const loadSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading settings:', error);
      return;
    }

    if (data) {
      setSettings({
        currency: data.currency,
        usdToIqdRate: parseFloat(data.usd_to_iqd_rate),
        dateFormat: data.date_format,
        lowStockThreshold: data.low_stock_threshold,
        companyName: data.company_name,
        companyAddress: data.company_address,
        companyPhone: data.company_phone,
        companyEmail: data.company_email,
        taxRate: parseFloat(data.tax_rate),
        theme: data.theme,
        language: data.language,
        autoBackup: data.auto_backup,
        backupFrequency: data.backup_frequency,
        emailNotifications: data.email_notifications,
        smsNotifications: data.sms_notifications,
        lastSeller: data.last_seller,
      });
    }
  };

  const loadActivityLogs = async () => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading activity logs:', error);
      return;
    }

    setActivityLogs(
      (data || []).map((log) => ({
        id: log.id,
        userId: log.user_id,
        username: log.username,
        action: log.action,
        module: log.module,
        details: log.details,
        timestamp: new Date(log.created_at),
        ipAddress: log.ip_address,
      }))
    );
  };

  const setupRealtimeSubscriptions = () => {
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadProducts)
      .subscribe();

    const salesChannel = supabase
      .channel('sales-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, loadSales)
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(salesChannel);
    };
  };

  return {
    products,
    sales,
    returns,
    customers,
    categories,
    sellers,
    notifications,
    settings,
    users,
    activityLogs,
    loading,
    setProducts,
    setSales,
    setReturns,
    setCustomers,
    setCategories,
    setSellers,
    setNotifications,
    setSettings,
    setUsers,
    setActivityLogs,
    loadProducts,
    loadSales,
    loadReturns,
    loadCustomers,
    loadCategories,
    loadSellers,
    loadNotifications,
    loadSettings,
    loadActivityLogs,
  };
}
