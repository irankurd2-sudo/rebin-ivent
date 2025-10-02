import { useState } from 'react';
import { CreditCard as Edit2, Trash2, Plus, Search, Filter, Package, AlertTriangle } from 'lucide-react';
import { Product, Category } from '../types';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function ProductList({ products, categories, onEdit, onDelete, onAdd }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
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
  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return { status: 'out', color: 'text-red-600', bg: 'bg-red-50' };
    } else if (product.stock <= product.minStock) {
      return { status: 'low', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    } else {
      return { status: 'good', color: 'text-green-600', bg: 'bg-green-50' };
    }
  };

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
            📂 {selectedCategory} Category Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{categoryStats.totalProducts}</div>
              <div className="text-sm text-blue-700">Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${categoryStats.totalValue.toFixed(2)}</div>
              <div className="text-sm text-green-700">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${categoryStats.totalCost.toFixed(2)}</div>
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 text-sm text-gray-600">
          Debug: Available categories: {categories.length} | Categories: {categories.map(c => c.name).join(', ')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              selectedCategory ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-300'
            }`}
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
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="stock">Sort by Stock</option>
            <option value="price">Sort by Price</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <Filter className="h-4 w-4" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedProducts.map(product => {
          const stockStatus = getStockStatus(product);
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
                
                {/* Stock Status Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                  {product.stock === 0 ? 'Out of Stock' : 
                   product.stock <= product.minStock ? 'Low Stock' : 'In Stock'}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                  {product.stock <= product.minStock && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 ml-2" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                <p className="text-sm text-gray-600 mb-3">{product.category}</p>

                {/* Price and Stock Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium text-green-600">${product.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-medium">${product.cost.toFixed(2)}</span>
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
              </div>
            </div>
          );
        })}
      </div>

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