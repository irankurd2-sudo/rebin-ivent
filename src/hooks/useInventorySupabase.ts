import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Product,
  Sale,
  Return,
  Customer,
  Category,
  Seller,
  Settings,
} from '../types';

export function useInventorySupabase() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
    const unsubscribe = setupRealtimeSubscriptions();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadAllData = async () => {
    try {
      await Promise.all([
        loadProducts(),
        loadSales(),
        loadReturns(),
        loadCustomers(),
        loadCategories(),
        loadSellers(),
        loadSettings(),
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

    if (!error && data) {
      setProducts(
        data.map((p) => ({
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
          colorVariants: p.color_variants || [],
          stockWarningLevel: p.stock_warning_level || 'all',
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
          createdBy: p.created_by,
          updatedBy: p.updated_by,
        }))
      );
    }
  };

  const loadSales = async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSales(
        data.map((s) => ({
          id: s.id,
          productId: s.product_id,
          productName: s.product_name,
          productCategory: s.product_category,
          productColor: s.product_color,
          quantity: s.quantity,
          unitPrice: parseFloat(s.unit_price),
          unitCost: parseFloat(s.unit_cost || 0),
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
          unitCost: s.unit_cost ? parseFloat(s.unit_cost) : 0,
          productCategory: s.product_category,
          productColor: s.product_color,
          transactionId: s.transaction_id,
          saleDate: s.sale_date,
        }))
      );
    }
  };

  const loadReturns = async () => {
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReturns(
        data.map((r) => ({
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
    }
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCustomers(
        data.map((c) => ({
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
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setCategories(
        data.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
        }))
      );
    }
  };

  const loadSellers = async () => {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSellers(
        data.map((s) => ({
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
    }
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .maybeSingle();

    if (!error && data) {
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
    } else if (!data) {
      // Auto-create default settings row if none exists
      const { data: newData } = await supabase
        .from('settings')
        .insert({
          currency: 'IQD',
          usd_to_iqd_rate: 1320,
          date_format: 'MM/dd/yyyy',
          low_stock_threshold: 10,
          tax_rate: 0,
          theme: 'light',
          language: 'en',
          auto_backup: false,
          backup_frequency: 'daily',
          email_notifications: true,
          sms_notifications: false,
        })
        .select()
        .single();

      if (newData) {
        setSettings({
          currency: newData.currency,
          usdToIqdRate: parseFloat(newData.usd_to_iqd_rate),
          dateFormat: newData.date_format,
          lowStockThreshold: newData.low_stock_threshold,
          companyName: newData.company_name || '',
          companyAddress: newData.company_address || '',
          companyPhone: newData.company_phone || '',
          companyEmail: newData.company_email || '',
          taxRate: parseFloat(newData.tax_rate),
          theme: newData.theme,
          language: newData.language,
          autoBackup: newData.auto_backup,
          backupFrequency: newData.backup_frequency,
          emailNotifications: newData.email_notifications,
          smsNotifications: newData.sms_notifications,
          lastSeller: newData.last_seller,
        });
      }
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!supabase) return;

    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadProducts();
      })
      .subscribe();

    const salesChannel = supabase
      .channel('sales-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        loadSales();
      })
      .subscribe();

    const returnsChannel = supabase
      .channel('returns-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'returns' }, () => {
        loadReturns();
      })
      .subscribe();

    const customersChannel = supabase
      .channel('customers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        loadCustomers();
      })
      .subscribe();

    const categoriesChannel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadCategories();
      })
      .subscribe();

    const sellersChannel = supabase
      .channel('sellers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sellers' }, () => {
        loadSellers();
      })
      .subscribe();

    const settingsChannel = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        loadSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(returnsChannel);
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(sellersChannel);
      supabase.removeChannel(settingsChannel);
    };
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding product:', productData);

      if (productData.category) {
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('name', productData.category)
          .maybeSingle();

        if (!existingCategory) {
          console.log('Creating new category:', productData.category);
          await supabase
            .from('categories')
            .insert({
              name: productData.category,
              description: '',
            });
        }
      }

      console.log('Inserting product to database:', productData);
      const sku = productData.sku?.trim() || `SKU-${Date.now()}`;
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          sku,
          barcode: productData.barcode,
          category: productData.category,
          price: productData.price,
          cost: productData.cost,
          stock: productData.stock,
          min_stock: productData.minStock,
          description: productData.description,
          image: productData.image,
          supplier: productData.supplier,
          location: productData.location,
          color_variants: productData.colorVariants,
          stock_warning_level: productData.stockWarningLevel || 'all',
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Product inserted successfully:', data);
      if (data) {
        await loadProducts();
        await loadCategories();
        return data;
      }
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: productData.name,
          sku: productData.sku?.trim() || `SKU-${Date.now()}`,
          barcode: productData.barcode,
          category: productData.category,
          price: productData.price,
          cost: productData.cost,
          stock: productData.stock,
          min_stock: productData.minStock,
          description: productData.description,
          image: productData.image,
          supplier: productData.supplier,
          location: productData.location,
          color_variants: productData.colorVariants,
          stock_warning_level: productData.stockWarningLevel,
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      await loadProducts();
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const toggleStockWarnings = async (productId: string, level: string) => {
    const { error } = await supabase
      .from('products')
      .update({
        stock_warning_level: level,
      })
      .eq('id', productId);

    if (!error) {
      await loadProducts();
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (!error) {
      await loadProducts();
    }
  };

  const addSale = async (saleData: Omit<Sale, 'id' | 'date'> & { saleDate?: string; transactionId?: string }) => {
    const saleRecord: any = {
      product_id: saleData.productId,
      product_name: saleData.productName,
      product_category: saleData.productCategory,
      product_color: saleData.productColor,
      quantity: saleData.quantity,
      unit_price: saleData.unitPrice,
      unit_cost: saleData.unitCost,
      discount: saleData.discount,
      tax: saleData.tax,
      total: saleData.total,
      profit: saleData.profit,
      customer_id: saleData.customerId,
      customer_name: saleData.customerName,
      payment_method: saleData.paymentMethod,
      status: saleData.status,
      seller_id: saleData.sellerId,
      seller_name: saleData.sellerName,
      location: saleData.location,
      transaction_id: saleData.transactionId,
    };

    // Use custom sale date if provided (convert to ISO timestamp at noon to avoid timezone issues)
    if (saleData.saleDate) {
      // Convert YYYY-MM-DD to full ISO timestamp at noon local time
      const [year, month, day] = saleData.saleDate.split('-').map(Number);
      const dateAtNoon = new Date(year, month - 1, day, 12, 0, 0);
      saleRecord.created_at = dateAtNoon.toISOString();
      saleRecord.sale_date = saleData.saleDate;
    } else {
      saleRecord.sale_date = new Date().toISOString().split('T')[0];
    }

    const { error } = await supabase.from('sales').insert(saleRecord);

    if (error) {
      console.error('Error inserting sale:', error);
      throw new Error(`Failed to save sale: ${error.message}`);
    }

    await Promise.all([loadSales(), loadProducts()]);
  };

  const deleteSale = async (saleId: string, restoreInventory: boolean = true) => {
    try {
      console.log('Attempting to delete sale:', saleId, 'Restore inventory:', restoreInventory);

      // Get sale details before deletion
      const { data: saleData } = await supabase
        .from('sales')
        .select('product_id, quantity')
        .eq('id', saleId)
        .single();

      // First, check if there are any returns associated with this sale
      const { data: relatedReturns } = await supabase
        .from('returns')
        .select('id')
        .eq('sale_id', saleId);

      // If there are returns, set their sale_id to NULL first
      if (relatedReturns && relatedReturns.length > 0) {
        console.log(`Found ${relatedReturns.length} returns associated with this sale. Unlinking them...`);
        const { error: unlinkError } = await supabase
          .from('returns')
          .update({ sale_id: null })
          .eq('sale_id', saleId);

        if (unlinkError) {
          console.error('Error unlinking returns:', unlinkError);
          alert(`Failed to unlink returns: ${unlinkError.message}`);
          return;
        }
      }

      // If we don't want to restore inventory, we need to manually adjust the stock
      // before deletion (the trigger will restore it, so we reduce it first)
      if (!restoreInventory && saleData) {
        console.log('Preventing inventory restoration by pre-reducing stock');
        const { data: currentProduct } = await supabase
          .from('products')
          .select('stock')
          .eq('id', saleData.product_id)
          .single();

        if (currentProduct) {
          const newStock = Math.max(0, currentProduct.stock - saleData.quantity);
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', saleData.product_id);
        }
      }

      // Now delete the sale (trigger will restore inventory)
      const { data, error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)
        .select();

      if (error) {
        console.error('Error deleting sale:', error);
        throw new Error(`Failed to delete sale: ${error.message}`);
      }

      console.log('Sale deleted successfully:', data);
      await Promise.all([loadSales(), loadProducts(), loadSellers(), loadReturns()]);
    } catch (err) {
      console.error('Exception deleting sale:', err);
      throw err;
    }
  };

  const updateSettings = async (newSettings: Settings) => {
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .maybeSingle();

    const settingsData = {
      currency: newSettings.currency,
      usd_to_iqd_rate: newSettings.usdToIqdRate,
      date_format: newSettings.dateFormat,
      low_stock_threshold: newSettings.lowStockThreshold,
      company_name: newSettings.companyName,
      company_address: newSettings.companyAddress,
      company_phone: newSettings.companyPhone,
      company_email: newSettings.companyEmail,
      tax_rate: newSettings.taxRate,
      theme: newSettings.theme,
      language: newSettings.language,
      auto_backup: newSettings.autoBackup,
      backup_frequency: newSettings.backupFrequency,
      email_notifications: newSettings.emailNotifications,
      sms_notifications: newSettings.smsNotifications,
      last_seller: newSettings.lastSeller,
    };

    const { error } = existing
      ? await supabase.from('settings').update(settingsData).eq('id', existing.id)
      : await supabase.from('settings').insert(settingsData);

    if (!error) {
      setSettings(newSettings);
    }
  };

  const addReturn = async (returnData: Omit<Return, 'id' | 'date'>) => {
    const { error } = await supabase.from('returns').insert({
      sale_id: returnData.saleId,
      product_id: returnData.productId,
      product_name: returnData.productName,
      quantity: returnData.quantity,
      reason: returnData.reason,
      refund_amount: returnData.refundAmount,
      status: returnData.status,
      processed_by: returnData.processedBy,
    });

    if (!error) {
      await loadReturns();
    }
  };

  const updateReturn = async (id: string, returnData: Partial<Return>) => {
    const { error } = await supabase
      .from('returns')
      .update({
        status: returnData.status,
        processed_by: returnData.processedBy,
      })
      .eq('id', id);

    if (!error) {
      await loadReturns();
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases'>) => {
    const { error } = await supabase.from('customers').insert({
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
      customer_type: customerData.customerType,
      credit_limit: customerData.creditLimit,
      current_credit: customerData.currentCredit,
      loyalty_points: customerData.loyaltyPoints || 0,
      total_purchases: 0,
    });

    if (!error) {
      await loadCustomers();
    }
  };

  const addSeller = async (sellerData: Omit<Seller, 'id' | 'createdAt' | 'totalSales' | 'totalRevenue' | 'totalProfit'>) => {
    const { error } = await supabase.from('sellers').insert({
      name: sellerData.name,
      email: sellerData.email,
      phone: sellerData.phone,
      commission_rate: sellerData.commissionRate,
      is_active: sellerData.isActive,
      total_sales: 0,
      total_revenue: 0,
      total_profit: 0,
    });

    if (!error) {
      await loadSellers();
    }
  };

  const exportData = () => {
    return {
      products,
      sales,
      returns,
      customers,
      sellers,
      settings,
      exportDate: new Date().toISOString(),
    };
  };

  const importData = async (data: any) => {
    try {
      if (data.products && Array.isArray(data.products)) {
        for (const product of data.products) {
          const productData = {
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || null,
            category: product.category,
            price: parseFloat(product.price),
            cost: parseFloat(product.cost),
            stock: parseInt(product.stock),
            min_stock: parseInt(product.minStock || product.min_stock || 0),
            description: product.description || null,
            image: product.image || null,
            supplier: product.supplier || null,
            location: product.location || null,
          };

          const { error } = await supabase
            .from('products')
            .insert(productData);

          if (error) {
            console.error('Error importing product:', error);
          }
        }
      }

      if (data.sales && Array.isArray(data.sales)) {
        for (const sale of data.sales) {
          const saleData: any = {
            product_id: String(sale.productId || sale.product_id || sale.id || ''),
            product_name: sale.productName || sale.product_name || sale.name || 'Unknown Product',
            quantity: parseInt(sale.quantity) || 1,
            unit_price: parseFloat(sale.unitPrice || sale.unit_price || sale.price || 0),
            discount: parseFloat(sale.discount || 0),
            tax: parseFloat(sale.tax || 0),
            total: parseFloat(sale.total || sale.totalAmount || sale.total_amount || 0),
            profit: parseFloat(sale.profit || 0),
            payment_method: sale.paymentMethod || sale.payment_method || 'cash',
            status: sale.status || 'completed',
            customer_name: sale.customerName || sale.customer_name || null,
            seller_name: sale.sellerName || sale.seller_name || null,
            location: sale.location || null,
          };

          const { error } = await supabase
            .from('sales')
            .insert(saleData);

          if (error) {
            console.error('Error importing sale:', error);
          }
        }
      }

      if (data.returns && Array.isArray(data.returns)) {
        for (const returnItem of data.returns) {
          const returnData = {
            sale_id: returnItem.saleId || returnItem.sale_id || null,
            product_id: returnItem.productId || returnItem.product_id || null,
            product_name: returnItem.productName || returnItem.product_name || '',
            quantity: parseInt(returnItem.quantity),
            reason: returnItem.reason || '',
            status: returnItem.status || 'pending',
            refund_amount: parseFloat(returnItem.refundAmount || returnItem.refund_amount || 0),
          };

          const { error } = await supabase
            .from('returns')
            .insert(returnData);

          if (error) {
            console.error('Error importing return:', error);
          }
        }
      }

      if (data.customers && Array.isArray(data.customers)) {
        for (const customer of data.customers) {
          const customerData = {
            name: customer.name,
            email: customer.email || null,
            phone: customer.phone || null,
            address: customer.address || null,
            loyalty_points: parseInt(customer.loyaltyPoints || customer.loyalty_points || 0),
            total_purchases: parseFloat(customer.totalPurchases || customer.total_purchases || 0),
          };

          const { error } = await supabase
            .from('customers')
            .insert(customerData);

          if (error) {
            console.error('Error importing customer:', error);
          }
        }
      }

      if (data.sellers && Array.isArray(data.sellers)) {
        for (const seller of data.sellers) {
          const sellerData = {
            name: seller.name,
            email: seller.email || null,
            phone: seller.phone || null,
            commission_rate: parseFloat(seller.commissionRate || seller.commission_rate || 0),
            is_active: seller.isActive !== undefined ? seller.isActive : seller.is_active !== undefined ? seller.is_active : true,
            total_sales: parseInt(seller.totalSales || seller.total_sales || 0),
            total_revenue: parseFloat(seller.totalRevenue || seller.total_revenue || 0),
            total_profit: parseFloat(seller.totalProfit || seller.total_profit || 0),
          };

          const { error } = await supabase
            .from('sellers')
            .insert(sellerData);

          if (error) {
            console.error('Error importing seller:', error);
          }
        }
      }

      if (data.categories && Array.isArray(data.categories)) {
        for (const category of data.categories) {
          const categoryData = {
            name: category.name,
            description: category.description || null,
          };

          const { error } = await supabase
            .from('categories')
            .insert(categoryData);

          if (error) {
            console.error('Error importing category:', error);
          }
        }
      }

      if (data.settings) {
        await updateSettings(data.settings);
      }

      await loadAllData();
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  };

  const resetSalesHistory = async (restoreInventory: boolean = true) => {
    const confirmation = window.confirm(
      'WARNING: This will permanently delete ALL sales history. This cannot be undone!\n\nAre you sure you want to continue?'
    );
    if (!confirmation) return;

    try {
      console.log('Resetting sales history. Restore inventory:', restoreInventory);

      // If we don't want to restore inventory, we need to get all sales first
      // and manually adjust the stock before deletion
      if (!restoreInventory) {
        const { data: allSales } = await supabase
          .from('sales')
          .select('product_id, quantity');

        if (allSales) {
          // Group by product_id to calculate total quantities to remove
          const productAdjustments: Record<string, number> = {};
          allSales.forEach(sale => {
            productAdjustments[sale.product_id] =
              (productAdjustments[sale.product_id] || 0) + sale.quantity;
          });

          // Update all affected products
          for (const [productId, quantity] of Object.entries(productAdjustments)) {
            const { data: product } = await supabase
              .from('products')
              .select('stock')
              .eq('id', productId)
              .single();

            if (product) {
              const newStock = Math.max(0, product.stock - quantity);
              await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', productId);
            }
          }
        }
      }

      // Delete all sales (trigger will restore inventory if restoreInventory is true)
      const { error } = await supabase
        .from('sales')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.error('Error resetting sales:', error);
        alert(`Failed to reset sales: ${error.message}`);
        return;
      }

      // Delete all returns as well
      await supabase
        .from('returns')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      await Promise.all([loadSales(), loadProducts(), loadReturns(), loadSellers()]);
    } catch (err) {
      console.error('Exception resetting sales:', err);
      throw new Error('An error occurred while resetting sales history.');
    }
  };

  const resetAllData = async () => {
    const confirmation = window.confirm(
      'WARNING: This will permanently delete ALL your data including products, sales, returns, customers, and sellers. This cannot be undone!\n\nType "DELETE ALL" in the next prompt to confirm.'
    );
    if (!confirmation) return;

    const typedConfirmation = window.prompt('Type "DELETE ALL" to confirm permanent data deletion:');
    if (typedConfirmation !== 'DELETE ALL') {
      return;
    }

    await Promise.all([
      supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('returns').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('sellers').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ]);
    await loadAllData();
  };

  const refreshData = async () => {
    await loadAllData();
  };

  return {
    products,
    sales,
    returns,
    customers,
    categories,
    sellers,
    settings,
    loading,
    notifications: [],
    alertRules: [],
    addProduct,
    updateProduct,
    deleteProduct,
    toggleStockWarnings,
    addSale,
    deleteSale,
    addReturn,
    updateReturn,
    addCustomer,
    addSeller,
    setSettings: updateSettings,
    markNotificationRead: () => {},
    exportData,
    importData,
    resetSalesHistory,
    resetAllData,
    loadProducts,
    loadSales,
    refreshData,
  };
}
