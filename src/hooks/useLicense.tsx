import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type LicenseType = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'NONE';

export interface License {
  licenseType: LicenseType;
  startDate: Date | null;
  endDate: Date | null;
  maxProducts: number;
  maxBillsPerMonth: number;
  daysRemaining: number;
}

interface UseLicenseReturn {
  license: License;
  isLoading: boolean;
  canAddProduct: (currentProductCount: number) => boolean;
  canCreateBill: (currentMonthBillCount: number) => boolean;
  canAccessReports: () => boolean;
  refreshLicense: () => Promise<void>;
  getLicenseMessage: () => string | null;
}

const DEFAULT_LICENSE: License = {
  licenseType: 'NONE',
  startDate: null,
  endDate: null,
  maxProducts: 50,
  maxBillsPerMonth: 100,
  daysRemaining: 0,
};

export const useLicense = (): UseLicenseReturn => {
  const { user, isGuest } = useAuth();
  const [license, setLicense] = useState<License>(DEFAULT_LICENSE);
  const [isLoading, setIsLoading] = useState(true);

  const calculateDaysRemaining = (endDate: Date | null): number => {
    if (!endDate) return 0;
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const fetchAndValidateLicense = useCallback(async () => {
    if (isGuest || !user) {
      setLicense({ ...DEFAULT_LICENSE, licenseType: 'NONE' });
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('license_type, license_start_date, license_end_date, max_products, max_bills_per_month')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (!profile) {
        setLicense(DEFAULT_LICENSE);
        setIsLoading(false);
        return;
      }

      const endDate = profile.license_end_date ? new Date(profile.license_end_date) : null;
      const startDate = profile.license_start_date ? new Date(profile.license_start_date) : null;
      const now = new Date();

      let licenseType = profile.license_type as LicenseType;

      // Check if license has expired
      if (endDate && now > endDate && licenseType !== 'ACTIVE') {
        licenseType = 'EXPIRED';
        
        // Update the license type in the database if it changed
        if (profile.license_type !== 'EXPIRED') {
          await supabase
            .from('profiles')
            .update({ license_type: 'EXPIRED' })
            .eq('user_id', user.id);
        }
      }

      setLicense({
        licenseType,
        startDate,
        endDate,
        maxProducts: profile.max_products || 50,
        maxBillsPerMonth: profile.max_bills_per_month || 100,
        daysRemaining: calculateDaysRemaining(endDate),
      });
    } catch (error) {
      console.error('Error fetching license:', error);
      setLicense(DEFAULT_LICENSE);
    } finally {
      setIsLoading(false);
    }
  }, [user, isGuest]);

  useEffect(() => {
    fetchAndValidateLicense();
  }, [fetchAndValidateLicense]);

  const canAddProduct = useCallback((currentProductCount: number): boolean => {
    if (isGuest) return true; // Guest mode - local only
    
    switch (license.licenseType) {
      case 'TRIAL':
        return currentProductCount < license.maxProducts;
      case 'ACTIVE':
        return true;
      case 'EXPIRED':
        return false;
      case 'NONE':
        return true; // Local only
      default:
        return false;
    }
  }, [license, isGuest]);

  const canCreateBill = useCallback((currentMonthBillCount: number): boolean => {
    if (isGuest) return true; // Guest mode - local only
    
    switch (license.licenseType) {
      case 'TRIAL':
        return currentMonthBillCount < license.maxBillsPerMonth;
      case 'ACTIVE':
        return true;
      case 'EXPIRED':
        return false;
      case 'NONE':
        return true; // Local only
      default:
        return false;
    }
  }, [license, isGuest]);

  const canAccessReports = useCallback((): boolean => {
    if (isGuest) return false;
    return license.licenseType === 'ACTIVE';
  }, [license, isGuest]);

  const getLicenseMessage = useCallback((): string | null => {
    switch (license.licenseType) {
      case 'EXPIRED':
        return 'Your license has expired. Please upgrade to continue using premium features.';
      case 'TRIAL':
        if (license.daysRemaining <= 3) {
          return `Your trial expires in ${license.daysRemaining} day${license.daysRemaining !== 1 ? 's' : ''}. Upgrade now!`;
        }
        return null;
      default:
        return null;
    }
  }, [license]);

  return {
    license,
    isLoading,
    canAddProduct,
    canCreateBill,
    canAccessReports,
    refreshLicense: fetchAndValidateLicense,
    getLicenseMessage,
  };
};