import { TrendingUp, Package, AlertTriangle, DollarSign, Users, ShoppingCart, RotateCcw, TrendingDown, Download, AlertOctagon } from 'lucide-react';
import { Plus, Zap } from 'lucide-react';
import { Product, Sale, Return, Settings } from '../types';
import { format, subDays, isAfter } from 'date-fns';
import { getProductsNeedingAttention, getStockSummary } from '../utils/stockAlerts';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  returns: Return[];
  settings: Settings;
  onQuickSale?: () => void;
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
    return `IQD ${converted.toLocaleString()}`;
  };

  // Calculate stats
  const totalProducts = products.length;
  const totalCost = products.reduce((sum, product) => sum + (product.cost * product.stock), 0);

  // Enhanced stock alerts using the new system
  const stockSummary = getStockSummary(products, settings.lowStockThreshold);
  const productsNeedingAttention = getProductsNeedingAttention(products, settings.lowStockThreshold);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalReturns = returns.reduce((sum, ret) => sum + ret.refundAmount, 0);

  // Calculate net values (after returns)
  const returnAdjustments = sales.filter(sale => sale.id.startsWith('return-'));
  const netRevenue = totalRevenue;
  const netProfit = totalProfit;

  // Calculate total cost of goods sold (COGS)
  const totalCOGS = sales.reduce((sum, sale) => {
    const unitCost = (sale as any).unit_cost || 0;
    const quantity = sale.quantity || 0;
    if (unitCost > 0) {
      return sum + (unitCost * quantity);
    }
    const product = products.find(p => p.id === sale.productId);
    return sum + (product ? product.cost * quantity : 0);
  }, 0);

  // Get recent data (last 7 days)
  const recentSales = sales.filter(sale => isAfter(sale.date, subDays(new Date(), 7)));
  const recentRevenue = recentSales.reduce((sum, sale) => sum + sale.total, 0);

  // Last selling products (most recent sales)
  const lastSales = [...sales]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);


  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {onQuickSale && (
            <button
              onClick={onQuickSale}
              className="group relative flex items-center justify-center space-x-3 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-xl border-2 border-emerald-200 hover:border-emerald-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/30 to-emerald-400/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-emerald-700">Quick Sale</span>
            </button>
          )}

          {onQuickSale && (
            <button
              onClick={onAddProduct}
              className="group relative flex items-center justify-center space-x-3 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-blue-700">Add Product</span>
            </button>
          )}
          
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
            className="group relative flex items-center justify-center space-x-3 p-6 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 rounded-xl border-2 border-violet-200 hover:border-violet-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-violet-400/30 to-violet-400/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg shadow-lg">
              <Download className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-violet-700">Quick Backup</span>
          </button>
        </div>
      </div>

      {/* KPI Cards - In one line below Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-600 mb-2">Inventory Cost</p>
              <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">{formatCurrency(totalCost)}</p>
              <p className="text-xs text-slate-500 font-medium">{totalProducts} products</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-600 mb-2">Cost of Goods Sold</p>
              <p className="text-3xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-1">{formatCurrency(totalCOGS)}</p>
              <p className="text-xs text-slate-500 font-medium">Returns: {formatCurrency(totalReturns)}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-600 mb-2">Total Income</p>
              <p className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">{formatCurrency(netRevenue)}</p>
              <p className="text-xs text-slate-500 font-medium">
                Net revenue {returnAdjustments.length > 0 ? '(after returns)' : ''}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-600 mb-2">Total Profit</p>
              <p className="text-3xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-1">{formatCurrency(netProfit)}</p>
              <p className="text-xs text-slate-500 font-medium">
                Margin: {netRevenue > 0 ? ((netProfit / netRevenue) * 100).toFixed(1) : 0}%
                {returnAdjustments.length > 0 ? ' (net)' : ''}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stock Status Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Status Alert - Enhanced */}
        {productsNeedingAttention.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Stock Alerts</h3>
                    <p className="text-sm text-slate-600">{stockSummary.totalNeedingAttention} items need attention</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {stockSummary.outOfStock > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                      {stockSummary.outOfStock} Out
                    </span>
                  )}
                  {stockSummary.low > 0 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                      {stockSummary.low} Low
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                {(() => {
                  const sortedByCategory = [...productsNeedingAttention].sort((a, b) => {
                    if (a.category === b.category) {
                      if (a.stockStatus.level === 'out' && b.stockStatus.level !== 'out') return -1;
                      if (a.stockStatus.level !== 'out' && b.stockStatus.level === 'out') return 1;
                      return a.name.localeCompare(b.name);
                    }
                    return a.category.localeCompare(b.category);
                  });

                  let currentCategory = '';
                  return sortedByCategory.map(product => {
                    const status = product.stockStatus;
                    const showCategoryHeader = currentCategory !== product.category;
                    currentCategory = product.category;

                    return (
                      <div key={product.id}>
                        {showCategoryHeader && (
                          <div className="pt-2 pb-2 px-2">
                            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{product.category}</h4>
                          </div>
                        )}
                        <div
                          className={`p-4 ${status.bgColor} border ${status.borderColor} rounded-lg transition-all hover:shadow-md`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              {status.level === 'out' && <AlertOctagon className="h-5 w-5 text-red-600 flex-shrink-0" />}
                              {status.level === 'low' && <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />}

                              {product.image && (
                                <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-semibold ${status.textColor} truncate`}>{product.name}</h4>
                                <p className="text-xs text-gray-600 truncate">SKU: {product.sku}</p>
                              </div>
                            </div>
                            <div className="text-right ml-3">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 ${status.bgColor} ${status.textColor} text-xs font-bold rounded-full border ${status.borderColor}`}>
                                  {status.label}
                                </span>
                              </div>
                              <p className={`text-lg font-black ${status.textColor} mt-1`}>{product.stock}</p>
                              <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                            </div>
                          </div>

                          {/* Color Alerts - Only Out of Stock */}
                          {status.colorAlerts && status.colorAlerts.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <p className="text-xs font-semibold text-red-800 mb-2">⚠️ Out of Stock Colors:</p>
                              <div className="flex flex-wrap gap-2">
                                {status.colorAlerts.map((colorAlert) => (
                                  <div
                                    key={colorAlert.color}
                                    className="flex items-center gap-2 px-2 py-1 rounded bg-red-100 border border-red-300"
                                  >
                                    <div
                                      className="w-4 h-4 rounded-full border border-gray-400 shadow-sm flex-shrink-0"
                                      style={{ backgroundColor: colorAlert.colorCode }}
                                    />
                                    <span className="text-xs font-medium text-red-800">
                                      {colorAlert.color}: Out of Stock
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}
        
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sales</h3>
          <div className="space-y-3">
            {lastSales.length > 0 ? (
              lastSales.map((sale, index) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{sale.productName}</p>
                    <p className="text-xs text-gray-500">
                      {format(sale.date, settings.dateFormat)} • Qty: {sale.quantity}
                      {sale.productColor && ` • Color: ${sale.productColor}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">{formatCurrency(sale.total)}</p>
                    {sale.sellerName && (
                      <p className="text-xs text-gray-500">{sale.sellerName}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No sales yet</p>
            )}
          </div>
        </div>
        
        {/* Enhanced Stock Summary - Always visible when needed */}
        {productsNeedingAttention.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Stock Status Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-semibold text-green-900">Well Stocked</span>
                </div>
                <span className="text-lg font-bold text-green-700">{stockSummary.good} items</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-semibold text-yellow-900">Low Stock</span>
                </div>
                <span className="text-lg font-bold text-yellow-700">{stockSummary.low} items</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-semibold text-red-900">Out of Stock</span>
                </div>
                <span className="text-lg font-bold text-red-700">{stockSummary.outOfStock} items</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Stock Overview</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-black text-green-600">{stockSummary.good}</div>
                <div className="text-xs font-medium text-green-700 mt-1">Well Stocked</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-black text-yellow-600">{stockSummary.low}</div>
                <div className="text-xs font-medium text-yellow-700 mt-1">Low Stock</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-black text-red-600">{stockSummary.outOfStock}</div>
                <div className="text-xs font-medium text-red-700 mt-1">Out of Stock</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-2xl font-black text-slate-600">{products.length}</div>
                <div className="text-xs font-medium text-slate-700 mt-1">Total Items</div>
              </div>
            </div>
            {stockSummary.outOfStock > 0 && (
              <div className="mt-4 p-4 bg-red-100 rounded-lg border-2 border-red-300">
                <div className="flex items-center justify-center gap-2">
                  <AlertOctagon className="h-5 w-5 text-red-600" />
                  <span className="font-bold text-red-900">{stockSummary.outOfStock} items OUT OF STOCK</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}