import { useState, useEffect, useRef } from 'react';
import { CreditCard as Edit2, Trash2, Plus, Search, Filter, Package, AlertTriangle, AlertOctagon, Bell, BellOff, ChevronDown } from 'lucide-react';
import { Product, Category, StockWarningLevel } from '../types';
import { SearchWithSuggestions } from './SearchWithSuggestions';
import { getStockStatus as getEnhancedStockStatus } from '../utils/stockAlerts';
import { MobileProductCard } from './MobileProductCard';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onToggleWarnings?: (productId: string, level: StockWarningLevel) => void;
  isAuthenticated?: boolean;
}

export function ProductList({ products, categories, onEdit, onDelete, onAdd, onToggleWarnings, isAuthenticated = false }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isMobile, setIsMobile] = useState(false);
  const [openWarningMenu, setOpenWarningMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenWarningMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug: Log categories when component renders
  console.log('ProductList - Categories received:', categories.length, categories);

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    // Match by category name
    const matchesCategory = selectedCategory === '' ||
                           product.category?.trim() === selectedCategory.trim();

    return matchesSearch && matchesCategory;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'stock':
        aValue = a.stock;
        bValue = b.stock;
        break;
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Calculate category statistics
  const categoryStats = {
    totalProducts: filteredProducts.length,
    totalValue: filteredProducts.reduce((sum, p) => sum + (p.price * p.stock), 0),
    totalCost: filteredProducts.reduce((sum, p) => sum + (p.cost * p.stock), 0),
    lowStock: filteredProducts.filter(p => p.stock <= p.minStock && p.stock > 0).length,
    outOfStock: filteredProducts.filter(p => p.stock === 0).length,
  };
  // This is replaced by the enhanced stock status utility

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <button
          onClick={onAdd}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Category Summary */}
      {selectedCategory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            📂 {categories.find(c => c.id === selectedCategory)?.name || selectedCategory} Category Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{categoryStats.totalProducts}</div>
              <div className="text-sm text-blue-700">Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">IQD {categoryStats.totalValue.toFixed(0)}</div>
              <div className="text-sm text-green-700">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">IQD {categoryStats.totalCost.toFixed(0)}</div>
              <div className="text-sm text-orange-700">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{categoryStats.lowStock}</div>
              <div className="text-sm text-yellow-700">Low Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{categoryStats.outOfStock}</div>
              <div className="text-sm text-red-700">Out of Stock</div>
            </div>
          </div>
        </div>
      )}
      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-xl border border-slate-200/50 p-3 md:p-6 overflow-visible">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 overflow-visible">
          <div className="overflow-visible">
            <SearchWithSuggestions
              products={products}
              value={searchTerm}
              onChange={setSearchTerm}
              onSelectProduct={(product) => {
                setSearchTerm('');
                onEdit(product);
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`w-full border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white hover:border-slate-300 transition-all duration-200 font-medium cursor-pointer ${
              selectedCategory ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700' : 'border-slate-200 text-slate-700'
            }`}
            style={{ direction: 'ltr' }}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'stock' | 'price')}
            className="border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white hover:border-slate-300 transition-all duration-200 font-medium text-slate-700 cursor-pointer"
            style={{ direction: 'ltr' }}
          >
            <option value="name">Sort by Name</option>
            <option value="stock">Sort by Stock</option>
            <option value="price">Sort by Price</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white hover:border-slate-300 transition-all duration-200 font-medium text-slate-700 cursor-pointer"
            style={{ direction: 'ltr' }}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setSortBy('name');
              setSortOrder('asc');
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all duration-200 font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <Filter className="h-5 w-5" />
            Clear Filters
          </button>
        </div>
        
        {/* Active Filters Display */}
        {(searchTerm || selectedCategory) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="text-sm font-medium text-gray-700 mr-2">Active Filters:</div>
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                📂 Category: {selectedCategory}
                <button
                  onClick={() => setSelectedCategory('')}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            <span className="text-sm text-gray-600">
              📊 Showing {filteredProducts.length} of {products.length} products
              {selectedCategory && (
                <span className="ml-2 text-green-600 font-medium">
                  (filtered by {selectedCategory})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {isMobile ? (
        <div className="space-y-3">
          {sortedProducts.map(product => (
            <MobileProductCard
              key={product.id}
              product={product}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleWarnings={onToggleWarnings}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map(product => {
          const stockStatus = getEnhancedStockStatus(product);
          const profitMargin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0;

          return (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="h-48 bg-gray-200 relative">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}

                {/* Enhanced Stock Status Badge - Only show warnings if enabled */}
                {stockStatus.needsAttention && (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {stockStatus.level === 'out' && <AlertOctagon className="h-4 w-4 text-red-600" />}
                    {stockStatus.level === 'low' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${stockStatus.bgColor} ${stockStatus.textColor} border ${stockStatus.borderColor}`}>
                      {stockStatus.label}
                    </span>
                  </div>
                )}

                {/* Stock Warning Menu */}
                {onToggleWarnings && isAuthenticated && (
                  <div className="absolute top-2 left-2" ref={openWarningMenu === product.id ? menuRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenWarningMenu(openWarningMenu === product.id ? null : product.id);
                      }}
                      className={`p-2 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 ${
                        product.stockWarningLevel === 'all'
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : product.stockWarningLevel === 'out_only'
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                      title={
                        product.stockWarningLevel === 'all'
                          ? 'All warnings enabled'
                          : product.stockWarningLevel === 'out_only'
                          ? 'Out of stock only'
                          : 'Warnings disabled'
                      }
                    >
                      {product.stockWarningLevel === 'disabled' ? (
                        <BellOff className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </button>
                    {openWarningMenu === product.id && (
                      <div className="absolute top-12 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[200px] z-50">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWarnings(product.id, 'all');
                            setOpenWarningMenu(null);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                            product.stockWarningLevel === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <Bell className="h-4 w-4" />
                          <span className="font-medium">All Warnings</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWarnings(product.id, 'out_only');
                            setOpenWarningMenu(null);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-yellow-50 transition-colors flex items-center gap-2 ${
                            product.stockWarningLevel === 'out_only' ? 'bg-yellow-50 text-yellow-700' : 'text-gray-700'
                          }`}
                        >
                          <AlertOctagon className="h-4 w-4" />
                          <span className="font-medium">Out of Stock Only</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWarnings(product.id, 'disabled');
                            setOpenWarningMenu(null);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                            product.stockWarningLevel === 'disabled' ? 'bg-gray-50 text-gray-700' : 'text-gray-700'
                          }`}
                        >
                          <BellOff className="h-4 w-4" />
                          <span className="font-medium">Disabled</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                  {stockStatus.needsAttention && (
                    <div className="flex-shrink-0 ml-2">
                      {stockStatus.level === 'out' && <AlertOctagon className="h-5 w-5 text-red-600" />}
                      {stockStatus.level === 'low' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                <p className="text-sm text-gray-600 mb-2">{product.category}</p>

                {/* Color Variants */}
                {product.colorVariants && product.colorVariants.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Colors:</p>
                    <div className="flex flex-wrap gap-1">
                      {product.colorVariants.map((variant) => (
                        <div
                          key={variant.color}
                          className="relative group"
                          title={`${variant.color}: ${variant.stock} units`}
                        >
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: variant.colorCode }}
                          />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {variant.color}: {variant.stock}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price and Stock Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium text-green-600">IQD {product.price.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-medium">IQD {product.cost.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className={`font-medium ${stockStatus.color}`}>
                      {product.stock} units
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Profit Margin:</span>
                    <span className={`font-medium ${profitMargin >= 20 ? 'text-green-600' : profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {isAuthenticated ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="flex-1 bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 text-gray-600 px-3 py-2 rounded-md text-sm text-center">
                    Sign in to edit or delete
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Empty State */}
      {sortedProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || selectedCategory ? 'No products found' : 'No products yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first product.'
            }
          </p>
          {!searchTerm && !selectedCategory && (
            <div className="mt-6">
              <button
                onClick={onAdd}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                Add Your First Product
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {products.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {selectedCategory ? `${selectedCategory} Category` : 'Total Inventory'} Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{categoryStats.totalProducts}</div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${categoryStats.totalValue.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {categoryStats.lowStock}
              </div>
              <div className="text-sm text-gray-600">Low Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {categoryStats.outOfStock}
              </div>
              <div className="text-sm text-gray-600">Out of Stock</div>
            </div>
          </div>
          {selectedCategory && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ${categoryStats.totalCost.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Total Cost Investment</div>
                <div className="text-xs text-gray-500 mt-1">
                  Profit Potential: ${(categoryStats.totalValue - categoryStats.totalCost).toFixed(0)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}