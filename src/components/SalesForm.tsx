import { useState } from 'react';
import { X, ShoppingCart, Search, Calculator } from 'lucide-react';
import { Product, Customer, Sale, Seller, Category } from '../types';

interface SalesFormProps {
  products: Product[];
  customers: Customer[];
  categories: Category[];
  sellers: Seller[];
  lastSeller?: string;
  onSubmit: (sale: Omit<Sale, 'id' | 'date'>) => void;
  onAddSeller: (seller: Omit<Seller, 'id' | 'createdAt' | 'totalSales' | 'totalRevenue' | 'totalProfit'>) => void;
  onClose: () => void;
}

export function SalesForm({ products, customers, categories, sellers, lastSeller, onSubmit, onAddSeller, onClose }: SalesFormProps) {
  const [formData, setFormData] = useState({
    productId: '',
    productSearch: '',
    selectedCategory: '',
    quantity: 1,
    discount: 0,
    customerId: '',
    customerName: '',
    sellerId: '',
    sellerName: lastSeller || '',
    saleDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  });

  const [showAddSeller, setShowAddSeller] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState('');
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState(0);
  const [isServiceSale, setIsServiceSale] = useState(false);
  const [serviceData, setServiceData] = useState({
    serviceName: '',
    servicePrice: 0,
    serviceCost: 0,
    serviceDescription: '',
  });

  // Filter products based on search
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(formData.productSearch.toLowerCase()) ||
                         product.sku.toLowerCase().includes(formData.productSearch.toLowerCase());
    const matchesCategory = formData.selectedCategory !== '' && product.category === formData.selectedCategory;
    return matchesSearch && matchesCategory && product.stock > 0;
  });

  const selectedProduct = products.find(p => p.id === formData.productId);
  const unitPrice = isServiceSale ? serviceData.servicePrice : 
                   useCustomPrice ? customPrice : (selectedProduct?.price || 0);
  const subtotal = unitPrice * formData.quantity;
  const discountAmount = (subtotal * formData.discount) / 100;
  const total = subtotal - discountAmount;
  const profit = isServiceSale ? 
                 (serviceData.servicePrice - serviceData.serviceCost) * formData.quantity - discountAmount :
                 selectedProduct ? (selectedProduct.price - selectedProduct.cost) * formData.quantity - discountAmount : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isServiceSale && !selectedProduct) return;
    if (isServiceSale && !serviceData.serviceName.trim()) return;

    const saleData: Omit<Sale, 'id' | 'date'> = isServiceSale ? {
      productId: 'service-' + Date.now(),
      productName: serviceData.serviceName,
      quantity: formData.quantity,
      unitPrice: serviceData.servicePrice,
      discount: discountAmount,
      tax: 0,
      total,
      profit,
      paymentMethod: 'cash',
      status: 'completed',
      sellerId: formData.sellerId || undefined,
      sellerName: formData.sellerName,
      customerId: formData.customerId || undefined,
      customerName: formData.customerName || undefined,
    } : {
      productId: formData.productId,
      productName: selectedProduct!.name,
      quantity: formData.quantity,
      unitPrice,
      discount: discountAmount,
      tax: 0,
      total,
      profit,
      paymentMethod: 'cash',
      status: 'completed',
      sellerId: formData.sellerId || undefined,
      sellerName: formData.sellerName,
      customerId: formData.customerId || undefined,
      customerName: formData.customerName || undefined,
    };

    onSubmit(saleData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const defaultPrice = product?.price || 0;
    setFormData(prev => ({
      ...prev,
      productId,
      productSearch: product?.name || '',
    }));
    // Reset custom price when selecting new product
    setUseCustomPrice(false);
    setCustomPrice(defaultPrice);
  };

  const handleCalculatorInput = (value: string) => {
    if (value === 'C') {
      setCalculatorValue('');
    } else if (value === '=') {
      try {
        const result = eval(calculatorValue);
        setFormData(prev => ({ ...prev, quantity: Math.max(1, Math.floor(result)) }));
        setCalculatorValue('');
        setShowCalculator(false);
      } catch {
        setCalculatorValue('Error');
      }
    } else {
      setCalculatorValue(prev => prev + value);
    }
  };

  const handleAddSeller = () => {
    if (newSellerName.trim()) {
      onAddSeller({
        name: newSellerName.trim(),
        isActive: true,
      });
      setFormData(prev => ({ ...prev, sellerName: newSellerName.trim() }));
      setNewSellerName('');
      setShowAddSeller(false);
    }
  };

  const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sellerId = e.target.value;
    const seller = sellers.find(s => s.id === sellerId);
    setFormData(prev => ({
      ...prev,
      sellerId,
      sellerName: seller?.name || '',
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Quick Sale</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sale Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Sale Type *
            </label>
            <div className="flex space-x-6">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="product-sale"
                  name="saleType"
                  checked={!isServiceSale}
                  onChange={() => setIsServiceSale(false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="product-sale" className="ml-2 text-sm font-medium text-gray-700">
                  📦 Product Sale
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="service-sale"
                  name="saleType"
                  checked={isServiceSale}
                  onChange={() => setIsServiceSale(true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="service-sale" className="ml-2 text-sm font-medium text-gray-700">
                  🔧 Service Sale
                </label>
              </div>
            </div>
          </div>

          {/* Service Sale Form */}
          {isServiceSale && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-blue-900">Service Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={serviceData.serviceName}
                  onChange={(e) => setServiceData(prev => ({ ...prev, serviceName: e.target.value }))}
                  required
                  placeholder="e.g., Phone Repair, Consultation, Installation"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Price ($) *
                  </label>
                  <input
                    type="number"
                    value={serviceData.servicePrice}
                    onChange={(e) => setServiceData(prev => ({ ...prev, servicePrice: parseFloat(e.target.value) || 0 }))}
                    required
                    min="0"
                    step="0.01"
                    placeholder="50.00"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Cost ($)
                  </label>
                  <input
                    type="number"
                    value={serviceData.serviceCost}
                    onChange={(e) => setServiceData(prev => ({ ...prev, serviceCost: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                    placeholder="0.00 (materials, etc.)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Product Search */}
          {!isServiceSale && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Search Product *
              </label>
              
              {/* Category Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    name="productSearch"
                    value={formData.productSearch}
                    onChange={handleChange}
                    placeholder="Search by name or SKU..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  name="selectedCategory"
                  value={formData.selectedCategory}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            
            {/* Product Results */}
            {formData.productSearch && !formData.productId && (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                {formData.selectedCategory === '' ? (
                  <div className="p-3 text-orange-600 text-center bg-orange-50">
                    Please select a category first
                  </div>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.slice(0, 10).map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductSelect(product.id)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600">
                            SKU: {product.sku} • {product.category}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">${product.price.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">Stock: {product.stock}</div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 text-center">No products found in this category</div>
                )}
              </div>
            )}
            
            {/* Selected Product Display */}
            {selectedProduct && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {selectedProduct.image && (
                      <img src={selectedProduct.image} alt={selectedProduct.name} className="w-12 h-12 rounded-md object-cover" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{selectedProduct.name}</div>
                      <div className="text-sm text-gray-600">
                        SKU: {selectedProduct.sku} • Category: {selectedProduct.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">${selectedProduct.price.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Available: {selectedProduct.stock}</div>
                    <div className="text-xs text-gray-500">Default Price</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, productId: '', productSearch: '', selectedCategory: '' }))}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Change Product
                </button>
              </div>
            )}
          </div>
          )}

          {/* Custom Price Option */}
          {!isServiceSale && selectedProduct && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="useCustomPrice"
                  checked={useCustomPrice}
                  onChange={(e) => {
                    setUseCustomPrice(e.target.checked);
                    if (!e.target.checked) {
                      setCustomPrice(selectedProduct.price);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useCustomPrice" className="text-sm font-medium text-gray-700">
                  Use custom selling price
                </label>
              </div>
              
              {useCustomPrice && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Selling Price *
                  </label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter custom price"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Default price: ${selectedProduct.price.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quantity with Calculator */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  max={isServiceSale ? 999 : (selectedProduct?.stock || 1)}
                  required
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Calculator className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Calculator */}
          {showCalculator && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center mb-2">
                <input
                  type="text"
                  value={calculatorValue}
                  readOnly
                  className="w-full text-center text-lg font-mono bg-white border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['7', '8', '9', '/'].map(btn => (
                  <button key={btn} type="button" onClick={() => handleCalculatorInput(btn)} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100">{btn}</button>
                ))}
                {['4', '5', '6', '*'].map(btn => (
                  <button key={btn} type="button" onClick={() => handleCalculatorInput(btn)} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100">{btn}</button>
                ))}
                {['1', '2', '3', '-'].map(btn => (
                  <button key={btn} type="button" onClick={() => handleCalculatorInput(btn)} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100">{btn}</button>
                ))}
                {['0', '.', 'C', '+'].map(btn => (
                  <button key={btn} type="button" onClick={() => handleCalculatorInput(btn)} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100">{btn}</button>
                ))}
                <button type="button" onClick={() => handleCalculatorInput('=')} className="col-span-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600">=</button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={(e) => {
                const customer = customers.find(c => c.id === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  customerId: e.target.value,
                  customerName: customer?.name || '',
                }));
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Walk-in customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.email}
                </option>
              ))}
            </select>
          </div>

          {formData.customerId === '' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Sale Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sale Date *
            </label>
            <input
              type="date"
              name="saleDate"
              value={formData.saleDate}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seller Name *
            </label>
            {sellers.length > 0 ? (
              <div className="flex space-x-2">
                <select
                  value={formData.sellerId}
                  onChange={handleSellerChange}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select seller</option>
                  {sellers.filter(s => s.isActive).map(seller => (
                    <option key={seller.id} value={seller.id}>
                      {seller.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddSeller(true)}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  +
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleChange}
                  required
                  placeholder="Enter seller name"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAddSeller(true)}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
              </div>
            )}
            
            {showAddSeller && (
              <div className="flex space-x-2 mt-2">
                <input
                  type="text"
                  value={newSellerName}
                  onChange={(e) => setNewSellerName(e.target.value)}
                  placeholder="New seller name"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddSeller}
                  className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSeller(false);
                    setNewSellerName('');
                  }}
                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Sale Summary */}
          {(selectedProduct || isServiceSale) && (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 space-y-3">
              <h4 className="font-medium text-green-900">
                {isServiceSale ? 'Service Sale Summary' : 'Product Sale Summary'}
              </h4>
              {isServiceSale && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Service:</span>
                  <span className="font-medium">{serviceData.serviceName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-700">Unit Price:</span>
                <span className="font-medium">
                  ${unitPrice.toFixed(2)}
                  {!isServiceSale && useCustomPrice && (
                    <span className="text-xs text-orange-600 ml-1">(Custom)</span>
                  )}
                  {isServiceSale && (
                    <span className="text-xs text-blue-600 ml-1">(Service)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Discount ({formData.discount}%):</span>
                  <span className="font-medium text-red-600">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-green-300 pt-3">
                <span className="font-medium text-green-900">Total:</span>
                <span className="font-bold text-2xl text-green-900">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Profit:</span>
                <span className="font-medium text-green-700">${profit.toFixed(2)}</span>
              </div>
              {isServiceSale && serviceData.serviceDescription && (
                <div className="pt-2 border-t border-green-300">
                  <span className="text-gray-700 text-sm">Description:</span>
                  <p className="text-sm text-gray-600 mt-1">{serviceData.serviceDescription}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={(!isServiceSale && (!selectedProduct || formData.quantity > (selectedProduct?.stock || 0))) || (isServiceSale && !serviceData.serviceName.trim())}
              className="flex-1 bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-lg"
            >
              {isServiceSale ? 'Complete Service Sale' : 'Complete Sale'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}