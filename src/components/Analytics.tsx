import { useState } from 'react';
import { Product, Sale, Return, Settings } from '../types';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Calendar, TrendingUp, DollarSign, Package } from 'lucide-react';

interface AnalyticsProps {
  products: Product[];
  sales: Sale[];
  returns: Return[];
  settings: Settings;
}

export function Analytics({ products, sales, returns, settings }: AnalyticsProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'month'>('30d');

  const convertCurrency = (amount: number) => {
    if (settings.currency === 'IQD') {
      return amount * settings.usdToIqdRate;
    }
    return amount;
  };

  const formatCurrency = (amount: number) => {
    const converted = convertCurrency(amount);
    const symbol = settings.currency === 'USD' ? '$' : 'IQD ';
    return settings.currency === 'USD' 
      ? `${symbol}${converted.toFixed(2)}`
      : `${symbol}${converted.toLocaleString()}`;
  };

  // Filter data based on date range
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
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const { start, end } = getDateRange();
  const filteredSales = sales.filter(sale => 
    isWithinInterval(sale.date, { start, end })
  );
  
  // Separate regular sales from return adjustments for cleaner reporting
  const regularSales = filteredSales.filter(sale => !sale.id.startsWith('return-'));
  const returnAdjustments = filteredSales.filter(sale => sale.id.startsWith('return-'));
  
  const filteredReturns = returns.filter(ret => 
    isWithinInterval(ret.date, { start, end })
  );

  // Revenue trend data
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
  const revenueTrend = Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const daysSales = filteredSales.filter(sale => 
      format(sale.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    const daysReturns = filteredReturns.filter(ret => 
      format(ret.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    return {
      name: format(date, days <= 7 ? 'MMM dd' : 'MM/dd'),
      revenue: daysSales.reduce((sum, sale) => sum + sale.total, 0),
      profit: daysSales.reduce((sum, sale) => sum + sale.profit, 0),
      returns: daysReturns.reduce((sum, ret) => sum + ret.refundAmount, 0),
      sales: daysSales.length,
    };
  });

  // Top products by revenue
  const productRevenue = filteredSales.reduce((acc, sale) => {
    acc[sale.productId] = (acc[sale.productId] || 0) + sale.total;
    return acc;
  }, {} as Record<string, number>);

  const topProductsByRevenue = Object.entries(productRevenue)
    .map(([productId, revenue]) => {
      const product = products.find(p => p.id === productId);
      return {
        name: product?.name || 'Unknown',
        value: revenue,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Category performance
  const categoryPerformance = products.reduce((acc, product) => {
    const productSales = filteredSales.filter(sale => sale.productId === product.id);
    const revenue = productSales.reduce((sum, sale) => sum + sale.total, 0);
    const profit = productSales.reduce((sum, sale) => sum + sale.profit, 0);
    
    if (!acc[product.category]) {
      acc[product.category] = { revenue: 0, profit: 0, sales: 0 };
    }
    
    acc[product.category].revenue += revenue;
    acc[product.category].profit += profit;
    acc[product.category].sales += productSales.length;
    
    return acc;
  }, {} as Record<string, { revenue: number; profit: number; sales: number }>);

  const categoryChartData = Object.entries(categoryPerformance).map(([category, data]) => ({
    name: category,
    revenue: data.revenue,
    profit: data.profit,
    sales: data.sales,
  }));

  // Sales vs Returns
  const salesVsReturns = [
    { name: 'Sales', value: filteredSales.length, amount: filteredSales.reduce((sum, sale) => sum + sale.total, 0) },
    { name: 'Returns', value: filteredReturns.length, amount: filteredReturns.reduce((sum, ret) => sum + ret.refundAmount, 0) },
  ];

  // Profit margin analysis
  const profitMarginData = products.map(product => {
    const productSales = filteredSales.filter(sale => sale.productId === product.id);
    const totalRevenue = productSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = productSales.reduce((sum, sale) => sum + sale.profit, 0);
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    return {
      name: product.name,
      margin,
      revenue: totalRevenue,
      profit: totalProfit,
    };
  }).filter(item => item.revenue > 0).sort((a, b) => b.margin - a.margin).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(filteredSales.reduce((sum, sale) => sum + sale.total, 0))}
              </p>
              {returnAdjustments.length > 0 && (
                <p className="text-xs text-red-600">
                  Returns: {formatCurrency(Math.abs(returnAdjustments.reduce((sum, sale) => sum + sale.total, 0)))}
                </p>
              )}
            </div>
            <DollarSign className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(filteredSales.reduce((sum, sale) => sum + sale.profit, 0))}
              </p>
              {returnAdjustments.length > 0 && (
                <p className="text-xs text-red-600">
                  Return Impact: {formatCurrency(Math.abs(returnAdjustments.reduce((sum, sale) => sum + sale.profit, 0)))}
                </p>
              )}
            </div>
            <TrendingUp className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-purple-600">{regularSales.length}</p>
              {returnAdjustments.length > 0 && (
                <p className="text-xs text-red-600">Returns: {returnAdjustments.length}</p>
              )}
            </div>
            <Package className="h-10 w-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Return Rate</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredSales.length > 0 ? ((filteredReturns.length / filteredSales.length) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Performance Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Returns</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {revenueTrend.map((day, index) => {
                const performance = day.revenue > 0 ? ((day.revenue - day.returns) / day.revenue) * 100 : 0;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{day.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{day.sales}</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">{formatCurrency(day.revenue)}</td>
                    <td className="px-4 py-3 text-sm text-blue-600 font-medium">{formatCurrency(day.profit)}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{formatCurrency(day.returns)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${performance >= 90 ? 'bg-green-500' : performance >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, performance)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{performance.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products by Revenue</h3>
          <div className="space-y-3">
            {topProductsByRevenue.slice(0, 8).map((product, index) => {
              const maxRevenue = topProductsByRevenue[0]?.value || 1;
              const percentage = (product.value / maxRevenue) * 100;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900 truncate">{product.name}</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(product.value)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Performance Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
          <div className="space-y-4">
            {categoryChartData.map((category, index) => {
              const profitMargin = category.revenue > 0 ? (category.profit / category.revenue) * 100 : 0;
              const colors = ['border-blue-500', 'border-green-500', 'border-yellow-500', 'border-red-500', 'border-purple-500'];
              
              return (
                <div key={index} className={`border-l-4 ${colors[index % colors.length]} pl-4 py-2`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    <span className="text-sm text-gray-600">{category.sales} sales</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Revenue:</span>
                      <span className="ml-2 font-medium text-green-600">{formatCurrency(category.revenue)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Profit:</span>
                      <span className="ml-2 font-medium text-blue-600">{formatCurrency(category.profit)}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Profit Margin</span>
                      <span>{profitMargin.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${profitMargin >= 30 ? 'bg-green-500' : profitMargin >= 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, profitMargin * 2)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales vs Returns Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales vs Returns</h3>
          <div className="space-y-6">
            {salesVsReturns.map((item, index) => {
              const isReturns = item.name === 'Returns';
              const total = salesVsReturns.reduce((sum, i) => sum + i.value, 0);
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              
              return (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${isReturns ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{item.value}</div>
                      <div className="text-sm text-gray-600">{formatCurrency(item.amount)}</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${isReturns ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600">{percentage.toFixed(1)}% of total transactions</div>
                </div>
              );
            })}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Return Rate</span>
                <span className={`text-lg font-bold ${filteredSales.length > 0 && ((filteredReturns.length / filteredSales.length) * 100) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {filteredSales.length > 0 ? ((filteredReturns.length / filteredSales.length) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Margin Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profit Margin by Product</h3>
          <div className="space-y-3">
            {profitMarginData.slice(0, 8).map((product, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 truncate">{product.name}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-yellow-600">{product.margin.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600">{formatCurrency(product.profit)} profit</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      product.margin >= 50 ? 'bg-green-500' : 
                      product.margin >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, product.margin)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600">
                  Revenue: {formatCurrency(product.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}