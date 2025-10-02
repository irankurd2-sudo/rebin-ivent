import { useState, useEffect } from 'react';
import { Product, Category, Sale, Return, Customer, AlertRule, Notification, Settings, Seller } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'inventory_products',
  CATEGORIES: 'inventory_categories',
  SALES: 'inventory_sales',
  RETURNS: 'inventory_returns',
  CUSTOMERS: 'inventory_customers',
  SELLERS: 'inventory_sellers',
  ALERT_RULES: 'inventory_alert_rules',
  NOTIFICATIONS: 'inventory_notifications',
  SETTINGS: 'inventory_settings',
};

const defaultCategories: Category[] = [
  { id: '1', name: 'Electronics', description: 'Electronic devices and accessories' },
  { id: '2', name: 'Clothing', description: 'Apparel and fashion items' },
  { id: '3', name: 'Home & Garden', description: 'Home improvement and garden supplies' },
  { id: '4', name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' },
  { id: '5', name: 'Books & Media', description: 'Books, movies, music, and games' },
  { id: '6', name: 'Health & Beauty', description: 'Health and beauty products' },
  { id: '7', name: 'Automotive', description: 'Car parts and automotive accessories' },
  { id: '8', name: 'Food & Beverages', description: 'Food items and drinks' },
  { id: '9', name: 'Office Supplies', description: 'Office and business supplies' },
  { id: '10', name: 'Services', description: 'Service-based offerings' },
  { id: '11', name: 'IPAD', description: 'iPad products and accessories' },
];

const defaultSettings: Settings = {
  currency: 'USD',
  usdToIqdRate: 1320,
  dateFormat: 'MM/dd/yyyy',
  lowStockThreshold: 10,
  companyName: 'My Inventory',
  taxRate: 0.1,
};

const defaultAlertRules: AlertRule[] = [
  { id: '1', type: 'low_stock', enabled: true, threshold: 10, message: 'Product is running low on stock' },
  { id: '2', type: 'out_of_stock', enabled: true, message: 'Product is out of stock' },
  { id: '3', type: 'high_value_sale', enabled: true, threshold: 1000, message: 'High value sale completed' },
];

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(defaultAlertRules);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = (key: string, setter: any, defaultValue?: any) => {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (key === STORAGE_KEYS.PRODUCTS) {
          setter(parsed.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          })));
        } else if (key === STORAGE_KEYS.SALES) {
          setter(parsed.map((s: any) => ({ ...s, date: new Date(s.date) })));
        } else if (key === STORAGE_KEYS.RETURNS) {
          setter(parsed.map((r: any) => ({ ...r, date: new Date(r.date) })));
        } else if (key === STORAGE_KEYS.CUSTOMERS) {
          setter(parsed.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) })));
        } else if (key === STORAGE_KEYS.NOTIFICATIONS) {
          setter(parsed.map((n: any) => ({ ...n, date: new Date(n.date) })));
        } else {
          setter(parsed);
        }
      } else if (defaultValue) {
        setter(defaultValue);
        // Save default value to localStorage
        localStorage.setItem(key, JSON.stringify(defaultValue));
      }
    };

    loadData(STORAGE_KEYS.PRODUCTS, setProducts);
    loadData(STORAGE_KEYS.CATEGORIES, setCategories, defaultCategories);
    loadData(STORAGE_KEYS.SALES, setSales);
    loadData(STORAGE_KEYS.RETURNS, setReturns);
    loadData(STORAGE_KEYS.CUSTOMERS, setCustomers);
    loadData(STORAGE_KEYS.SELLERS, setSellers);
    loadData(STORAGE_KEYS.ALERT_RULES, setAlertRules, defaultAlertRules);
    loadData(STORAGE_KEYS.NOTIFICATIONS, setNotifications);
    loadData(STORAGE_KEYS.SETTINGS, setSettings, defaultSettings);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));
  }, [returns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(sellers));
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALERT_RULES, JSON.stringify(alertRules));
  }, [alertRules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProducts(prev => [...prev, newProduct]);
    checkAlerts(newProduct);
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev => prev.map(product => {
      if (product.id === id) {
        const updated = { ...product, ...productData, updatedAt: new Date() };
        checkAlerts(updated);
        return updated;
      }
      return product;
    }));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, categoryData: Partial<Category>) => {
    setCategories(prev => prev.map(category => 
      category.id === id ? { ...category, ...categoryData } : category
    ));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(category => category.id !== id));
  };
  const addSale = (saleData: Omit<Sale, 'id' | 'date'>) => {
    const newSale: Sale = {
      ...saleData,
      id: Date.now().toString(),
      date: new Date(),
    };
    setSales(prev => [...prev, newSale]);
    
    // Update product stock
    updateProduct(saleData.productId, {
      stock: products.find(p => p.id === saleData.productId)!.stock - saleData.quantity
    });

    // Update seller stats
    if (saleData.sellerId) {
      setSellers(prev => prev.map(seller => {
        if (seller.id === saleData.sellerId) {
          return {
            ...seller,
            totalSales: seller.totalSales + 1,
            totalRevenue: seller.totalRevenue + newSale.total,
            totalProfit: seller.totalProfit + newSale.profit,
          };
        }
        return seller;
      }));
    }

    // Save last seller for next sale
    if (saleData.sellerName) {
      setSettings(prev => ({ ...prev, lastSeller: saleData.sellerName }));
    }

    // Check for high value sale alert
    if (newSale.total >= (alertRules.find(r => r.type === 'high_value_sale')?.threshold || 1000)) {
      addNotification({
        type: 'success',
        title: 'High Value Sale',
        message: `Sale of $${newSale.total.toFixed(2)} completed for ${newSale.productName}`,
      });
    }
  };

  const addReturn = (returnData: Omit<Return, 'id' | 'date'>) => {
    const newReturn: Return = {
      ...returnData,
      id: Date.now().toString(),
      date: new Date(),
    };
    setReturns(prev => [...prev, newReturn]);
    
    addNotification({
      type: 'info',
      title: 'Return Processed',
      message: `Return for ${returnData.productName} has been submitted`,
    });
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: new Date(),
      totalPurchases: 0,
    };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const addSeller = (sellerData: Omit<Seller, 'id' | 'createdAt' | 'totalSales' | 'totalRevenue' | 'totalProfit'>) => {
    const newSeller: Seller = {
      ...sellerData,
      id: Date.now().toString(),
      createdAt: new Date(),
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
    };
    setSellers(prev => [...prev, newSeller]);
  };

  const updateSeller = (id: string, sellerData: Partial<Seller>) => {
    setSellers(prev => prev.map(seller => 
      seller.id === id ? { ...seller, ...sellerData } : seller
    ));
  };

  const deleteSeller = (id: string) => {
    setSellers(prev => prev.filter(seller => seller.id !== id));
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'date' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      date: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const checkAlerts = (product: Product) => {
    const lowStockRule = alertRules.find(r => r.type === 'low_stock' && r.enabled);
    const outOfStockRule = alertRules.find(r => r.type === 'out_of_stock' && r.enabled);

    if (product.stock === 0 && outOfStockRule) {
      addNotification({
        type: 'error',
        title: 'Out of Stock',
        message: `${product.name} is out of stock`,
      });
    } else if (product.stock <= product.minStock && lowStockRule) {
      addNotification({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${product.name} is running low (${product.stock} left)`,
      });
    }
  };

  const exportData = () => {
    const data = {
      products,
      categories,
      sales,
      returns,
      customers,
      sellers,
      alertRules,
      notifications,
      settings,
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        totalProducts: products.length,
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      },
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-backup-${new Date().toISOString().split('T')[0]}-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addNotification({
      type: 'success',
      title: 'Backup Created',
      message: `Data backup downloaded successfully with ${products.length} products and ${sales.length} sales`,
    });
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.products) setProducts(data.products.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })));
        if (data.categories) setCategories(data.categories);
        if (data.sales) setSales(data.sales.map((s: any) => ({ ...s, date: new Date(s.date) })));
        if (data.returns) setReturns(data.returns.map((r: any) => ({ ...r, date: new Date(r.date) })));
        if (data.customers) setCustomers(data.customers.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) })));
        if (data.alertRules) setAlertRules(data.alertRules);
        if (data.sellers) setSellers(data.sellers.map((s: any) => ({ ...s, createdAt: new Date(s.createdAt) })));
        if (data.notifications) setNotifications(data.notifications.map((n: any) => ({ ...n, date: new Date(n.date) })));
        if (data.settings) setSettings(data.settings);
        
        addNotification({
          type: 'success',
          title: 'Import Successful',
          message: 'Data has been imported successfully',
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Import Failed',
          message: 'Failed to import data. Please check the file format.',
        });
      }
    };
    reader.readAsText(file);
  };

  const resetSalesHistory = () => {
    if (window.confirm('Are you sure you want to delete all sales history? This action cannot be undone.')) {
      setSales([]);
      setReturns([]);
      // Reset seller stats
      setSellers(prev => prev.map(seller => ({
        ...seller,
        totalSales: 0,
        totalRevenue: 0,
        totalProfit: 0,
      })));
      
      addNotification({
        type: 'success',
        title: 'Sales History Reset',
        message: 'All sales history and reports have been cleared',
      });
    }
  };

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to delete ALL data? This will remove products, sales, customers, and everything else. This action cannot be undone.')) {
      if (window.confirm('This is your final warning. ALL DATA WILL BE PERMANENTLY DELETED. Are you absolutely sure?')) {
        setProducts([]);
        setCategories([]);
        setSales([]);
        setReturns([]);
        setCustomers([]);
        setSellers([]);
        setNotifications([]);
        
        addNotification({
          type: 'success',
          title: 'All Data Reset',
          message: 'All data has been permanently deleted',
        });
      }
    }
  };

  return {
    products,
    categories,
    sales,
    returns,
    customers,
    sellers,
    alertRules,
    notifications,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addSale,
    addReturn,
    addCustomer,
    addSeller,
    updateSeller,
    deleteSeller,
    addNotification,
    markNotificationRead,
    updateReturn: (id: string, data: Partial<Return>) => {
      setReturns(prev => prev.map(ret => {
        if (ret.id === id) {
          const updated = { ...ret, ...data };
          
          // If return is approved, update product stock
          if (data.status === 'approved' && ret.status !== 'approved') {
            const product = products.find(p => p.id === ret.productId);
            if (product) {
              updateProduct(ret.productId, {
                stock: product.stock + ret.quantity
              });
            }
            
            addNotification({
              type: 'success',
              title: 'Return Approved',
              message: `Return for ${ret.productName} has been approved and stock updated`,
            });
          } else if (data.status === 'rejected') {
            addNotification({
              type: 'info',
              title: 'Return Rejected',
              message: `Return for ${ret.productName} has been rejected`,
            });
          }
          
          // Create a negative sale entry to adjust financial reports
          const originalSale = sales.find(s => s.id === ret.saleId);
          if (originalSale) {
            const returnSale: Sale = {
              id: `return-${ret.id}`,
              productId: ret.productId,
              productName: ret.productName,
              quantity: -ret.quantity, // Negative quantity for return
              unitPrice: originalSale.unitPrice,
              discount: 0,
              tax: 0,
              total: -ret.refundAmount, // Negative total for refund
              profit: -(originalSale.profit * ret.quantity / originalSale.quantity), // Negative profit
              paymentMethod: 'cash',
              status: 'completed',
              sellerId: originalSale.sellerId,
              sellerName: originalSale.sellerName,
              customerId: originalSale.customerId,
              customerName: originalSale.customerName,
              date: new Date(),
            };
            
            setSales(prev => [...prev, returnSale]);
            
            // Update seller stats if applicable
            if (originalSale.sellerId) {
              setSellers(prevSellers => prevSellers.map(seller => {
                if (seller.id === originalSale.sellerId) {
                  return {
                    ...seller,
                    totalSales: seller.totalSales - 1,
                    totalRevenue: seller.totalRevenue - ret.refundAmount,
                    totalProfit: seller.totalProfit - (originalSale.profit * ret.quantity / originalSale.quantity),
                  };
                }
                return seller;
              }));
            }
          }
          
          return updated;
        }
        return ret;
      }));
    },
    setSettings,
    exportData,
    importData,
    resetSalesHistory,
    resetAllData,
  };
}