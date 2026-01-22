import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Crown } from "lucide-react";

interface LicenseExpiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

const LicenseExpiredModal = ({ open, onOpenChange, message }: LicenseExpiredModalProps) => {
  const handleUpgrade = () => {
    // Future: Navigate to upgrade page or open payment flow
    // For now, just close the modal
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl">License Expired</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {message || "Your license has expired. Please upgrade to continue using premium features."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/50 rounded-lg p-4 my-4">
          <h4 className="font-medium mb-2">With an active license you get:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ Unlimited products</li>
            <li>✓ Unlimited bills per month</li>
            <li>✓ Full reports & export access</li>
            <li>✓ Cloud backup & sync</li>
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseExpiredModal;