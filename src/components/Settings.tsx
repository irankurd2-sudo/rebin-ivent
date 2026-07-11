import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Download, Upload, Save, Lock, Key, Plus, Tag, X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Settings as SettingsType, AlertRule, Product, Sale, Customer, Seller, Category } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ConfirmModal } from './ConfirmModal';

interface SettingsProps {
  settings: SettingsType;
  alertRules: AlertRule[];
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  sellers: Seller[];
  onUpdateSettings: (settings: SettingsType) => void;
  onUpdateAlertRules: (rules: AlertRule[]) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onResetSalesHistory: (restoreInventory?: boolean) => void;
  onResetAllData: () => void;
  isAuthenticated?: boolean;
}

export function Settings({ settings, alertRules, products, sales, customers, sellers, onUpdateSettings, onUpdateAlertRules, onExport, onImport, onResetSalesHistory, onResetAllData, isAuthenticated = false }: SettingsProps) {
  const [formData, setFormData] = useState(settings);
  const [rules, setRules] = useState(alertRules);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categorySuccess, setCategorySuccess] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteCategoryError, setDeleteCategoryError] = useState('');
  const [showResetSalesModal, setShowResetSalesModal] = useState(false);
  const [showRestoreInventoryModal, setShowRestoreInventoryModal] = useState(false);
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [showResetAllConfirmModal, setShowResetAllConfirmModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  useEffect(() => {
    const loadCurrentPin = async () => {
      try {
        const { data } = await supabase
          .from('pin_settings')
          .select('pin')
          .maybeSingle();
        if (data) {
          setCurrentPin(data.pin);
        }
      } catch (err) {
        console.error('Error loading PIN:', err);
      }
    };
    loadCurrentPin();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleAddCategory = async () => {
    setCategoryError('');
    setCategorySuccess(false);

    if (!newCategoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim()
        });

      if (error) throw error;

      setCategorySuccess(true);
      setNewCategoryName('');
      setNewCategoryDescription('');
      await loadCategories();

      setTimeout(() => setCategorySuccess(false), 3000);
    } catch (err: any) {
      if (err.message?.includes('duplicate') || err.code === '23505') {
        setCategoryError('A category with this name already exists');
      } else {
        setCategoryError('Failed to add category. Please try again.');
      }
      console.error('Error adding category:', err);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setDeleteCategoryError('');
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      await loadCategories();
      setCategoryToDelete(null);
    } catch (err: any) {
      setDeleteCategoryError(err.message || 'Failed to delete category. It may be in use by products.');
      console.error('Error deleting category:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    onUpdateAlertRules(rules);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleRuleChange = (id: string, field: string, value: any) => {
    setRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  const handleResetSales = () => {
    setShowResetSalesModal(true);
  };

  const handleResetSalesConfirmed = () => {
    setShowResetSalesModal(false);
    setShowRestoreInventoryModal(true);
  };

  const handleRestoreInventoryChoice = (restore: boolean) => {
    setShowRestoreInventoryModal(false);
    onResetSalesHistory(restore);
  };

  const handleResetAll = () => {
    setShowResetAllModal(true);
  };

  const handleResetAllConfirmed = () => {
    setShowResetAllModal(false);
    setConfirmationText('');
    setShowResetAllConfirmModal(true);
  };

  const handleResetAllFinalConfirm = () => {
    if (confirmationText === 'YES') {
      setShowResetAllConfirmModal(false);
      setConfirmationText('');
      onResetAllData();
    }
  };

  const handleCancelResetAll = () => {
    setShowResetAllConfirmModal(false);
    setConfirmationText('');
  };

  return (
    <>
      <ConfirmModal
        isOpen={showResetSalesModal}
        title="Reset Sales History"
        type="danger"
        message={
          <div className="space-y-4">
            <p className="font-semibold text-lg">Are you sure you want to reset all sales history?</p>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="font-semibold text-red-900 mb-2">This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-red-800">
                <li>All sales records</li>
                <li>All returns</li>
                <li>Seller reports</li>
              </ul>
            </div>
            <p className="text-red-600 font-bold">This action CANNOT be undone!</p>
          </div>
        }
        confirmText="Yes, Delete All Sales"
        cancelText="Cancel"
        onConfirm={handleResetSalesConfirmed}
        onCancel={() => setShowResetSalesModal(false)}
      />

      <ConfirmModal
        isOpen={showRestoreInventoryModal}
        title="Restore Inventory?"
        type="warning"
        message={
          <div className="space-y-4">
            <p className="font-semibold text-lg">Do you want to restore all sold items back to inventory?</p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-blue-900 mb-2">
                <span className="font-semibold">Restore Inventory:</span> All sold products will be added back to your stock
              </p>
              <p className="text-blue-900">
                <span className="font-semibold">Don't Restore:</span> Sales will be deleted but inventory stays as is
              </p>
            </div>
          </div>
        }
        confirmText="Restore Inventory"
        cancelText="Don't Restore"
        onConfirm={() => handleRestoreInventoryChoice(true)}
        onCancel={() => handleRestoreInventoryChoice(false)}
      />

      <ConfirmModal
        isOpen={showResetAllModal}
        title="Reset ALL Data"
        type="danger"
        message={
          <div className="space-y-4">
            <p className="font-semibold text-xl text-red-600">CRITICAL WARNING</p>
            <p className="font-semibold text-lg">Are you sure you want to reset ALL data?</p>
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
              <p className="font-semibold text-red-900 mb-2">This will permanently delete EVERYTHING:</p>
              <ul className="list-disc list-inside space-y-1 text-red-800">
                <li>All products</li>
                <li>All sales records</li>
                <li>All customers</li>
                <li>All sellers</li>
                <li>All returns</li>
              </ul>
            </div>
            <p className="text-red-600 font-bold text-lg">This action CANNOT be undone!</p>
            <p className="text-slate-700">You will need to type YES in the next step to confirm.</p>
          </div>
        }
        confirmText="I Understand, Continue"
        cancelText="Cancel"
        onConfirm={handleResetAllConfirmed}
        onCancel={() => setShowResetAllModal(false)}
      />

      {showResetAllConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in border-2 border-slate-200">
            <div className="relative px-6 py-5 border-b border-red-200 bg-gradient-to-r from-slate-50 to-gray-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 flex-1">Final Confirmation Required</h3>
                <button
                  onClick={handleCancelResetAll}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div className="text-slate-700 leading-relaxed space-y-3">
                <p className="font-semibold text-lg">This is your last chance to cancel!</p>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-900">
                    Type <span className="font-mono font-bold text-lg">YES</span> in the box below to permanently delete all data.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Type YES to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type YES here"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-center font-mono text-lg"
                  autoFocus
                />
              </div>

              {confirmationText && confirmationText !== 'YES' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                  <p className="text-yellow-800 text-sm">
                    Please type exactly <span className="font-mono font-bold">YES</span> (all capitals)
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 rounded-b-2xl flex gap-3">
              <button
                onClick={handleCancelResetAll}
                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-all duration-200 font-semibold hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAllFinalConfirm}
                disabled={confirmationText !== 'YES'}
                className={`flex-1 px-4 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg ${
                  confirmationText === 'YES'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Delete All Data
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        {isAuthenticated && (
          <div className="flex items-center space-x-2">
            <label className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 cursor-pointer">
              <Download className="h-4 w-4" />
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
            <button
              onClick={onExport}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Export Data
            </button>
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
        
        {/* Auto-Backup Status */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📊 Current Data Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-blue-600">{products.length}</div>
              <div className="text-blue-700">Products</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-600">{sales.length}</div>
              <div className="text-green-700">Sales</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">{customers.length}</div>
              <div className="text-purple-700">Customers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-600">{sellers.length}</div>
              <div className="text-orange-700">Sellers</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-blue-700">
            💡 <strong>Tip:</strong> Export your data regularly to prevent loss!
          </div>
        </div>

        {/* Quick Backup */}
        {isAuthenticated && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-900">🔄 Quick Backup</h4>
                <p className="text-sm text-green-700">Download your current data as backup</p>
              </div>
              <button
                onClick={onExport}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Backup Now
              </button>
            </div>
          </div>
        )}

        {isAuthenticated && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h4 className="font-medium text-red-900">Reset Sales History</h4>
                <p className="text-sm text-red-700">This will permanently delete all sales data, returns, and seller reports</p>
              </div>
              <button
                type="button"
                onClick={handleResetSales}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Reset Sales
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <div>
                <h4 className="font-medium text-yellow-900">Reset All Data</h4>
                <p className="text-sm text-yellow-700">This will delete everything: products, sales, customers, sellers</p>
              </div>
              <button
                type="button"
                onClick={handleResetAll}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="IQD">Iraqi Dinar (IQD)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                USD to IQD Exchange Rate
              </label>
              <input
                type="number"
                name="usdToIqdRate"
                value={formData.usdToIqdRate}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                name="taxRate"
                value={formData.taxRate * 100}
                onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) / 100 || 0 }))}
                min="0"
                max="100"
                step="0.1"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Low Stock Threshold
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Format
              </label>
              <select
                name="dateFormat"
                value={formData.dateFormat}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd</option>
              </select>
            </div>

          </div>
        </div>

        {/* Alert Rules */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alert Rules</h3>
          
          <div className="space-y-4">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => handleRuleChange(rule.id, 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {rule.type === 'low_stock' && 'Low Stock Alert'}
                      {rule.type === 'out_of_stock' && 'Out of Stock Alert'}
                      {rule.type === 'high_value_sale' && 'High Value Sale Alert'}
                    </p>
                    <p className="text-sm text-gray-600">{rule.message}</p>
                  </div>
                </div>
                
                {rule.threshold !== undefined && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Threshold:</label>
                    <input
                      type="number"
                      value={rule.threshold}
                      onChange={(e) => handleRuleChange(rule.id, 'threshold', parseFloat(e.target.value) || 0)}
                      min="0"
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Currency Converter */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Currency Converter</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                USD Amount
              </label>
              <input
                type="number"
                placeholder="Enter USD amount"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const usd = parseFloat(e.target.value) || 0;
                  const iqd = usd * formData.usdToIqdRate;
                  const iqdInput = document.getElementById('iqd-input') as HTMLInputElement;
                  if (iqdInput) iqdInput.value = iqd.toLocaleString();
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IQD Amount
              </label>
              <input
                id="iqd-input"
                type="text"
                placeholder="IQD equivalent"
                readOnly
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:outline-none"
              />
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-2">
            Current rate: 1 USD = {formData.usdToIqdRate.toLocaleString()} IQD
          </p>
        </div>

        {/* Category Management */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Category Management
            </h3>

            {categorySuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                Category added successfully!
              </div>
            )}

            {categoryError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {categoryError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Enter description"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddCategory}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </button>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Existing Categories ({categories.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {categories.map(category => (
                    <div
                      key={category.id}
                      className="group p-3 border border-gray-200 rounded-lg bg-gray-50 hover:border-red-300 transition-colors"
                      title={category.description}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-gray-500 truncate">{category.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryToDelete(category);
                            setDeleteCategoryError('');
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                          title="Remove category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Category Confirmation Modal */}
        {categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Remove Category</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to remove <span className="font-semibold text-gray-900">{categoryToDelete.name}</span>?
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Products using this category will keep their current value but won't appear in this list.
              </p>
              {deleteCategoryError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {deleteCategoryError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryToDelete(null);
                    setDeleteCategoryError('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCategory}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PIN Management */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              PIN Management
            </h3>

            {pinSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                PIN updated successfully!
              </div>
            )}

            {pinError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {pinError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={7}
                  value={isChangingPin ? '' : '••••••'}
                  onChange={(e) => setIsChangingPin(true)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current PIN"
                  disabled={!isChangingPin}
                />
              </div>

              {isChangingPin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={7}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new PIN"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={7}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new PIN"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setPinError('');
                        setPinSuccess(false);

                        if (newPin.length < 4) {
                          setPinError('PIN must be at least 4 digits');
                          return;
                        }

                        if (newPin !== confirmPin) {
                          setPinError('PINs do not match');
                          return;
                        }

                        try {
                          const { data: currentPinData } = await supabase
                            .from('pin_settings')
                            .select('pin')
                            .maybeSingle();

                          if (currentPinData) {
                            const { error } = await supabase
                              .from('pin_settings')
                              .update({ pin: newPin, updated_at: new Date().toISOString() })
                              .eq('pin', currentPinData.pin);

                            if (error) throw error;

                            setCurrentPin(newPin);
                            setNewPin('');
                            setConfirmPin('');
                            setPinSuccess(true);
                            setIsChangingPin(false);

                            setTimeout(() => setPinSuccess(false), 3000);
                          }
                        } catch (err) {
                          setPinError('Failed to update PIN. Please try again.');
                        }
                      }}
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Key className="h-4 w-4" />
                      Update PIN
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPin(false);
                        setNewPin('');
                        setConfirmPin('');
                        setPinError('');
                        setPinSuccess(false);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {!isChangingPin && (
                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Key className="h-4 w-4" />
                  Change PIN
                </button>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        {isAuthenticated ? (
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        ) : (
          <div className="flex justify-end">
            <div className="bg-gray-100 text-gray-600 px-6 py-2 rounded-md text-sm">
              Sign in to modify settings
            </div>
          </div>
        )}
      </form>
      </div>
    </>
  );
}