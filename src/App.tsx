import { useState } from 'react';
import { BarChart3, Package, Home, ShoppingCart, RotateCcw, TrendingUp, Settings as SettingsIcon, Bell, FileText, Users, Brain, Smartphone, Globe } from 'lucide-react';
import { Award } from 'lucide-react';
import { useInventory } from './hooks/useInventory';
import { Dashboard } from './components/Dashboard';
import { ProductList } from './components/ProductList';
import { ProductForm } from './components/ProductForm';
import { SalesForm } from './components/SalesForm';
import { Analytics } from './components/Analytics';
import { Returns } from './components/Returns';
import { NotificationCenter } from './components/NotificationCenter';
import { Settings } from './components/Settings';
import { Reports } from './components/Reports';
import { UserManagement } from './components/UserManagement';
import { BusinessIntelligence } from './components/BusinessIntelligence';
import { SellerReports } from './components/SellerReports';
import { MobileSync } from './components/MobileSync';
import { APIIntegration } from './components/APIIntegration';
import { Product } from './types';

type View = 'dashboard' | 'products' | 'sales' | 'analytics' | 'returns' | 'reports' | 'sellers' | 'users' | 'bi' | 'mobile' | 'api' | 'settings';

function App() {
  const {
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
    addSale,
    addReturn,
    addCustomer,
    addSeller,
    markNotificationRead,
    setSettings,
    updateReturn: updateReturnInHook,
    exportData,
    importData,
    resetSalesHistory,
    resetAllData,
  } = useInventory();

  // Mock data for new features
  const [users, setUsers] = useState([
    {
      id: '1',
      username: 'admin',
      email: 'admin@company.com',
      role: 'admin' as const,
      permissions: [],
      isActive: true,
      createdAt: new Date(),
    }
  ]);
  
  const [activityLogs, setActivityLogs] = useState([]);
  const [apiEndpoints, setApiEndpoints] = useState([]);
  
  const currentUser = users[0];
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleFormSubmit = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }
    setShowProductForm(false);
    setEditingProduct(undefined);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  const handleClearNotifications = () => {
    // Mark all notifications as read
    notifications.forEach(n => {
      if (!n.read) markNotificationRead(n.id);
    });
  };

  const updateReturn = (id: string, data: any) => {
    updateReturnInHook(id, data);
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'sales', name: 'Sales', icon: ShoppingCart },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'returns', name: 'Returns', icon: RotateCcw },
    { id: 'reports', name: 'Reports', icon: FileText },
    { id: 'sellers', name: 'Seller Reports', icon: Award },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'bi', name: 'Business Intelligence', icon: Brain },
    { id: 'mobile', name: 'Mobile Sync', icon: Smartphone },
    { id: 'api', name: 'API Integration', icon: Globe },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900">{settings.companyName}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {products.length} Products • {products.filter(p => p.stock <= p.minStock).length} Low Stock
              </div>
              <NotificationCenter
                notifications={notifications}
                onMarkRead={markNotificationRead}
                onClearAll={handleClearNotifications}
              />
              {currentView === 'products' && (
                <button
                  onClick={handleAddProduct}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Add Product
                </button>
              )}
              {currentView === 'sales' && (
                <button
                  onClick={() => setShowSalesForm(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                >
                  New Sale
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 space-y-2">
            {navigation.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            {currentView === 'dashboard' && (
              <Dashboard 
                products={products} 
                sales={sales} 
                returns={returns} 
                settings={settings}
                onQuickSale={() => setShowSalesForm(true)}
                onAddProduct={handleAddProduct}
              />
            )}
            {currentView === 'products' && (
              <ProductList
                products={products}
                categories={categories}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onAdd={handleAddProduct}
              />
            )}
            {currentView === 'sales' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Sales</h2>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sale ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Profit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Seller
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sales.map(sale => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{sale.id.slice(-6)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.productName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${sale.total.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                              ${sale.profit.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.customerName || 'Walk-in'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.sellerName || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.date.toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sales.length === 0 && (
                    <div className="text-center py-12">
                      <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No sales yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by making your first sale.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {currentView === 'analytics' && (
              <Analytics 
                products={products} 
                sales={sales} 
                returns={returns} 
                settings={settings} 
              />
            )}
            {currentView === 'returns' && (
              <Returns
                returns={returns}
                sales={sales}
                products={products}
                onAddReturn={addReturn}
                onUpdateReturn={updateReturn}
              />
            )}
            {currentView === 'settings' && (
              <Settings
                settings={settings}
                alertRules={alertRules}
                products={products}
                sales={sales}
                customers={customers}
                sellers={sellers}
                onUpdateSettings={setSettings}
                onUpdateAlertRules={() => {}}
                onExport={exportData}
                onImport={importData}
                onResetSalesHistory={resetSalesHistory}
                onResetAllData={resetAllData}
              />
            )}
            {currentView === 'reports' && (
              <Reports
                products={products}
                sales={sales}
                customers={customers}
                settings={settings}
              />
            )}
            {currentView === 'sellers' && (
              <SellerReports
                sellers={sellers}
                sales={sales}
                products={products}
                settings={settings}
              />
            )}
            {currentView === 'users' && (
              <UserManagement
                users={users}
                activityLogs={activityLogs}
                currentUser={currentUser}
                onAddUser={(user) => setUsers(prev => [...prev, { ...user, id: Date.now().toString(), createdAt: new Date() }])}
                onUpdateUser={(id, userData) => setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u))}
                onDeleteUser={(id) => setUsers(prev => prev.filter(u => u.id !== id))}
              />
            )}
            {currentView === 'bi' && (
              <BusinessIntelligence
                products={products}
                sales={sales}
                customers={customers}
                settings={settings}
              />
            )}
            {currentView === 'mobile' && (
              <MobileSync
                onSync={async () => {
                  // Mock sync implementation
                  await new Promise(resolve => setTimeout(resolve, 2000));
                }}
                onExportMobile={() => {
                  const mobileData = { products, sales, customers, settings };
                  const blob = new Blob([JSON.stringify(mobileData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `mobile-data-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                onImportMobile={(data) => {
                  // Handle mobile data import
                  console.log('Importing mobile data:', data);
                }}
              />
            )}
            {currentView === 'api' && (
              <APIIntegration
                endpoints={apiEndpoints}
                onAddEndpoint={(endpoint) => setApiEndpoints(prev => [...prev, { ...endpoint, id: Date.now().toString() }])}
                onUpdateEndpoint={(id, endpointData) => setApiEndpoints(prev => prev.map(e => e.id === id ? { ...e, ...endpointData } : e))}
                onDeleteEndpoint={(id) => setApiEndpoints(prev => prev.filter(e => e.id !== id))}
                onTestEndpoint={async (id) => {
                  // Mock API test
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  return Math.random() > 0.3; // 70% success rate
                }}
                onSyncEndpoint={async (id) => {
                  // Mock API sync
                  await new Promise(resolve => setTimeout(resolve, 2000));
                }}
              />
            )}
          </main>
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(undefined);
          }}
        />
      )}

      {/* Sales Form Modal */}
      {showSalesForm && (
        <SalesForm
          products={products}
          categories={categories}
          customers={customers}
          sellers={sellers}
          lastSeller={settings.lastSeller}
          onSubmit={addSale}
          onAddSeller={addSeller}
          onClose={() => setShowSalesForm(false)}
        />
      )}
    </div>
  );
}

export default App;