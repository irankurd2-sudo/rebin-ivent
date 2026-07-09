import { useState, useEffect } from 'react';
import { X, AlertTriangle, Package, DollarSign, User, Hash } from 'lucide-react';
import { Sale } from '../types';

interface DeleteSaleModalProps {
  isOpen: boolean;
  sale: Sale | null;
  onConfirm: (restoreInventory: boolean) => void;
  onCancel: () => void;
}

export function DeleteSaleModal({
  isOpen,
  sale,
  onConfirm,
  onCancel
}: DeleteSaleModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [restoreInventory, setRestoreInventory] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setRestoreInventory(true);
    }
  }, [isOpen]);

  if (!isOpen || !sale) return null;

  const isConfirmValid = confirmText.trim().toUpperCase() === 'DELETE';

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm(restoreInventory);
      setConfirmText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isConfirmValid) {
      handleConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-scale-in border-2 border-red-100">
        <div className="relative px-6 py-5 border-b border-red-200 bg-gradient-to-r from-red-50 via-orange-50 to-red-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg animate-pulse">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900">Delete Sale</h3>
              <p className="text-sm text-red-600 mt-0.5">This action cannot be undone</p>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Sale Details
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 bg-white bg-opacity-60 rounded-lg p-3">
                <Package className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-red-800">Product</p>
                  <p className="text-sm font-semibold text-slate-900 break-words">
                    {sale.productName}
                    {sale.productColor && (
                      <span className="text-slate-600"> ({sale.productColor})</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white bg-opacity-60 rounded-lg p-3">
                <User className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-red-800">Customer</p>
                  <p className="text-sm font-semibold text-slate-900 break-words">
                    {sale.customerName || 'Walk-in Customer'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-start gap-3 bg-white bg-opacity-60 rounded-lg p-3">
                  <Package className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-red-800">Quantity</p>
                    <p className="text-sm font-bold text-slate-900">{sale.quantity} units</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white bg-opacity-60 rounded-lg p-3">
                  <DollarSign className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-red-800">Total</p>
                    <p className="text-sm font-bold text-slate-900">IQD {sale.total.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={restoreInventory}
                onChange={(e) => setRestoreInventory(e.target.checked)}
                className="mt-1 h-5 w-5 text-blue-600 border-blue-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 group-hover:text-blue-700 transition-colors">
                  Restore stock to inventory
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {restoreInventory
                    ? `${sale.quantity} units will be added back to inventory`
                    : 'Stock will NOT be restored (sale will be removed only)'
                  }
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Type <span className="text-red-600 font-mono bg-red-50 px-2 py-0.5 rounded">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type DELETE here"
              autoFocus
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-200 focus:border-red-400 transition-all font-medium text-slate-900 placeholder:text-slate-400"
            />
            {confirmText && !isConfirmValid && (
              <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Please type "DELETE" exactly to confirm
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 rounded-b-2xl flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-all duration-200 font-semibold hover:shadow-md"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmValid}
            className={`flex-1 px-4 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg transform
              ${isConfirmValid
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:shadow-xl hover:-translate-y-0.5 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            Delete Sale
          </button>
        </div>
      </div>
    </div>
  );
}
