import { useState, useEffect, useCallback } from 'react';

// Types for guest data
interface GuestCategory {
  id: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE';
  created_at: string;
}

interface GuestProduct {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  section?: string;
  part?: string;
  row_number?: string;
  column_number?: string;
  category?: string;
  category_id?: string;
  item_type?: 'PRODUCT' | 'SERVICE';
  warranty_available: boolean;
  warranty_period?: string;
  description?: string;
  image_url?: string;
  created_at: string;
  deleted_at?: string;
}

interface GuestBill {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  bill_items: any[];
  created_at: string;
}

interface GuestRepair {
  id: string;
  customer_name: string;
  customer_phone?: string;
  device_model: string;
  problem_description: string;
  parts_used?: string;
  estimated_cost: number;
  final_cost: number;
  received_date: string;
  delivery_date?: string;
  repair_status: string;
  warranty_available: boolean;
  warranty_period?: string;
  photo_url?: string;
  created_at: string;
}

interface GuestData {
  categories: GuestCategory[];
  products: GuestProduct[];
  bills: GuestBill[];
  repairs: GuestRepair[];
}

const GUEST_DATA_KEY = 'guestData';

const getInitialData = (): GuestData => {
  try {
    const stored = localStorage.getItem(GUEST_DATA_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure categories array exists for older data
      return {
        categories: parsed.categories || [],
        products: parsed.products || [],
        bills: parsed.bills || [],
        repairs: parsed.repairs || [],
      };
    }
  } catch (error) {
    console.error('Error reading guest data:', error);
  }
  return { categories: [], products: [], bills: [], repairs: [] };
};

export const useGuestData = () => {
  const [data, setData] = useState<GuestData>(getInitialData);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data));
  }, [data]);

  const generateId = () => crypto.randomUUID();

  // Categories
  const addCategory = useCallback((category: Omit<GuestCategory, 'id' | 'created_at'>) => {
    const newCategory: GuestCategory = {
      ...category,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      categories: [newCategory, ...prev.categories],
    }));
    return newCategory;
  }, []);

  const getCategories = useCallback(() => {
    return data.categories;
  }, [data.categories]);

  const deleteCategory = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
    }));
  }, []);

  // Products
  const addProduct = useCallback((product: Omit<GuestProduct, 'id' | 'created_at'>) => {
    const newProduct: GuestProduct = {
      ...product,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      products: [newProduct, ...prev.products],
    }));
    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<GuestProduct>) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === id ? { ...p, deleted_at: new Date().toISOString() } : p
      ),
    }));
  }, []);

  const getProducts = useCallback(() => {
    return data.products.filter(p => !p.deleted_at);
  }, [data.products]);

  const getDeletedProducts = useCallback(() => {
    return data.products.filter(p => p.deleted_at);
  }, [data.products]);

  // Bills
  const addBill = useCallback((bill: Omit<GuestBill, 'id' | 'created_at'>) => {
    const newBill: GuestBill = {
      ...bill,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      bills: [newBill, ...prev.bills],
    }));
    return newBill;
  }, []);

  const getBills = useCallback(() => data.bills, [data.bills]);

  // Repairs
  const addRepair = useCallback((repair: Omit<GuestRepair, 'id' | 'created_at'>) => {
    const newRepair: GuestRepair = {
      ...repair,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      repairs: [newRepair, ...prev.repairs],
    }));
    return newRepair;
  }, []);

  const getRepairs = useCallback(() => data.repairs, [data.repairs]);

  // Get all data for migration
  const getAllData = useCallback(() => data, [data]);

  // Clear all guest data
  const clearData = useCallback(() => {
    setData({ categories: [], products: [], bills: [], repairs: [] });
    localStorage.removeItem(GUEST_DATA_KEY);
  }, []);

  // Check if there's any guest data
  const hasData = useCallback(() => {
    return data.products.length > 0 || data.bills.length > 0 || data.repairs.length > 0;
  }, [data]);

  return {
    addCategory,
    getCategories,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    getDeletedProducts,
    addBill,
    getBills,
    addRepair,
    getRepairs,
    getAllData,
    clearData,
    hasData,
  };
};

export type { GuestProduct, GuestBill, GuestRepair, GuestData, GuestCategory };