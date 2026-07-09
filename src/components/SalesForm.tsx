import { useState } from 'react';
import { X, ShoppingCart, Search, Calculator, Trash2, Plus } from 'lucide-react';
import { Product, Customer, Sale, Seller, Category, Settings } from '../types';
import { format } from 'date-fns';

interface CartItem {
  productId: string;
  productName: string;
  productCategory: string;
  productColor?: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
  isService: boolean;
  serviceDescription?: string;
}

interface SalesFormProps {
  products: Product[];
  customers: Customer[];
  categories: Category[];
  sellers: Seller[];
  settings: Settings;
  lastSeller?: string;
  onSubmit: (sale: Omit<Sale, 'id' | 'date'> & { saleDate?: string }) => void;
  onAddSeller: (seller: Omit<Seller, 'id' | 'createdAt' | 'totalSales' | 'totalRevenue' | 'totalProfit'>) => void;
  onClose: () => void;
}

export function SalesForm({ products, customers, categories, sellers, settings, lastSeller, onSubmit, onAddSeller, onClose }: SalesFormProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({
    productId: '',
    productSearch: '',
    selectedCategory: '',
    selectedColor: '',
    quantity: 1,
    discount: 0,
    customerId: '',
    customerName: '',
    sellerId: '',
    sellerName: lastSeller || '',
    saleDate: new Date().toISOString().split('T')[0],
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
    const matchesCategory = formData.selectedCategory === '' || product.category === formData.selectedCategory;
    return matchesSearch && matchesCategory && product.stock > 0;
  });

  const selectedProduct = products.find(p => p.id === formData.productId);
  const unitPrice = isServiceSale ? serviceData.servicePrice :
                   useCustomPrice ? customPrice : (selectedProduct?.price || 0);
  const costPrice = isServiceSale ? serviceData.serviceCost : (selectedProduct?.cost || 0);
  const discountPerUnit = formData.discount / formData.quantity;
  const effectiveCost = costPrice - discountPerUnit;
  const effectiveSellingPrice = unitPrice - discountPerUnit;
  const subtotal = unitPrice * formData.quantity;
  const discountAmount = formData.discount;
  const total = subtotal - discountAmount;
  const profit = isServiceSale ?
                 (serviceData.servicePrice - serviceData.serviceCost) * formData.quantity :
                 selectedProduct ? (unitPrice - selectedProduct.cost) * formData.quantity : 0;

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isServiceSale && !selectedProduct) return;
    if (isServiceSale && !serviceData.serviceName.trim()) return;

    if (selectedProduct?.colorVariants && selectedProduct.colorVariants.length > 0 && !formData.selectedColor) {
      alert('Please select a color variant');
      return;
    }

    if (formData.selectedColor && selectedProduct?.colorVariants) {
      const colorVariant = selectedProduct.colorVariants.find(v => v.color === formData.selectedColor);
      if (colorVariant && colorVariant.stock < formData.quantity) {
        alert(`Not enough stock for ${formData.selectedColor}. Only ${colorVariant.stock} available.`);
        return;
      }
    }

    const cartItem: CartItem = isServiceSale ? {
      productId: 'service-' + Date.now(),
      productName: serviceData.serviceName,
      productCategory: 'Service',
      quantity: formData.quantity,
      unitPrice: serviceData.servicePrice,
      unitCost: serviceData.serviceCost,
      discount: discountAmount,
      isService: true,
      serviceDescription: serviceData.serviceDescription,
    } : {
      productId: formData.productId,
      productName: selectedProduct!.name,
      productCategory: selectedProduct!.category,
      productColor: formData.selectedColor || undefined,
      quantity: formData.quantity,
      unitPrice,
      unitCost: costPrice,
      discount: discountAmount,
      isService: false,
    };

    setCart(prev => [...prev, cartItem]);

    setFormData(prev => ({
      ...prev,
      productId: '',
      productSearch: '',
      selectedColor: '',
      quantity: 1,
      discount: 0,
    }));
    setIsServiceSale(false);
    setServiceData({
      serviceName: '',
      servicePrice: 0,
      serviceCost: 0,
      serviceDescription: '',
    });
    setUseCustomPrice(false);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      alert('Please add at least one item to the cart');
      return;
    }

    if (!formData.sellerName.trim()) {
      alert('Please select or enter a seller name');
      return;
    }

    const transactionId = crypto.randomUUID();

    try {
      for (const item of cart) {
        const itemTotal = item.unitPrice * item.quantity - item.discount;
        const itemProfit = (item.unitPrice - item.unitCost) * item.quantity;

        const saleData: Omit<Sale, 'id' | 'date'> & { saleDate?: string; transactionId?: string } = {
          productId: item.productId,
          productName: item.productName,
          productCategory: item.productCategory,
          productColor: item.productColor,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
          discount: item.discount,
          tax: 0,
          total: itemTotal,
          profit: itemProfit,
          paymentMethod: 'cash',
          status: 'completed',
          sellerId: formData.sellerId || undefined,
          sellerName: formData.sellerName,
          customerId: formData.customerId || undefined,
          customerName: formData.customerName || undefined,
          saleDate: formData.saleDate,
          transactionId,
        };

        await onSubmit(saleData);
      }

      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to complete sale');
    }
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

  const safeCalculate = (expression: string): number | null => {
    try {
      const sanitized = expression.replace(/[^0-9+\-*/().]/g, '');
      if (!sanitized) return null;

      const result = Function('"use strict"; return (' + sanitized + ')')();

      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return result;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleCalculatorInput = (value: string) => {
    if (value === 'C') {
      setCalculatorValue('');
    } else if (value === '=') {
      const result = safeCalculate(calculatorValue);
      if (result !== null) {
        setFormData(prev => ({ ...prev, quantity: Math.max(1, Math.floor(result)) }));
        setCalculatorValue('');
        setShowCalculator(false);
      } else {
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

        <form onSubmit={handleAddToCart} className="p-6 space-y-6">
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
                    Service Cost ($) - Materials, Labor, etc.
                  </label>
                  <input
                    type="number"
                    value={serviceData.serviceCost}
                    onChange={(e) => setServiceData(prev => ({ ...prev, serviceCost: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">Enter cost for profit tracking</p>
                </div>
              </div>
            </div>
          )}

          {/* Product Selection */}
          {!isServiceSale && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Product *
              </label>

              {/* Category Filter and Product Dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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

                <select
                  name="productId"
                  value={formData.productId}
                  onChange={(e) => {
                    handleProductSelect(e.target.value);
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a product...</option>
                  {filteredProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price.toFixed(2)} (Stock: {product.stock})
                    </option>
                  ))}
                </select>
              </div>
            
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
                    <div className="text-sm text-gray-500">Cost: ${selectedProduct.cost.toFixed(2)}</div>
                    <div className="text-lg font-bold text-green-600">${selectedProduct.price.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Available: {selectedProduct.stock}</div>
                  </div>
                </div>

                {/* Color Variant Selection */}
                {selectedProduct.colorVariants && selectedProduct.colorVariants.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-300">
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Select Color * (Required)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedProduct.colorVariants.map((variant) => (
                        <button
                          key={variant.color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, selectedColor: variant.color }))}
                          disabled={variant.stock === 0}
                          className={`relative p-3 rounded-lg border-2 transition-all ${
                            formData.selectedColor === variant.color
                              ? 'border-blue-600 bg-blue-100'
                              : variant.stock > 0
                              ? 'border-gray-300 hover:border-blue-400 bg-white'
                              : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-gray-400 shadow-sm flex-shrink-0"
                              style={{ backgroundColor: variant.colorCode }}
                            />
                            <div className="text-left flex-1">
                              <div className="font-medium text-sm text-gray-900">{variant.color}</div>
                              <div className={`text-xs ${variant.stock === 0 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                {variant.stock === 0 ? 'Out of Stock' : `${variant.stock} available`}
                              </div>
                            </div>
                          </div>
                          {formData.selectedColor === variant.color && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {formData.selectedColor && (
                      <div className="mt-2 text-sm text-green-700 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Selected: {formData.selectedColor}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, productId: '', productSearch: '', selectedCategory: '', selectedColor: '' }))}
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
                Discount ($) - Reduces Cost & Price Equally
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                min="0"
                max={subtotal}
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Profit stays ${profit.toFixed(2)}
              </p>
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
            {formData.saleDate && (
              <p className="text-xs text-gray-500 mt-1">
                Will display as: {format(new Date(formData.saleDate + 'T00:00:00'), settings.dateFormat)}
              </p>
            )}
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
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Original Cost per unit:</span>
                <span className="text-gray-600">${costPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Original Price per unit:</span>
                <span className="text-gray-600">${unitPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Original Profit per unit:</span>
                <span className="text-green-600 font-medium">${(unitPrice - costPrice).toFixed(2)}</span>
              </div>
              {formData.discount > 0 && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-600">Discount per unit:</span>
                    <span className="text-orange-600 font-medium">-${discountPerUnit.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Final Cost per unit:</span>
                    <span className="font-medium text-blue-600">${effectiveCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Final Price per unit:</span>
                    <span className="font-medium text-blue-600">
                      ${effectiveSellingPrice.toFixed(2)}
                      {!isServiceSale && useCustomPrice && (
                        <span className="text-xs text-orange-600 ml-1">(Custom)</span>
                      )}
                      {isServiceSale && (
                        <span className="text-xs text-blue-600 ml-1">(Service)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Profit per unit:</span>
                    <span className="font-medium text-green-600">${(effectiveSellingPrice - effectiveCost).toFixed(2)}</span>
                  </div>
                </>
              )}
              {formData.discount === 0 && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Quantity:</span>
                    <span className="font-medium">{formData.quantity}</span>
                  </div>
                </>
              )}
              {formData.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Quantity:</span>
                  <span className="font-medium">{formData.quantity}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-green-300 pt-3">
                <span className="font-medium text-green-900">Customer Pays:</span>
                <span className="font-bold text-2xl text-green-900">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Total Profit:</span>
                <span className="font-bold text-xl text-green-700">${profit.toFixed(2)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                  <p className="text-xs text-green-800">
                    Discount reduces both cost and price by ${discountPerUnit.toFixed(2)}/unit. Profit margin stays ${(unitPrice - costPrice).toFixed(2)}/unit
                  </p>
                </div>
              )}
              {isServiceSale && serviceData.serviceDescription && (
                <div className="pt-2 border-t border-green-300">
                  <span className="text-gray-700 text-sm">Description:</span>
                  <p className="text-sm text-gray-600 mt-1">{serviceData.serviceDescription}</p>
                </div>
              )}
            </div>
          )}

          {/* Cart Display */}
          {cart.length > 0 && (
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-purple-900 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-white rounded-lg p-3 border border-purple-300">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Total Revenue</div>
                    <div className="text-lg font-bold text-blue-600">
                      ${cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity - item.discount), 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center border-l border-r border-purple-200">
                    <div className="text-xs text-gray-600 mb-1">Total Cost</div>
                    <div className="text-lg font-bold text-red-600">
                      ${cart.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Total Profit</div>
                    <div className="text-lg font-bold text-green-600">
                      ${cart.reduce((sum, item) => sum + ((item.unitPrice - item.unitCost) * item.quantity), 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {cart.map((item, index) => {
                  const itemRevenue = item.unitPrice * item.quantity - item.discount;
                  const itemCost = item.unitCost * item.quantity;
                  const itemProfit = (item.unitPrice - item.unitCost) * item.quantity;

                  return (
                    <div key={index} className="bg-white p-3 rounded-lg border border-purple-200 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.productName}</div>
                        <div className="text-sm text-gray-600">
                          {item.productCategory}
                          {item.productColor && ` • ${item.productColor}`}
                          {` • Qty: ${item.quantity}`}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Price: ${item.unitPrice.toFixed(2)} each • Cost: ${item.unitCost.toFixed(2)} each
                          {item.discount > 0 && ` • Discount: $${item.discount.toFixed(2)}`}
                        </div>
                        <div className="flex gap-3 mt-1 text-sm">
                          <span className="text-blue-600 font-medium">Revenue: ${itemRevenue.toFixed(2)}</span>
                          <span className="text-red-600">Cost: ${itemCost.toFixed(2)}</span>
                          <span className="text-green-600 font-medium">Profit: ${itemProfit.toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(index)}
                        className="ml-3 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={(!isServiceSale && (!selectedProduct || formData.quantity > (selectedProduct?.stock || 0))) || (isServiceSale && !serviceData.serviceName.trim())}
              className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-lg flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add to Cart
            </button>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleCompleteSale}
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 transition-colors font-medium text-lg"
              >
                Complete Sale • Profit: ${cart.reduce((sum, item) => sum + ((item.unitPrice - item.unitCost) * item.quantity), 0).toFixed(2)}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}