import { useState, useMemo } from 'react';
import { TrendingUp, Target, AlertCircle, Award, Calendar, Filter } from 'lucide-react';
import { Product, Sale, Customer, Settings, KPI, Forecast } from '../types';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface BusinessIntelligenceProps {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  settings: Settings;
}

export function BusinessIntelligence({ products, sales, customers, settings }: BusinessIntelligenceProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
  const [selectedKPI, setSelectedKPI] = useState<string>('revenue');

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d': return { start: subDays(now, 7), end: now };
      case '30d': return { start: subDays(now, 30), end: now };
      case '90d': return { start: subDays(now, 90), end: now };
      case 'year': return { start: subDays(now, 365), end: now };
      default: return { start: subDays(now, 30), end: now };
    }
  };

  const { start, end } = getDateRange();
  const filteredSales = sales.filter(sale => isWithinInterval(sale.date, { start, end }));

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalSales = filteredSales.length;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    const previousPeriodStart = subDays(start, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const previousPeriodSales = sales.filter(sale => 
      isWithinInterval(sale.date, { start: previousPeriodStart, end: start })
    );
    const previousRevenue = previousPeriodSales.reduce((sum, sale) => sum + sale.total, 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const inventoryValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const inventoryTurnover = inventoryValue > 0 ? totalRevenue / inventoryValue : 0;

    const activeCustomers = customers.filter(c => 
      c.lastPurchase && isWithinInterval(c.lastPurchase, { start, end })
    ).length;

    return [
      {
        id: 'revenue',
        name: 'Total Revenue',
        value: totalRevenue,
        target: totalRevenue * 1.2,
        unit: '$',
        trend: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'stable',
        period: dateRange,
        growth: revenueGrowth,
      },
      {
        id: 'profit',
        name: 'Total Profit',
        value: totalProfit,
        target: totalProfit * 1.15,
        unit: '$',
        trend: 'up',
        period: dateRange,
        growth: 0,
      },
      {
        id: 'aov',
        name: 'Average Order Value',
        value: averageOrderValue,
        target: averageOrderValue * 1.1,
        unit: '$',
        trend: 'stable',
        period: dateRange,
        growth: 0,
      },
      {
        id: 'customers',
        name: 'Active Customers',
        value: activeCustomers,
        target: activeCustomers * 1.25,
        unit: '',
        trend: 'up',
        period: dateRange,
        growth: 0,
      },
      {
        id: 'turnover',
        name: 'Inventory Turnover',
        value: inventoryTurnover,
        target: 4,
        unit: 'x',
        trend: inventoryTurnover > 2 ? 'up' : 'down',
        period: dateRange,
        growth: 0,
      },
    ] as KPI[];
  }, [filteredSales, products, customers, dateRange, start, end]);

  // Forecasting
  const forecasts = useMemo(() => {
    return products.slice(0, 10).map(product => {
      const productSales = filteredSales.filter(sale => sale.productId === product.id);
      const totalSold = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
      const averageDailySales = totalSold / Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const predictedDemand = Math.round(averageDailySales * 30); // 30-day forecast
      const recommendedOrder = Math.max(0, predictedDemand - product.stock);

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        predictedDemand,
        recommendedOrder,
        confidence: Math.min(95, Math.max(60, totalSold * 10)), // Simple confidence calculation
        period: '30 days',
      } as Forecast;
    });
  }, [products, filteredSales, start, end]);

  // Customer Analytics (RFM Analysis)
  const customerAnalytics = useMemo(() => {
    const now = new Date();
    return customers.map(customer => {
      const customerSales = sales.filter(sale => sale.customerId === customer.id);
      const recency = customer.lastPurchase ? 
        Math.floor((now.getTime() - customer.lastPurchase.getTime()) / (1000 * 60 * 60 * 24)) : 999;
      const frequency = customerSales.length;
      const monetary = customerSales.reduce((sum, sale) => sum + sale.total, 0);

      // Simple RFM scoring (1-5 scale)
      const recencyScore = recency <= 30 ? 5 : recency <= 60 ? 4 : recency <= 90 ? 3 : recency <= 180 ? 2 : 1;
      const frequencyScore = frequency >= 10 ? 5 : frequency >= 5 ? 4 : frequency >= 3 ? 3 : frequency >= 2 ? 2 : 1;
      const monetaryScore = monetary >= 1000 ? 5 : monetary >= 500 ? 4 : monetary >= 200 ? 3 : monetary >= 100 ? 2 : 1;

      let segment = 'At Risk';
      if (recencyScore >= 4 && frequencyScore >= 4 && monetaryScore >= 4) segment = 'Champions';
      else if (recencyScore >= 3 && frequencyScore >= 3 && monetaryScore >= 3) segment = 'Loyal Customers';
      else if (recencyScore >= 4 && frequencyScore <= 2) segment = 'New Customers';
      else if (recencyScore <= 2 && frequencyScore >= 3) segment = 'At Risk';

      return {
        ...customer,
        recency,
        frequency,
        monetary,
        recencyScore,
        frequencyScore,
        monetaryScore,
        segment,
      };
    }).sort((a, b) => b.monetary - a.monetary);
  }, [customers, sales]);

  // Trend Analysis
  const trendData = useMemo(() => {
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const daysSales = filteredSales.filter(sale => 
        format(sale.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      return {
        date: format(date, 'MMM dd'),
        revenue: daysSales.reduce((sum, sale) => sum + sale.total, 0),
        profit: daysSales.reduce((sum, sale) => sum + sale.profit, 0),
        orders: daysSales.length,
        customers: new Set(daysSales.map(sale => sale.customerId).filter(Boolean)).size,
      };
    });
  }, [filteredSales, start, end]);

  // Performance Goals
  const performanceGoals = [
    { name: 'Monthly Revenue', current: kpis[0].value, target: kpis[0].target, unit: '$' },
    { name: 'Customer Acquisition', current: 25, target: 50, unit: '' },
    { name: 'Profit Margin', current: 25.5, target: 30, unit: '%' },
    { name: 'Inventory Turnover', current: kpis[4].value, target: kpis[4].target, unit: 'x' },
  ];

  const formatCurrency = (amount: number) => {
    return settings.currency === 'USD' ? `$${amount.toFixed(2)}` : `IQD ${(amount * settings.usdToIqdRate).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Business Intelligence</h2>
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
            <option value="year">Last year</option>
          </select>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpis.map(kpi => (
          <div key={kpi.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">{kpi.name}</h3>
              <div className={`p-1 rounded-full ${
                kpi.trend === 'up' ? 'bg-green-100' : 
                kpi.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                <TrendingUp className={`h-4 w-4 ${
                  kpi.trend === 'up' ? 'text-green-600' : 
                  kpi.trend === 'down' ? 'text-red-600 transform rotate-180' : 'text-gray-600'
                }`} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {kpi.unit === '$' ? formatCurrency(kpi.value) : `${kpi.value.toFixed(kpi.unit === 'x' ? 1 : 0)}${kpi.unit}`}
              </span>
              {kpi.growth !== 0 && (
                <span className={`text-sm ${kpi.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.growth > 0 ? '+' : ''}{kpi.growth.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Target: {kpi.unit === '$' ? formatCurrency(kpi.target) : `${kpi.target.toFixed(0)}${kpi.unit}`}</span>
                <span>{((kpi.value / kpi.target) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (kpi.value / kpi.target) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Intelligence Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trend Analysis</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {trendData.map((day, index) => {
              const prevDay = trendData[index - 1];
              const revenueChange = prevDay ? ((day.revenue - prevDay.revenue) / Math.max(prevDay.revenue, 1)) * 100 : 0;
              const isPositive = revenueChange >= 0;
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">{day.date}</div>
                    {index > 0 && (
                      <div className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`h-3 w-3 mr-1 ${!isPositive ? 'transform rotate-180' : ''}`} />
                        {Math.abs(revenueChange).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">{formatCurrency(day.revenue)}</div>
                    <div className="text-xs text-gray-600">{day.orders} orders • {day.customers} customers</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Goals Progress */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Goals</h3>
          <div className="space-y-6">
            {performanceGoals.map((goal, index) => {
              const percentage = Math.min(100, (goal.current / goal.target) * 100);
              const isOnTrack = percentage >= 80;
              
              return (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">{goal.name}</h4>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isOnTrack ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isOnTrack ? 'On Track' : 'Needs Attention'}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Current: {goal.unit === '$' ? formatCurrency(goal.current) : `${goal.current.toFixed(goal.unit === '%' ? 1 : 0)}${goal.unit}`}
                    </span>
                    <span className="text-gray-600">
                      Target: {goal.unit === '$' ? formatCurrency(goal.target) : `${goal.target.toFixed(goal.unit === '%' ? 1 : 0)}${goal.unit}`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full transition-all duration-500 ${
                        percentage >= 100 ? 'bg-green-500' : 
                        percentage >= 80 ? 'bg-blue-500' : 
                        percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-right text-sm font-medium text-gray-900">
                    {percentage.toFixed(1)}% Complete
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Segmentation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Segments (RFM)</h3>
          <div className="space-y-4">
            {Object.entries(
              customerAnalytics.reduce((acc, customer) => {
                acc[customer.segment] = (acc[customer.segment] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([segment, count], index) => {
              const totalCustomers = customerAnalytics.length;
              const percentage = totalCustomers > 0 ? (count / totalCustomers) * 100 : 0;
              const colors = {
                'Champions': 'bg-green-500 border-green-200',
                'Loyal Customers': 'bg-blue-500 border-blue-200',
                'New Customers': 'bg-purple-500 border-purple-200',
                'At Risk': 'bg-red-500 border-red-200'
              };
              
              return (
                <div key={segment} className={`border-2 ${colors[segment as keyof typeof colors] || 'bg-gray-500 border-gray-200'} rounded-lg p-4`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-white">{segment}</h4>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full h-2 mb-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-white text-sm">{percentage.toFixed(1)}% of customers</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Demand Forecast */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">30-Day Sales Forecast</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {forecasts.slice(0, 8).map(forecast => (
              <div key={forecast.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{forecast.productName}</p>
                  <p className="text-sm text-gray-600">
                    Current: {forecast.currentStock} | Predicted: {forecast.predictedDemand}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">
                    Order: {forecast.recommendedOrder}
                  </p>
                  <p className="text-xs text-gray-500">
                    {forecast.confidence}% confidence
                  </p>
                  <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full"
                      style={{ width: `${forecast.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Customers (RFM Analysis)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Segment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Purchase
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RFM Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customerAnalytics.slice(0, 10).map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.segment === 'Champions' ? 'bg-green-100 text-green-800' :
                      customer.segment === 'Loyal Customers' ? 'bg-blue-100 text-blue-800' :
                      customer.segment === 'New Customers' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {customer.segment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(customer.monetary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.frequency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.recency} days ago
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.recencyScore}-{customer.frequencyScore}-{customer.monetaryScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}