import { useState } from 'react';
import { Users, TrendingUp, DollarSign, Award, Calendar, Filter, Download, Package, Search } from 'lucide-react';
import { Seller, Sale, Product, Settings, SellerReport } from '../types';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { formatDateWithSettings, formatTimeOnly } from '../utils/dateFormat';

interface SellerReportsProps {
  sellers: Seller[];
  sales: Sale[];
  products: Product[];
  settings: Settings;
}

export function SellerReports({ sellers, sales, products, settings }: SellerReportsProps) {
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'month' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [productSearch, setProductSearch] = useState<string>('');

  const formatCurrency = (amount: number) => {
    return `IQD ${amount.toLocaleString()}`;
  };

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d': return { start: subDays(now, 7), end: now };
      case '30d': return { start: subDays(now, 30), end: now };
      case '90d': return { start: subDays(now, 90), end: now };
      case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'custom': return {
        start: new Date(customStartDate + 'T00:00:00'),
        end: new Date(customEndDate + 'T23:59:59')
      };
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
      const totalDiscount = sellerSales.reduce((sum, sale) => sum + sale.discount, 0);
      const totalCostPrice = sellerSales.reduce((sum, sale) => {
        return sum + (sale.unitCost * sale.quantity);
      }, 0);
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
        totalDiscount,
        totalCostPrice,
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Seller Reports</h2>
          <div className="flex flex-wrap items-center gap-2">
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
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === 'custom' && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
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

        {selectedSeller && (
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search by product/service name..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {productSearch && (
              <button
                onClick={() => setProductSearch('')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* All Sellers Overview */}
      {!selectedSeller && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">All Sellers Performance</h3>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
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
                    Cost Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                      {formatCurrency(report.totalCostPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(report.totalDiscount)}
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

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-4">
            {sellerReports.map(report => (
              <div key={report.sellerId} className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-gray-900">{report.sellerName}</div>
                      <div className="text-xs text-gray-500">{report.totalSales} sales</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSeller(report.sellerId)}
                    className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition-colors font-medium"
                  >
                    View
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Revenue</div>
                    <div className="text-sm font-bold text-green-600">{formatCurrency(report.totalRevenue)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Profit</div>
                    <div className="text-sm font-bold text-blue-600">{formatCurrency(report.totalProfit)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Commission</div>
                    <div className="text-sm font-bold text-purple-600">{formatCurrency(report.commissionEarned)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Avg Order</div>
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(report.averageOrderValue)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Seller Report */}
      {selectedReport && (
        <div className="space-y-6">
          {/* Product/Service Filter Stats */}
          {productSearch && (() => {
            const productFilteredSales = filteredSales.filter(sale =>
              (sale.sellerId === selectedReport.sellerId || sale.sellerName === selectedReport.sellerName) &&
              sale.productName.toLowerCase().includes(productSearch.toLowerCase())
            );

            if (productFilteredSales.length === 0) {
              return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">No sales found for "{productSearch}"</p>
                </div>
              );
            }

            const totalQuantity = productFilteredSales.reduce((sum, sale) => sum + sale.quantity, 0);
            const totalRevenue = productFilteredSales.reduce((sum, sale) => sum + sale.total, 0);
            const totalCost = productFilteredSales.reduce((sum, sale) => sum + (sale.unitCost * sale.quantity), 0);
            const totalProfit = productFilteredSales.reduce((sum, sale) => sum + sale.profit, 0);
            const totalDiscount = productFilteredSales.reduce((sum, sale) => sum + sale.discount, 0);

            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Results for: "{productSearch}"
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Units Sold</p>
                    <p className="text-2xl font-bold text-blue-600">{totalQuantity}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Total Cost</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalCost)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Profit</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalProfit)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Discount</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDiscount)}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Seller KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Sales</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 truncate">{selectedReport.totalSales}</p>
                </div>
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">{formatCurrency(selectedReport.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-green-500 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Profit</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600 truncate">{formatCurrency(selectedReport.totalProfit)}</p>
                </div>
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Cost Price</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600 truncate">{formatCurrency(selectedReport.totalCostPrice)}</p>
                </div>
                <Package className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Discount</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600 truncate">{formatCurrency(selectedReport.totalDiscount)}</p>
                </div>
                <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-red-500 flex-shrink-0 ml-2" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Commission</p>
                  <p className="text-xl sm:text-2xl font-bold text-cyan-600 truncate">{formatCurrency(selectedReport.commissionEarned)}</p>
                </div>
                <Award className="h-8 w-8 sm:h-10 sm:w-10 text-cyan-500 flex-shrink-0 ml-2" />
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

          {/* Detailed Sales List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">All Sales by {selectedReport.sellerName}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales
                    .filter(sale => sale.sellerId === selectedReport.sellerId || sale.sellerName === selectedReport.sellerName)
                    .filter(sale => !productSearch || sale.productName.toLowerCase().includes(productSearch.toLowerCase()))
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium">{formatDateWithSettings(sale.date, settings.dateFormat)}</div>
                              <div className="text-xs text-gray-500">{formatTimeOnly(sale.date)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{sale.id.slice(-6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {sale.productCategory || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(sale.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                          {formatCurrency(sale.discount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {formatCurrency(sale.profit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                          {formatCurrency(sale.unitCost * sale.quantity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.customerName || 'Walk-in'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {filteredSales
              .filter(sale => sale.sellerId === selectedReport.sellerId || sale.sellerName === selectedReport.sellerName)
              .filter(sale => !productSearch || sale.productName.toLowerCase().includes(productSearch.toLowerCase()))
              .length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">
                  {productSearch ? `No sales found for "${productSearch}"` : 'No sales found for this period'}
                </p>
              </div>
            )}
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