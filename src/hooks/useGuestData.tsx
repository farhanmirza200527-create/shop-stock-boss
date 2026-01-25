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
  return_amount?: number;
  discount?: number;
  tax?: number;
  bill_items: any[];
  payment_mode?: string;
  bill_status?: string;
  bill_number?: string;
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

interface GuestPaymentHistory {
  id: string;
  entry_type: 'PENDING_ADD' | 'PAYMENT_RECEIVED' | 'ADVANCE_ADD' | 'ADJUSTMENT';
  amount: number;
  note?: string;
  created_at: string;
}

interface GuestPendingPayment {
  id: string;
  customer_name: string;
  customer_phone?: string;
  total_pending: number;
  total_advance: number;
  history: GuestPaymentHistory[];
  created_at: string;
}

interface GuestData {
  categories: GuestCategory[];
  products: GuestProduct[];
  bills: GuestBill[];
  repairs: GuestRepair[];
  pendingPayments: GuestPendingPayment[];
}

const GUEST_DATA_KEY = 'guestData';

const getInitialData = (): GuestData => {
  try {
    const stored = localStorage.getItem(GUEST_DATA_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all arrays exist for older data
      return {
        categories: parsed.categories || [],
        products: parsed.products || [],
        bills: parsed.bills || [],
        repairs: parsed.repairs || [],
        pendingPayments: parsed.pendingPayments || [],
      };
    }
  } catch (error) {
    console.error('Error reading guest data:', error);
  }
  return { categories: [], products: [], bills: [], repairs: [], pendingPayments: [] };
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

  const updateBill = useCallback((id: string, updates: Partial<GuestBill>) => {
    setData(prev => ({
      ...prev,
      bills: prev.bills.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  }, []);

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

  // Pending Payments
  const getPendingPayments = useCallback(() => data.pendingPayments, [data.pendingPayments]);

  const getPaymentHistory = useCallback((customerId: string) => {
    const customer = data.pendingPayments.find(p => p.id === customerId);
    return customer?.history || [];
  }, [data.pendingPayments]);

  const addPendingPayment = useCallback((
    customerName: string,
    customerPhone: string,
    amount: number,
    note: string
  ) => {
    const existingIndex = data.pendingPayments.findIndex(
      p => p.customer_name === customerName
    );

    if (existingIndex >= 0) {
      const existing = data.pendingPayments[existingIndex];
      let actualPendingAmount = amount;
      const newHistory: GuestPaymentHistory[] = [];

      // Auto-adjust with advance
      if (existing.total_advance > 0) {
        if (existing.total_advance >= amount) {
          // Advance covers entire pending
          setData(prev => ({
            ...prev,
            pendingPayments: prev.pendingPayments.map((p, i) =>
              i === existingIndex
                ? {
                    ...p,
                    total_advance: p.total_advance - amount,
                    history: [
                      {
                        id: generateId(),
                        entry_type: 'ADJUSTMENT' as const,
                        amount,
                        note: `Advance adjusted automatically`,
                        created_at: new Date().toISOString(),
                      },
                      ...p.history,
                    ],
                  }
                : p
            ),
          }));
          return { adjusted: true };
        } else {
          actualPendingAmount = amount - existing.total_advance;
          newHistory.push({
            id: generateId(),
            entry_type: 'ADJUSTMENT' as const,
            amount: existing.total_advance,
            note: `Advance of ₹${existing.total_advance} adjusted`,
            created_at: new Date().toISOString(),
          });
        }
      }

      if (actualPendingAmount > 0) {
        newHistory.push({
          id: generateId(),
          entry_type: 'PENDING_ADD' as const,
          amount: actualPendingAmount,
          note: note || undefined,
          created_at: new Date().toISOString(),
        });
      }

      setData(prev => ({
        ...prev,
        pendingPayments: prev.pendingPayments.map((p, i) =>
          i === existingIndex
            ? {
                ...p,
                total_pending: p.total_pending + actualPendingAmount,
                total_advance: existing.total_advance >= amount ? p.total_advance : 0,
                history: [...newHistory, ...p.history],
              }
            : p
        ),
      }));
    } else {
      // New customer
      const newPayment: GuestPendingPayment = {
        id: generateId(),
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        total_pending: amount,
        total_advance: 0,
        history: [
          {
            id: generateId(),
            entry_type: 'PENDING_ADD' as const,
            amount,
            note: note || undefined,
            created_at: new Date().toISOString(),
          },
        ],
        created_at: new Date().toISOString(),
      };
      setData(prev => ({
        ...prev,
        pendingPayments: [newPayment, ...prev.pendingPayments],
      }));
    }
    return { success: true };
  }, [data.pendingPayments]);

  const receivePayment = useCallback((customerId: string, amount: number) => {
    let extra = 0;
    setData(prev => ({
      ...prev,
      pendingPayments: prev.pendingPayments.map(p => {
        if (p.id !== customerId) return p;

        let newPending = p.total_pending;
        let newAdvance = p.total_advance;

        if (amount <= p.total_pending) {
          newPending = p.total_pending - amount;
        } else {
          extra = amount - p.total_pending;
          newPending = 0;
          newAdvance = p.total_advance + extra;
        }

        return {
          ...p,
          total_pending: newPending,
          total_advance: newAdvance,
          history: [
            {
              id: generateId(),
              entry_type: 'PAYMENT_RECEIVED' as const,
              amount,
              note: extra > 0 ? `Excess ₹${extra} added to advance` : undefined,
              created_at: new Date().toISOString(),
            },
            ...p.history,
          ],
        };
      }),
    }));
    return { extra };
  }, []);

  const addAdvance = useCallback((
    customerId: string | undefined,
    customerName: string,
    customerPhone: string,
    amount: number
  ) => {
    if (customerId) {
      setData(prev => ({
        ...prev,
        pendingPayments: prev.pendingPayments.map(p =>
          p.id === customerId
            ? {
                ...p,
                total_advance: p.total_advance + amount,
                history: [
                  {
                    id: generateId(),
                    entry_type: 'ADVANCE_ADD' as const,
                    amount,
                    created_at: new Date().toISOString(),
                  },
                  ...p.history,
                ],
              }
            : p
        ),
      }));
    } else {
      const newPayment: GuestPendingPayment = {
        id: generateId(),
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        total_pending: 0,
        total_advance: amount,
        history: [
          {
            id: generateId(),
            entry_type: 'ADVANCE_ADD' as const,
            amount,
            created_at: new Date().toISOString(),
          },
        ],
        created_at: new Date().toISOString(),
      };
      setData(prev => ({
        ...prev,
        pendingPayments: [newPayment, ...prev.pendingPayments],
      }));
    }
    return { success: true };
  }, []);

  // Get all data for migration
  const getAllData = useCallback(() => data, [data]);

  // Clear all guest data
  const clearData = useCallback(() => {
    setData({ categories: [], products: [], bills: [], repairs: [], pendingPayments: [] });
    localStorage.removeItem(GUEST_DATA_KEY);
  }, []);

  // Check if there's any guest data
  const hasData = useCallback(() => {
    return data.products.length > 0 || data.bills.length > 0 || data.repairs.length > 0 || data.pendingPayments.length > 0;
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
    updateBill,
    addRepair,
    getRepairs,
    getPendingPayments,
    getPaymentHistory,
    addPendingPayment,
    receivePayment,
    addAdvance,
    getAllData,
    clearData,
    hasData,
  };
};

export type { GuestProduct, GuestBill, GuestRepair, GuestData, GuestCategory, GuestPendingPayment, GuestPaymentHistory };