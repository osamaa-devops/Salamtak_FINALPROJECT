import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Smartphone, Monitor, Download } from 'lucide-react';

interface MobileOptimizerProps {
  children: React.ReactNode;
}

export function MobileOptimizer({ children }: MobileOptimizerProps) {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect device type
    const detectDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (width <= 768) {
        setDeviceType('mobile');
      } else if (width <= 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }

      // Check if iOS
      const iosCheck = /ipad|iphone|ipod/.test(userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(iosCheck);

      // Check if running as PWA
      const standaloneCheck = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone;
      setIsStandalone(standaloneCheck);
    };

    detectDevice();
    
    // PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show install prompt on mobile devices (will be checked in render)
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    const handleResize = () => {
      detectDevice();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []); // Run only once on mount

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  // iOS Safari install instructions
  const IOSInstallPrompt = () => (
    <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-t-lg shadow-lg border-t-4 border-t-primary">
      <CardContent className="p-4">
        <div className="flex items-center space-x-reverse space-x-3 mb-3">
          <Smartphone className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold">أضف سلامتك للشاشة الرئيسية</h3>
            <p className="text-sm text-muted-foreground">للحصول على أفضل تجربة استخدام</p>
          </div>
        </div>
        <div className="text-sm space-y-2 mb-4">
          <p>1. اضغط على زر المشاركة <span className="mx-1">⬆️</span> في أسفل الشاشة</p>
          <p>2. اختر "أضف إلى الشاشة الرئيسية" <span className="mx-1">📱</span></p>
          <p>3. اضغط "إضافة" لتثبيت التطبيق</p>
        </div>
        <Button 
          onClick={dismissInstallPrompt}
          variant="outline" 
          size="sm" 
          className="w-full"
        >
          فهمت، شكراً
        </Button>
      </CardContent>
    </Card>
  );

  // Android install prompt
  const AndroidInstallPrompt = () => (
    <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-t-lg shadow-lg border-t-4 border-t-primary">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-reverse space-x-3">
            <Download className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold">ثبت تطبيق سلامتك</h3>
              <p className="text-sm text-muted-foreground">تجربة أفضل كتطبيق محلي</p>
            </div>
          </div>
          <Button onClick={dismissInstallPrompt} variant="ghost" size="sm" className="h-8 w-8 p-0">
            ✕
          </Button>
        </div>
        <div className="flex space-x-reverse space-x-2">
          <Button 
            onClick={handleInstallClick}
            size="sm" 
            className="flex-1"
          >
            تثبيت التطبيق
          </Button>
          <Button 
            onClick={dismissInstallPrompt}
            variant="outline" 
            size="sm"
          >
            لاحقاً
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className={`min-h-screen ${deviceType === 'mobile' ? 'mobile-optimized' : ''}`}>
        {children}
      </div>
      
      {/* Install prompts - only show on mobile devices */}
      {showInstallPrompt && !isStandalone && deviceType === 'mobile' && (
        <>
          {isIOS ? <IOSInstallPrompt /> : <AndroidInstallPrompt />}
        </>
      )}
    </>
  );
}
