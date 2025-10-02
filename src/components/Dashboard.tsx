import { TrendingUp, Package, AlertTriangle, DollarSign, Users, ShoppingCart, RotateCcw, TrendingDown, Download } from 'lucide-react';
import { Plus, Zap } from 'lucide-react';
import { Product, Sale, Return, Settings } from '../types';
import { format, subDays, isAfter } from 'date-fns';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  returns: Return[];
  settings: Settings;
  onQuickSale: () => void;
  onAddProduct: () => void;
}

export function Dashboard({ products, sales, returns, settings, onQuickSale, onAddProduct }: DashboardProps) {
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

  // Calculate stats
  const totalProducts = products.length;
  const totalCost = products.reduce((sum, product) => sum + (product.cost * product.stock), 0);
  const lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStockItems = products.filter(p => p.stock === 0).length;
  
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalReturns = returns.reduce((sum, ret) => sum + ret.refundAmount, 0);
  
  // Calculate net values (after returns)
  const returnAdjustments = sales.filter(sale => sale.id.startsWith('return-'));
  const netRevenue = totalRevenue; // Already includes return adjustments
  const netProfit = totalProfit; // Already includes return adjustments
  
  // Calculate total cost of goods sold (COGS)
  const totalCOGS = sales.reduce((sum, sale) => {
    const product = products.find(p => p.id === sale.productId);
    return sum + (product ? product.cost * sale.quantity : 0);
  }, 0);

  // Get recent data (last 7 days)
  const recentSales = sales.filter(sale => isAfter(sale.date, subDays(new Date(), 7)));
  const recentRevenue = recentSales.reduce((sum, sale) => sum + sale.total, 0);

  // Top selling products
  const productSales = sales.reduce((acc, sale) => {
    acc[sale.productId] = (acc[sale.productId] || 0) + sale.quantity;
    return acc;
  }, {} as Record<string, number>);

  const topProducts = Object.entries(productSales)
    .map(([productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return {
        name: product?.name || 'Unknown',
        value: quantity,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const lowStockProducts = products
    .filter(p => p.stock <= p.minStock && p.stock > 0)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onQuickSale}
            className="flex items-center justify-center space-x-3 p-6 bg-green-50 hover:bg-green-100 rounded-xl border-2 border-green-200 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Zap className="h-6 w-6 text-green-600" />
            <span className="text-lg font-semibold text-green-700">Quick Sale</span>
          </button>
          
          <button
            onClick={onAddProduct}
            className="flex items-center justify-center space-x-3 p-6 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-blue-700">Add Product</span>
          </button>
          
          <button
            onClick={() => {
              const data = {
                products,
                categories: [],
                sales,
                returns,
                customers,
                sellers: [],
                alertRules: [],
                notifications: [],
                settings,
                metadata: {
                  exportDate: new Date().toISOString(),
                  version: '1.0.0',
                  totalProducts: products.length,
                  totalSales: sales.length,
                }
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `quick-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center justify-center space-x-3 p-6 bg-purple-50 hover:bg-purple-100 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Download className="h-6 w-6 text-purple-600" />
            <span className="text-lg font-semibold text-purple-700">Quick Backup</span>
          </button>
        </div>
      </div>

      {/* KPI Cards - In one line below Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(netRevenue)}</p>
              <p className="text-sm text-gray-500">
                Net revenue {returnAdjustments.length > 0 ? '(after returns)' : ''}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Cost</p>
              <p className="text-3xl font-bold text-indigo-600">{formatCurrency(totalCost)}</p>
              <p className="text-sm text-gray-500">{totalProducts} products</p>
            </div>
            <Package className="h-12 w-12 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cost of Goods Sold</p>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(totalCOGS)}</p>
              <p className="text-sm text-gray-500">Returns: {formatCurrency(totalReturns)}</p>
            </div>
            <ShoppingCart className="h-12 w-12 text-orange-500" />
          </div>
        </div>


        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(netProfit)}</p>
              <p className="text-sm text-gray-500">
                Margin: {netRevenue > 0 ? ((netProfit / netRevenue) * 100).toFixed(1) : 0}%
                {returnAdjustments.length > 0 ? ' (net)' : ''}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Stock Status Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Status Alert */}
        {lowStockProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Low Stock Alert</h3>
              <p className="text-sm text-gray-600">Items that need immediate attention</p>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                {lowStockProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {product.image && (
                        <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">SKU: {product.sku} • {product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600">{product.stock} left</p>
                      <p className="text-sm text-gray-600">Min: {product.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Top Selling Products - Simplified */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{product.name}</span>
                </div>
                <span className="text-sm font-medium text-green-600">{product.value} sold</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* If no low stock, show stock summary */}
        {lowStockProducts.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Status Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-900">Well Stocked</span>
                </div>
                <span className="text-green-700">{products.filter(p => p.stock > p.minStock).length} items</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium text-yellow-900">Low Stock</span>
                </div>
                <span className="text-yellow-700">{lowStockItems} items</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-red-900">Out of Stock</span>
                </div>
                <span className="text-red-700">{outOfStockItems} items</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}