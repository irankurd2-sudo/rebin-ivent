import { useState } from 'react';
import { Globe, Plus, CreditCard as Edit2, Trash2, CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';
import { APIEndpoint } from '../types';

interface APIIntegrationProps {
  endpoints: APIEndpoint[];
  onAddEndpoint: (endpoint: Omit<APIEndpoint, 'id'>) => void;
  onUpdateEndpoint: (id: string, endpoint: Partial<APIEndpoint>) => void;
  onDeleteEndpoint: (id: string) => void;
  onTestEndpoint: (id: string) => Promise<boolean>;
  onSyncEndpoint: (id: string) => Promise<void>;
}

export function APIIntegration({
  endpoints,
  onAddEndpoint,
  onUpdateEndpoint,
  onDeleteEndpoint,
  onTestEndpoint,
  onSyncEndpoint
}: APIIntegrationProps) {
  const [showEndpointForm, setShowEndpointForm] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<APIEndpoint | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [syncingEndpoint, setSyncingEndpoint] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'GET' as APIEndpoint['method'],
    headers: {} as Record<string, string>,
    enabled: true,
  });

  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEndpoint) {
      onUpdateEndpoint(editingEndpoint.id, formData);
    } else {
      onAddEndpoint(formData);
    }

    setShowEndpointForm(false);
    setEditingEndpoint(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      method: 'GET',
      headers: {},
      enabled: true,
    });
    setHeaderKey('');
    setHeaderValue('');
  };

  const handleEdit = (endpoint: APIEndpoint) => {
    setEditingEndpoint(endpoint);
    setFormData({
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      headers: endpoint.headers,
      enabled: endpoint.enabled,
    });
    setShowEndpointForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this API endpoint?')) {
      onDeleteEndpoint(id);
    }
  };

  const handleTest = async (id: string) => {
    setTestingEndpoint(id);
    try {
      const success = await onTestEndpoint(id);
      // Visual feedback is handled by the parent component
    } finally {
      setTestingEndpoint(null);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingEndpoint(id);
    try {
      await onSyncEndpoint(id);
    } finally {
      setSyncingEndpoint(null);
    }
  };

  const addHeader = () => {
    if (headerKey && headerValue) {
      setFormData(prev => ({
        ...prev,
        headers: { ...prev.headers, [headerKey]: headerValue }
      }));
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const removeHeader = (key: string) => {
    setFormData(prev => ({
      ...prev,
      headers: Object.fromEntries(Object.entries(prev.headers).filter(([k]) => k !== key))
    }));
  };

  const predefinedEndpoints = [
    {
      name: 'Shopify Products',
      url: 'https://your-shop.myshopify.com/admin/api/2023-01/products.json',
      method: 'GET' as const,
      headers: { 'X-Shopify-Access-Token': 'your-token' },
    },
    {
      name: 'WooCommerce Products',
      url: 'https://yoursite.com/wp-json/wc/v3/products',
      method: 'GET' as const,
      headers: { 'Authorization': 'Basic base64(consumer_key:consumer_secret)' },
    },
    {
      name: 'Square Inventory',
      url: 'https://connect.squareup.com/v2/inventory/counts/batch-retrieve',
      method: 'POST' as const,
      headers: { 'Authorization': 'Bearer your-access-token', 'Content-Type': 'application/json' },
    },
  ];

  const addPredefinedEndpoint = (endpoint: typeof predefinedEndpoints[0]) => {
    setFormData({
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      headers: endpoint.headers,
      enabled: true,
    });
    setShowEndpointForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">API Integration</h2>
        <button
          onClick={() => setShowEndpointForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Endpoint
        </button>
      </div>

      {/* Quick Setup */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Setup</h3>
        <p className="text-gray-600 mb-4">Get started quickly with these popular integrations:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predefinedEndpoints.map((endpoint, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{endpoint.name}</h4>
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-3">{endpoint.method} endpoint</p>
              <button
                onClick={() => addPredefinedEndpoint(endpoint)}
                className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm"
              >
                Configure
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Sync
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {endpoints.map(endpoint => (
                <tr key={endpoint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{endpoint.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{endpoint.url}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {endpoint.enabled ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={`ml-2 text-sm ${
                        endpoint.enabled ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {endpoint.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {endpoint.lastSync ? new Date(endpoint.lastSync).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleTest(endpoint.id)}
                        disabled={testingEndpoint === endpoint.id}
                        className="text-blue-600 hover:text-blue-900 transition-colors disabled:opacity-50"
                        title="Test Connection"
                      >
                        {testingEndpoint === endpoint.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSync(endpoint.id)}
                        disabled={syncingEndpoint === endpoint.id || !endpoint.enabled}
                        className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                        title="Sync Now"
                      >
                        {syncingEndpoint === endpoint.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(endpoint)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(endpoint.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {endpoints.length === 0 && (
          <div className="text-center py-12">
            <Globe className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No API endpoints</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first API integration.</p>
          </div>
        )}
      </div>

      {/* Endpoint Form Modal */}
      {showEndpointForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingEndpoint ? 'Edit API Endpoint' : 'Add API Endpoint'}
              </h3>
              <button
                onClick={() => {
                  setShowEndpointForm(false);
                  setEditingEndpoint(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endpoint Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Shopify Products API"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://api.example.com/products"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HTTP Method
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value as APIEndpoint['method'] }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Headers
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={headerKey}
                      onChange={(e) => setHeaderKey(e.target.value)}
                      placeholder="Header name"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={headerValue}
                      onChange={(e) => setHeaderValue(e.target.value)}
                      placeholder="Header value"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addHeader}
                      className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  {Object.entries(formData.headers).length > 0 && (
                    <div className="border border-gray-200 rounded-md p-3 space-y-2">
                      {Object.entries(formData.headers).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm">
                            <strong>{key}:</strong> {value}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeHeader(key)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                  Enable this endpoint
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                >
                  {editingEndpoint ? 'Update Endpoint' : 'Add Endpoint'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEndpointForm(false);
                    setEditingEndpoint(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}