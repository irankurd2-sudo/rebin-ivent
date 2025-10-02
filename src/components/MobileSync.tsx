import { useState, useEffect } from 'react';
import { Smartphone, Wifi, WifiOff, RefreshCw, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { MobileSession } from '../types';

interface MobileSyncProps {
  onSync: () => Promise<void>;
  onExportMobile: () => void;
  onImportMobile: (data: any) => void;
}

export function MobileSync({ onSync, onExportMobile, onImportMobile }: MobileSyncProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load sync data from localStorage
    const savedLastSync = localStorage.getItem('lastSync');
    if (savedLastSync) {
      setLastSync(new Date(savedLastSync));
    }

    const savedPendingChanges = localStorage.getItem('pendingChanges');
    if (savedPendingChanges) {
      setPendingChanges(parseInt(savedPendingChanges, 10));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline) return;

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      await onSync();
      const now = new Date();
      setLastSync(now);
      setPendingChanges(0);
      setSyncStatus('success');
      
      localStorage.setItem('lastSync', now.toISOString());
      localStorage.setItem('pendingChanges', '0');

      // Reset status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          onImportMobile(data);
          setPendingChanges(0);
          localStorage.setItem('pendingChanges', '0');
        } catch (error) {
          console.error('Failed to import mobile data:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return isOnline ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Sync successful';
      case 'error':
        return 'Sync failed';
      default:
        return isOnline ? 'Online' : 'Offline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Mobile Sync</h2>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${
            isOnline ? 'text-green-600' : 'text-red-600'
          }`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Sync Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Sync Status</h3>
          <Smartphone className="h-6 w-6 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
              isOnline ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isOnline ? <Wifi className="h-6 w-6 text-green-600" /> : <WifiOff className="h-6 w-6 text-red-600" />}
            </div>
            <p className="text-sm font-medium text-gray-900">Connection</p>
            <p className={`text-xs ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-2">
              <RefreshCw className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Last Sync</p>
            <p className="text-xs text-gray-600">
              {lastSync ? lastSync.toLocaleString() : 'Never'}
            </p>
          </div>

          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
              pendingChanges > 0 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <AlertCircle className={`h-6 w-6 ${
                pendingChanges > 0 ? 'text-yellow-600' : 'text-green-600'
              }`} />
            </div>
            <p className="text-sm font-medium text-gray-900">Pending Changes</p>
            <p className={`text-xs ${pendingChanges > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {pendingChanges} items
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleSync}
            disabled={!isOnline || isSyncing}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Mobile Data Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mobile Data Management</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Download className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">Export for Mobile</p>
                <p className="text-sm text-gray-600">Download data for offline mobile use</p>
              </div>
            </div>
            <button
              onClick={onExportMobile}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Export
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Upload className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Import from Mobile</p>
                <p className="text-sm text-gray-600">Upload data from mobile device</p>
              </div>
            </div>
            <label className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors cursor-pointer">
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Offline Mode Instructions */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800">Offline Mode</h3>
              <p className="text-yellow-700 mt-1">
                You're currently offline. Changes will be saved locally and synced when you're back online.
              </p>
              <ul className="mt-3 text-sm text-yellow-700 space-y-1">
                <li>• All changes are automatically saved locally</li>
                <li>• Data will sync when connection is restored</li>
                <li>• Use export/import for manual data transfer</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Sync History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sync History</h3>
        
        <div className="space-y-3">
          {lastSync && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-900">Successful Sync</p>
                  <p className="text-sm text-green-700">{lastSync.toLocaleString()}</p>
                </div>
              </div>
              <span className="text-sm text-green-600">Complete</span>
            </div>
          )}
          
          {!lastSync && (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p>No sync history available</p>
              <p className="text-sm">Perform your first sync to see history</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile App Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Smartphone className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-blue-800">Mobile App Integration</h3>
            <p className="text-blue-700 mt-1">
              Use the companion mobile app for on-the-go inventory management.
            </p>
            <div className="mt-3 space-y-2 text-sm text-blue-700">
              <p><strong>Features:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• Barcode scanning for quick product lookup</li>
                <li>• Offline inventory updates</li>
                <li>• Real-time sync when online</li>
                <li>• Mobile-optimized interface</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}