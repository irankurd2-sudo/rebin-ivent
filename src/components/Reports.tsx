import { useState } from 'react';
import { FileText, Download, Calendar, Filter, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { Product, Sale, Customer, Settings } from '../types';
import format from 'date-fns/format';
import { subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ReportsProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  settings: Settings;
}

export function Reports({ products, sales, customers, settings }: ReportsProps) {
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'financial' | 'customer'>('sales');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'month' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '90d':
        return { start: subDays(now, 90), end: now };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'custom':
        return { 
          start: customStartDate ? new Date(customStartDate) : subDays(now, 30), 
          end: customEndDate ? new Date(customEndDate) : now 
        };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const { start, end } = getDateRange();
  const filteredSales = sales.filter(sale => 
    isWithinInterval(sale.date, { start, end })
  );

  const generateSalesReport = () => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalSales = filteredSales.length;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    const topProducts = filteredSales.reduce((acc, sale) => {
      acc[sale.productId] = (acc[sale.productId] || 0) + sale.quantity;
      return acc;
    }, {} as Record<string, number>);

    const topProductsList = Object.entries(topProducts)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return { name: product?.name || 'Unknown', quantity };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      period: `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`,
      totalRevenue,
      totalProfit,
      totalSales,
      averageOrderValue,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      topProducts: topProductsList,
      salesByDay: generateDailySales(),
    };
  };

  const generateInventoryReport = () => {
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0);
    const outOfStockItems = products.filter(p => p.stock === 0);
    const overstockItems = products.filter(p => p.stock > p.minStock * 3);

    const categoryBreakdown = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = { count: 0, value: 0 };
      }
      acc[product.category].count++;
      acc[product.category].value += product.price * product.stock;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    return {
      totalProducts: products.length,
      totalValue,
      lowStockItems: lowStockItems.length,
      outOfStockItems: outOfStockItems.length,
      overstockItems: overstockItems.length,
      categoryBreakdown,
      lowStockList: lowStockItems.slice(0, 20),
      outOfStockList: outOfStockItems.slice(0, 20),
    };
  };

  const generateFinancialReport = () => {
    const revenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const cogs = filteredSales.reduce((sum, sale) => {
      const product = products.find(p => p.id === sale.productId);
      return sum + (product ? product.cost * sale.quantity : 0);
    }, 0);
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    const monthlyRevenue = generateMonthlyFinancials();

    return {
      period: `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`,
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      monthlyRevenue,
      averageTransactionValue: filteredSales.length > 0 ? revenue / filteredSales.length : 0,
    };
  };

  const generateCustomerReport = () => {
    const activeCustomers = customers.filter(c => c.lastPurchase && 
      isWithinInterval(c.lastPurchase, { start, end })
    );

    const customerSales = filteredSales.reduce((acc, sale) => {
      if (sale.customerId) {
        if (!acc[sale.customerId]) {
          acc[sale.customerId] = { sales: 0, revenue: 0, orders: 0 };
        }
        acc[sale.customerId].sales += sale.quantity;
        acc[sale.customerId].revenue += sale.total;
        acc[sale.customerId].orders++;
      }
      return acc;
    }, {} as Record<string, { sales: number; revenue: number; orders: number }>);

    const topCustomers = Object.entries(customerSales)
      .map(([customerId, data]) => {
        const customer = customers.find(c => c.id === customerId);
        return {
          name: customer?.name || 'Unknown',
          email: customer?.email || '',
          ...data,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    return {
      totalCustomers: customers.length,
      activeCustomers: activeCustomers.length,
      newCustomers: customers.filter(c => 
        isWithinInterval(c.createdAt, { start, end })
      ).length,
      topCustomers,
      averageOrderValue: filteredSales.length > 0 ? 
        filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length : 0,
    };
  };

  const generateDailySales = () => {
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const daysSales = filteredSales.filter(sale => 
        format(sale.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      return {
        date: format(date, 'MMM dd'),
        sales: daysSales.length,
        revenue: daysSales.reduce((sum, sale) => sum + sale.total, 0),
      };
    });
  };

  const generateMonthlyFinancials = () => {
    const months = 12;
    return Array.from({ length: months }, (_, i) => {
      const date = subDays(new Date(), (months - 1 - i) * 30);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthSales = sales.filter(sale => 
        isWithinInterval(sale.date, { start: monthStart, end: monthEnd })
      );
      return {
        month: format(date, 'MMM yyyy'),
        revenue: monthSales.reduce((sum, sale) => sum + sale.total, 0),
        profit: monthSales.reduce((sum, sale) => sum + sale.profit, 0),
      };
    });
  };

  const exportToPDF = (reportData: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.text(`${reportType.toUpperCase()} REPORT`, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`${settings.companyName}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth / 2, 40, { align: 'center' });
    
    let yPosition = 60;
    
    // Report content based on type
    if (reportType === 'sales') {
      const data = generateSalesReport();
      doc.text(`Period: ${data.period}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Total Revenue: $${data.totalRevenue.toFixed(2)}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Total Profit: $${data.totalProfit.toFixed(2)}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Total Sales: ${data.totalSales}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Average Order Value: $${data.averageOrderValue.toFixed(2)}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Profit Margin: ${data.profitMargin.toFixed(1)}%`, 20, yPosition);
      
      yPosition += 20;
      doc.text('Top Products:', 20, yPosition);
      yPosition += 10;
      data.topProducts.forEach((product, index) => {
        doc.text(`${index + 1}. ${product.name}: ${product.quantity} units`, 25, yPosition);
        yPosition += 8;
      });
    }
    
    doc.save(`${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportToExcel = (reportData: any) => {
    const wb = XLSX.utils.book_new();
    
    if (reportType === 'sales') {
      const data = generateSalesReport();
      const ws = XLSX.utils.json_to_sheet([
        { Metric: 'Total Revenue', Value: data.totalRevenue },
        { Metric: 'Total Profit', Value: data.totalProfit },
        { Metric: 'Total Sales', Value: data.totalSales },
        { Metric: 'Average Order Value', Value: data.averageOrderValue },
        { Metric: 'Profit Margin (%)', Value: data.profitMargin },
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');
      
      const topProductsWS = XLSX.utils.json_to_sheet(data.topProducts);
      XLSX.utils.book_append_sheet(wb, topProductsWS, 'Top Products');
    }
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleExport = () => {
    const reportData = {
      sales: generateSalesReport,
      inventory: generateInventoryReport,
      financial: generateFinancialReport,
      customer: generateCustomerReport,
    }[reportType]();

    if (exportFormat === 'pdf') {
      exportToPDF(reportData);
    } else if (exportFormat === 'excel') {
      exportToExcel(reportData);
    }
  };

  const renderReportPreview = () => {
    switch (reportType) {
      case 'sales':
        const salesData = generateSalesReport();
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm text-green-600">Total Revenue</p>
                    <p className="text-xl font-bold text-green-900">${salesData.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-600">Total Profit</p>
                    <p className="text-xl font-bold text-blue-900">${salesData.totalProfit.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm text-purple-600">Total Sales</p>
                    <p className="text-xl font-bold text-purple-900">{salesData.totalSales}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">Top Selling Products</h3>
              <div className="space-y-2">
                {salesData.topProducts.map((product, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-gray-600">{product.quantity} units</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'inventory':
        const inventoryData = generateInventoryReport();
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Products</p>
                <p className="text-xl font-bold text-blue-900">{inventoryData.totalProducts}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Total Value</p>
                <p className="text-xl font-bold text-green-900">${inventoryData.totalValue.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600">Low Stock</p>
                <p className="text-xl font-bold text-yellow-900">{inventoryData.lowStockItems}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600">Out of Stock</p>
                <p className="text-xl font-bold text-red-900">{inventoryData.outOfStockItems}</p>
              </div>
            </div>
            
            {inventoryData.lowStockList.length > 0 && (
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-medium mb-4">Low Stock Items</h3>
                <div className="space-y-2">
                  {inventoryData.lowStockList.map((product, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-red-600">{product.stock} left</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return <div className="text-center py-8 text-gray-500">Select a report type to preview</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <button
          onClick={handleExport}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="financial">Financial Report</option>
              <option value="customer">Customer Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="month">This month</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {/* Refresh preview */}}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Preview</h3>
        {renderReportPreview()}
      </div>
    </div>
  );
}