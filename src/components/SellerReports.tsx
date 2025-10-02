import { useState } from 'react';
import { Users, TrendingUp, DollarSign, Award, Calendar, Filter, Download } from 'lucide-react';
import { Seller, Sale, Product, Settings, SellerReport } from '../types';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface SellerReportsProps {
  sellers: Seller[];
  sales: Sale[];
  products: Product[];
  settings: Settings;
}

export function SellerReports({ sellers, sales, products, settings }: SellerReportsProps) {
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'month'>('30d');

  const formatCurrency = (amount: number) => {
    const converted = settings.currency === 'IQD' ? amount * settings.usdToIqdRate : amount;
    const symbol = settings.currency === 'USD' ? '$' : 'IQD ';
    return settings.currency === 'USD' 
      ? `${symbol}${converted.toFixed(2)}`
      : `${symbol}${converted.toLocaleString()}`;
  };

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d': return { start: subDays(now, 7), end: now };
      case '30d': return { start: subDays(now, 30), end: now };
      case '90d': return { start: subDays(now, 90), end: now };
      case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
      default: return { start: subDays(now, 30), end: now };
    }
  };

  const { start, end } = getDateRange();
  const filteredSales = sales.filter(sale => isWithinInterval(sale.date, { start, end }));

  const generateSellerReports = (): SellerReport[] => {
    return sellers.map(seller => {
      const sellerSales = filteredSales.filter(sale => 
        sale.sellerId === seller.id || sale.sellerName === seller.name
      );
      
      const totalSales = sellerSales.length;
      const totalRevenue = sellerSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalProfit = sellerSales.reduce((sum, sale) => sum + sale.profit, 0);
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
      
      // Top products for this seller
      const productSales = sellerSales.reduce((acc, sale) => {
        if (!acc[sale.productId]) {
          acc[sale.productId] = { name: sale.productName, quantity: 0, revenue: 0 };
        }
        acc[sale.productId].quantity += sale.quantity;
        acc[sale.productId].revenue += sale.total;
        return acc;
      }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Daily performance
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const dailyPerformance = Array.from({ length: days }, (_, i) => {
        const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const daysSales = sellerSales.filter(sale => 
          format(sale.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        return {
          date: format(date, 'MMM dd'),
          sales: daysSales.length,
          revenue: daysSales.reduce((sum, sale) => sum + sale.total, 0),
        };
      });

      const commissionEarned = totalRevenue * (seller.commissionRate || 0) / 100;

      return {
        sellerId: seller.id,
        sellerName: seller.name,
        totalSales,
        totalRevenue,
        totalProfit,
        averageOrderValue,
        topProducts,
        dailyPerformance,
        commissionEarned,
      };
    });
  };

  const sellerReports = generateSellerReports();
  const selectedReport = selectedSeller ? sellerReports.find(r => r.sellerId === selectedSeller) : null;

  const exportSellerReport = (report: SellerReport) => {
    const data = {
      seller: report.sellerName,
      period: `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`,
      summary: {
        totalSales: report.totalSales,
        totalRevenue: report.totalRevenue,
        totalProfit: report.totalProfit,
        averageOrderValue: report.averageOrderValue,
        commissionEarned: report.commissionEarned,
      },
      topProducts: report.topProducts,
      dailyPerformance: report.dailyPerformance,
      generatedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seller-report-${report.sellerName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Seller Reports</h2>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="month">This month</option>
          </select>
        </div>
      </div>

      {/* Seller Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={selectedSeller}
            onChange={(e) => setSelectedSeller(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sellers Overview</option>
            {sellers.map(seller => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </select>
          {selectedReport && (
            <button
              onClick={() => exportSellerReport(selectedReport)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* All Sellers Overview */}
      {!selectedSeller && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">All Sellers Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sellerReports.map(report => (
                  <tr key={report.sellerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{report.sellerName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalSales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(report.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {formatCurrency(report.totalProfit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(report.averageOrderValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                      {formatCurrency(report.commissionEarned)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedSeller(report.sellerId)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Seller Report */}
      {selectedReport && (
        <div className="space-y-6">
          {/* Seller KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedReport.totalSales}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedReport.totalRevenue)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Profit</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(selectedReport.totalProfit)}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Commission</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(selectedReport.commissionEarned)}</p>
                </div>
                <Award className="h-10 w-10 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Performance</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedReport.dailyPerformance.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{day.date}</p>
                      <p className="text-sm text-gray-600">{day.sales} sales</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{formatCurrency(day.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
              <div className="space-y-3">
                {selectedReport.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.quantity} units</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {sellers.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sellers yet</h3>
          <p className="mt-1 text-sm text-gray-500">Sellers will appear here after making sales.</p>
        </div>
      )}
    </div>
  );
}