import { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Product, Category } from '../types';

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

export function ProductForm({ product, categories, onSubmit, onClose }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || categories[0]?.name || '',
    price: product?.price || 0,
    cost: product?.cost || 0,
    stock: product?.stock || 0,
    minStock: product?.minStock || 10,
    description: product?.description || '',
    image: product?.image || '',
  });

  const [pricingMode, setPricingMode] = useState<'price' | 'profit'>('price');
  const [profitAmount, setProfitAmount] = useState(0);
  const [profitPercentage, setProfitPercentage] = useState(0);
  const [imagePreview, setImagePreview] = useState(product?.image || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleProfitAmountChange = (amount: number) => {
    setProfitAmount(amount);
    const newPrice = formData.cost + amount;
    setFormData(prev => ({ ...prev, price: newPrice }));
    if (formData.cost > 0) {
      setProfitPercentage((amount / formData.cost) * 100);
    }
  };

  const handleProfitPercentageChange = (percentage: number) => {
    setProfitPercentage(percentage);
    const amount = (formData.cost * percentage) / 100;
    setProfitAmount(amount);
    const newPrice = formData.cost + amount;
    setFormData(prev => ({ ...prev, price: newPrice }));
  };

  const handleCostChange = (cost: number) => {
    setFormData(prev => ({ ...prev, cost }));
    if (pricingMode === 'profit') {
      // Recalculate price based on current profit settings
      if (profitAmount > 0) {
        setFormData(prev => ({ ...prev, price: cost + profitAmount }));
      } else if (profitPercentage > 0) {
        const amount = (cost * profitPercentage) / 100;
        setProfitAmount(amount);
        setFormData(prev => ({ ...prev, price: cost + amount }));
      }
    }
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImagePreview(url);
    setFormData(prev => ({ ...prev, image: url }));
  };

  const currentProfit = formData.price - formData.cost;
  const currentProfitPercentage = formData.cost > 0 ? (currentProfit / formData.cost) * 100 : 0;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </label>
                <input
                  type="url"
                  placeholder="Or enter image URL"
                  value={formData.image}
                  onChange={handleImageUrlChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            {categories.length > 0 ? (
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Enter category name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price ($) *
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price ($) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock Level *
              </label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                min="0"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Profit Margin Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Profit Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-600">Cost Price</p>
                <p className="text-lg font-bold text-gray-900">${formData.cost.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Selling Price</p>
                <p className="text-lg font-bold text-blue-600">${formData.price.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Profit</p>
                <p className={`text-lg font-bold ${currentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${currentProfit.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {formData.price > 0 && formData.cost > 0 && (
            <div className={`p-4 rounded-lg ${
              formData.price >= formData.cost ? 'bg-blue-50' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Profit Margin:</span>
                <span className={`text-lg font-bold ${
                  formData.price >= formData.cost ? 'text-blue-600' : 'text-red-600'
                }`}>
                  ${currentProfit.toFixed(2)} ({currentProfitPercentage.toFixed(1)}%)
                </span>
              </div>
              {formData.price < formData.cost && (
                <div className="mt-2 text-sm text-red-700">
                  ⚠️ Warning: Selling price is lower than cost price. This will result in a loss!
                </div>
              )}
              {formData.price >= formData.cost && currentProfitPercentage > 0 && (
                <div className="mt-2 text-sm text-green-700">
                  ✅ Good profit margin! You'll earn ${currentProfit.toFixed(2)} per item.
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              {product ? 'Update Product' : 'Add Product'}
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