import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-orange-800 dark:text-orange-200">
            Você está offline. Alguns recursos podem estar limitados.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOfflineMessage(false)}
            className="h-auto p-1 text-orange-600 hover:text-orange-800"
          >
            ×
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};