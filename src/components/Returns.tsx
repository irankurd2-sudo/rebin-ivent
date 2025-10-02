import { useState } from 'react';
import { RotateCcw, Plus, Eye, Check, X } from 'lucide-react';
import { Return, Sale, Product } from '../types';
import { format } from 'date-fns';

interface ReturnsProps {
  returns: Return[];
  sales: Sale[];
  products: Product[];
  onAddReturn: (returnData: Omit<Return, 'id' | 'date'>) => void;
  onUpdateReturn: (id: string, data: Partial<Return>) => void;
}

export function Returns({ returns, sales, products, onAddReturn, onUpdateReturn }: ReturnsProps) {
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [formData, setFormData] = useState({
    saleId: '',
    reason: '',
    quantity: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sale = sales.find(s => s.id === formData.saleId);
    if (!sale) return;

    if (formData.quantity > sale.quantity) {
      alert('Return quantity cannot exceed sale quantity');
      return;
    }
    const returnData: Omit<Return, 'id' | 'date'> = {
      saleId: formData.saleId,
      productId: sale.productId,
      productName: sale.productName,
      quantity: formData.quantity,
      reason: formData.reason,
      refundAmount: (sale.unitPrice * formData.quantity) - (sale.discount * formData.quantity / sale.quantity),
      status: 'pending',
    };

    onAddReturn(returnData);
    setShowReturnForm(false);
    setFormData({ saleId: '', reason: '', quantity: 1 });
  };

  const handleStatusUpdate = (returnId: string, status: 'approved' | 'rejected') => {
    onUpdateReturn(returnId, { status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Returns Management</h2>
        <button
          onClick={() => setShowReturnForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Process Return
        </button>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Return ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refund Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {returns.map(returnItem => (
                <tr key={returnItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{returnItem.id.slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {returnItem.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {returnItem.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${returnItem.refundAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {returnItem.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(returnItem.date, 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(returnItem.status)}`}>
                      {returnItem.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setSelectedReturn(returnItem)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {returnItem.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(returnItem.id, 'approved')}
                            className="text-green-600 hover:text-green-900 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(returnItem.id, 'rejected')}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {returns.length === 0 && (
          <div className="text-center py-12">
            <RotateCcw className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No returns</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by processing your first return.</p>
          </div>
        )}
      </div>

      {/* Return Form Modal */}
      {showReturnForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Process Return</h3>
              <button
                onClick={() => setShowReturnForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Sale *
                </label>
                <select
                  value={formData.saleId}
                  onChange={(e) => setFormData(prev => ({ ...prev, saleId: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a sale</option>
                  {sales.filter(sale => sale.status === 'completed').map(sale => (
                    <option key={sale.id} value={sale.id}>
                      #{sale.id.slice(-6)} - {sale.productName} (Qty: {sale.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Return *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  min="1"
                  max={sales.find(s => s.id === formData.saleId)?.quantity || 1}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Return *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  required
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the reason for return..."
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Process Return
                </button>
                <button
                  type="button"
                  onClick={() => setShowReturnForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Details Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Return Details</h3>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Return ID</label>
                <p className="text-sm text-gray-900">#{selectedReturn.id.slice(-6)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Product</label>
                <p className="text-sm text-gray-900">{selectedReturn.productName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <p className="text-sm text-gray-900">{selectedReturn.quantity}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Refund Amount</label>
                <p className="text-sm text-gray-900">${selectedReturn.refundAmount.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <p className="text-sm text-gray-900">{selectedReturn.reason}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="text-sm text-gray-900">{format(selectedReturn.date, 'MMM dd, yyyy HH:mm')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReturn.status)}`}>
                  {selectedReturn.status}
                </span>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}