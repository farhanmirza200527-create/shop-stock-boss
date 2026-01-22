import { Badge } from "@/components/ui/badge";
import { Crown, Clock, AlertTriangle, User } from "lucide-react";
import { LicenseType } from "@/hooks/useLicense";

interface LicenseBadgeProps {
  licenseType: LicenseType;
  daysRemaining?: number;
  className?: string;
}

const LicenseBadge = ({ licenseType, daysRemaining, className = "" }: LicenseBadgeProps) => {
  const getBadgeConfig = () => {
    switch (licenseType) {
      case 'ACTIVE':
        return {
          icon: <Crown className="w-3 h-3" />,
          label: 'Premium',
          variant: 'default' as const,
          className: 'bg-gradient-to-r from-primary to-accent text-white',
        };
      case 'TRIAL':
        return {
          icon: <Clock className="w-3 h-3" />,
          label: `Trial${daysRemaining !== undefined ? ` (${daysRemaining}d)` : ''}`,
          variant: 'secondary' as const,
          className: daysRemaining !== undefined && daysRemaining <= 3 
            ? 'bg-amber-500 text-white' 
            : 'bg-blue-500 text-white',
        };
      case 'EXPIRED':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          label: 'Expired',
          variant: 'destructive' as const,
          className: '',
        };
      case 'NONE':
      default:
        return {
          icon: <User className="w-3 h-3" />,
          label: 'Guest',
          variant: 'outline' as const,
          className: '',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </Badge>
  );
};

export default LicenseBadge;