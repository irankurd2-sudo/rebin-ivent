import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, BarChart3 } from 'lucide-react';
import { Sale, Product, Settings } from '../types';
import { formatDateWithSettings } from '../utils/dateFormat';

interface AdvancedReportsProps {
  sales: Sale[];
  products: Product[];
  settings: Settings;
}

export function AdvancedReports({ sales, products, settings }: AdvancedReportsProps) {
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | '365'>('30');

  const filterSalesByDays = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return sales.filter(sale => new Date(sale.date) >= cutoffDate);
  };

  const filteredSales = filterSalesByDays(parseInt(timeRange));

  const profitMarginAnalysis = () => {
    const productProfits = new Map<string, { revenue: number; profit: number; cost: number; quantity: number }>();

    filteredSales.forEach(sale => {
      const existing = productProfits.get(sale.productId) || { revenue: 0, profit: 0, cost: 0, quantity: 0 };
      productProfits.set(sale.productId, {
        revenue: existing.revenue + sale.total,
        profit: existing.profit + sale.profit,
        cost: existing.cost + (sale.unitCost * sale.quantity),
        quantity: existing.quantity + sale.quantity,
      });
    });

    return Array.from(productProfits.entries()).map(([productId, data]) => {
      const product = products.find(p => p.id === productId);
      const profitMargin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;

      return {
        productId,
        productName: product?.name || sales.find(s => s.productId === productId)?.productName || 'Unknown',
        revenue: data.revenue,
        profit: data.profit,
        cost: data.cost,
        quantity: data.quantity,
        profitMargin,
      };
    }).sort((a, b) => b.profitMargin - a.profitMargin);
  };

  const inventoryTurnoverAnalysis = () => {
    return products.map(product => {
      const productSales = filteredSales.filter(s => s.productId === product.id);
      const totalSold = productSales.reduce((sum, s) => sum + s.quantity, 0);
      const avgInventory = (product.stock + totalSold) / 2;
      const turnoverRate = avgInventory > 0 ? totalSold / avgInventory : 0;
      const daysToSell = turnoverRate > 0 ? parseInt(timeRange) / turnoverRate : 0;

      return {
        id: product.id,
        name: product.name,
        currentStock: product.stock,
        totalSold,
        turnoverRate: turnoverRate.toFixed(2),
        daysToSell: daysToSell.toFixed(1),
        status: daysToSell < 30 ? 'fast' : daysToSell < 60 ? 'normal' : 'slow',
      };
    }).sort((a, b) => parseFloat(b.turnoverRate) - parseFloat(a.turnoverRate));
  };

  const salesForecast = () => {
    const dailySales = new Map<string, number>();

    filteredSales.forEach(sale => {
      const dateKey = sale.date.toISOString().split('T')[0];
      dailySales.set(dateKey, (dailySales.get(dateKey) || 0) + sale.total);
    });

    const salesArray = Array.from(dailySales.values());
    const avgDailySales = salesArray.reduce((sum, val) => sum + val, 0) / salesArray.length || 0;

    const trend = salesArray.length > 1
      ? (salesArray[salesArray.length - 1] - salesArray[0]) / salesArray[0] * 100
      : 0;

    return {
      avgDailySales,
      trend,
      forecast7Days: avgDailySales * 7 * (1 + trend / 100),
      forecast30Days: avgDailySales * 30 * (1 + trend / 100),
      forecast90Days: avgDailySales * 90 * (1 + trend / 100),
    };
  };

  const bestPerformingProducts = () => {
    const productPerformance = new Map<string, { revenue: number; quantity: number; profit: number }>();

    filteredSales.forEach(sale => {
      const existing = productPerformance.get(sale.productId) || { revenue: 0, quantity: 0, profit: 0 };
      productPerformance.set(sale.productId, {
        revenue: existing.revenue + sale.total,
        quantity: existing.quantity + sale.quantity,
        profit: existing.profit + sale.profit,
      });
    });

    return Array.from(productPerformance.entries())
      .map(([productId, data]) => {
        const product = products.find(p => p.id === productId);
        return {
          id: productId,
          name: product?.name || sales.find(s => s.productId === productId)?.productName || 'Unknown',
          revenue: data.revenue,
          quantity: data.quantity,
          profit: data.profit,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  const worstPerformingProducts = () => {
    const productPerformance = new Map<string, { revenue: number; lastSold: Date }>();

    products.forEach(product => {
      const productSales = filteredSales.filter(s => s.productId === product.id);
      const revenue = productSales.reduce((sum, s) => sum + s.total, 0);
      const lastSale = productSales.length > 0
        ? new Date(Math.max(...productSales.map(s => s.date.getTime())))
        : new Date(0);

      productPerformance.set(product.id, { revenue, lastSold: lastSale });
    });

    return Array.from(productPerformance.entries())
      .map(([productId, data]) => {
        const product = products.find(p => p.id === productId);
        const daysSinceLastSale = Math.floor((Date.now() - data.lastSold.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: productId,
          name: product?.name || 'Unknown',
          revenue: data.revenue,
          stock: product?.stock || 0,
          daysSinceLastSale: data.lastSold.getTime() === 0 ? 'Never' : daysSinceLastSale,
        };
      })
      .filter(p => p.revenue < 100 || p.daysSinceLastSale === 'Never' || p.daysSinceLastSale > 30)
      .sort((a, b) => {
        if (typeof a.daysSinceLastSale === 'string') return -1;
        if (typeof b.daysSinceLastSale === 'string') return 1;
        return (b.daysSinceLastSale as number) - (a.daysSinceLastSale as number);
      })
      .slice(0, 10);
  };

  const profitMargins = profitMarginAnalysis();
  const turnoverData = inventoryTurnoverAnalysis();
  const forecast = salesForecast();
  const bestProducts = bestPerformingProducts();
  const worstProducts = worstPerformingProducts();

  const formatCurrency = (amount: number) => {
    const value = (amount * settings.usdToIqdRate).toFixed(0);
    return `IQD ${value}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <span className={`flex items-center gap-1 text-sm font-semibold ${forecast.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {forecast.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(forecast.trend).toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Avg. Daily Sales</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(forecast.avgDailySales)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">7-Day Forecast</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(forecast.forecast7Days)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">30-Day Forecast</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(forecast.forecast30Days)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Profit Margins
          </h3>
          <div className="space-y-3">
            {profitMargins.slice(0, 5).map((item, index) => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{item.productName}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{item.profitMargin.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">{formatCurrency(item.profit)} profit</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Inventory Turnover
          </h3>
          <div className="space-y-3">
            {turnoverData.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-600">Stock: {item.currentStock} | Sold: {item.totalSold}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{item.turnoverRate}x</p>
                  <p className="text-xs text-gray-600">{item.daysToSell} days</p>
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                    item.status === 'fast' ? 'bg-green-100 text-green-800' :
                    item.status === 'normal' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Best Performing Products
          </h3>
          <div className="space-y-2">
            {bestProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600 w-6">{index + 1}.</span>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-600">{product.quantity} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(product.revenue)}</p>
                  <p className="text-xs text-green-600">{formatCurrency(product.profit)} profit</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Slow Moving Products
          </h3>
          <div className="space-y-2">
            {worstProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600 w-6">{index + 1}.</span>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-600">Stock: {product.stock}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(product.revenue)}</p>
                  <p className="text-xs text-red-600">
                    {typeof product.daysSinceLastSale === 'string'
                      ? product.daysSinceLastSale
                      : `${product.daysSinceLastSale} days ago`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
