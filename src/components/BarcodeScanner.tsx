import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Camera, SwitchCamera } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
  title?: string;
}

const BarcodeScanner = ({ open, onOpenChange, onScan, title = "Scan Barcode" }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  useEffect(() => {
    if (open) {
      initScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [open]);

  const initScanner = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setCameras(devices);
        // Prefer back camera
        const backCameraIndex = devices.findIndex(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        const cameraIndex = backCameraIndex >= 0 ? backCameraIndex : 0;
        setCurrentCameraIndex(cameraIndex);
        await startScanner(devices[cameraIndex].id);
      } else {
        toast.error("No cameras found");
      }
    } catch (err) {
      console.error("Error initializing scanner:", err);
      toast.error("Failed to access camera. Please grant camera permissions.");
    }
  };

  const startScanner = async (cameraId: string) => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      }

      scannerRef.current = new Html5Qrcode("barcode-scanner-container");
      
      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // QR code not found - silent ignore
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast.error("Failed to start scanner");
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
    setIsScanning(false);
  };

  const handleScanSuccess = (decodedText: string) => {
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    toast.success(`Scanned: ${decodedText}`);
    stopScanner();
    onScan(decodedText);
    onOpenChange(false);
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await stopScanner();
    await startScanner(cameras[nextIndex].id);
  };

  const handleClose = () => {
    stopScanner();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              {title}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative bg-black">
          <div 
            id="barcode-scanner-container" 
            className="w-full aspect-video"
          />
          
          {/* Scanner overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-32 border-2 border-primary rounded-lg relative">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
            </div>
          </div>
          
          {/* Controls */}
          {cameras.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-background/80 hover:bg-background"
                onClick={switchCamera}
              >
                <SwitchCamera className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Position the barcode within the frame to scan
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports barcodes (UPC, EAN, Code128) and QR codes
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
