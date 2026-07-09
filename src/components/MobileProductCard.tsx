import { useState, useRef, useEffect } from 'react';
import { CreditCard as Edit2, Trash2, Package, AlertTriangle, AlertOctagon, Bell, BellOff } from 'lucide-react';
import { Product, StockWarningLevel } from '../types';
import { useSwipe } from '../hooks/useSwipe';
import { getStockStatus } from '../utils/stockAlerts';

interface MobileProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleWarnings?: (productId: string, level: StockWarningLevel) => void;
  isAuthenticated: boolean;
}

export function MobileProductCard({ product, onEdit, onDelete, onToggleWarnings, isAuthenticated }: MobileProductCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [showWarningMenu, setShowWarningMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const stockStatus = getStockStatus(product);
  const profitMargin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowWarningMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (isAuthenticated) {
        setSwipeOffset(-150);
        setIsSwipeActive(true);
      }
    },
    onSwipeRight: () => {
      setSwipeOffset(0);
      setIsSwipeActive(false);
    },
    minSwipeDistance: 30,
  });

  const handleEdit = () => {
    setSwipeOffset(0);
    setIsSwipeActive(false);
    onEdit(product);
  };

  const handleDelete = () => {
    setSwipeOffset(0);
    setIsSwipeActive(false);
    onDelete(product.id);
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-lg shadow-md">
      {isAuthenticated && (
        <div className="absolute right-0 top-0 bottom-0 w-[150px] flex">
          <button
            onClick={handleEdit}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
          >
            <Edit2 className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      )}

      <div
        {...swipeHandlers}
        className="relative bg-white transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onClick={() => {
          if (isSwipeActive) {
            setSwipeOffset(0);
            setIsSwipeActive(false);
          }
        }}
      >
        <div className="flex gap-4 p-4">
          <div className="w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg relative overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {onToggleWarnings && isAuthenticated && (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowWarningMenu(!showWarningMenu);
                      }}
                      className={`p-1.5 rounded-full transition-all duration-200 ${
                        product.stockWarningLevel === 'all'
                          ? 'bg-blue-500 text-white'
                          : product.stockWarningLevel === 'out_only'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                      title={
                        product.stockWarningLevel === 'all'
                          ? 'All warnings'
                          : product.stockWarningLevel === 'out_only'
                          ? 'Out of stock only'
                          : 'Disabled'
                      }
                    >
                      {product.stockWarningLevel === 'disabled' ? (
                        <BellOff className="h-3 w-3" />
                      ) : (
                        <Bell className="h-3 w-3" />
                      )}
                    </button>
                    {showWarningMenu && (
                      <div className="absolute top-8 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px] z-50">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWarnings(product.id, 'all');
                            setShowWarningMenu(false);
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm ${
                            product.stockWarningLevel === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <Bell className="h-3 w-3" />
                          <span className="font-medium">All Warnings</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWarnings(product.id, 'out_only');
                            setShowWarningMenu(false);
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-yellow-50 transition-colors flex items-center gap-2 text-sm ${
                            product.stockWarningLevel === 'out_only' ? 'bg-yellow-50 text-yellow-700' : 'text-gray-700'
                          }`}
                        >
                          <AlertOctagon className="h-3 w-3" />
                          <span className="font-medium">Out of Stock Only</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWarnings(product.id, 'disabled');
                            setShowWarningMenu(false);
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm ${
                            product.stockWarningLevel === 'disabled' ? 'bg-gray-50 text-gray-700' : 'text-gray-700'
                          }`}
                        >
                          <BellOff className="h-3 w-3" />
                          <span className="font-medium">Disabled</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {stockStatus.needsAttention && (
                  <div className="flex-shrink-0">
                    {stockStatus.level === 'out' && <AlertOctagon className="h-4 w-4 text-red-600" />}
                    {stockStatus.level === 'low' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div>
                <span className="text-gray-600">Price:</span>
                <span className="ml-1 font-medium text-green-600">IQD {product.price.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-gray-600">Stock:</span>
                <span className={`ml-1 font-medium ${stockStatus.color}`}>
                  {product.stock}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Cost:</span>
                <span className="ml-1 font-medium">IQD {product.cost.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-gray-600">Margin:</span>
                <span className={`ml-1 font-medium ${profitMargin >= 20 ? 'text-green-600' : profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(0)}%
                </span>
              </div>
            </div>

            {stockStatus.needsAttention && (
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.textColor} border ${stockStatus.borderColor}`}>
                  {stockStatus.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {isAuthenticated && (
          <div className="px-4 pb-3 text-xs text-gray-400 text-center">
            Swipe left to edit or delete
          </div>
        )}
      </div>
    </div>
  );
}
