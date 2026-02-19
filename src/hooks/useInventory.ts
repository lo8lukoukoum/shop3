import { useState, useEffect } from 'react';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
}

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);

  // Load data on mount
  useEffect(() => {
    const saved = localStorage.getItem('inventory_data');
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse inventory data', e);
      }
    }
  }, []);

  // Save data whenever products change
  useEffect(() => {
    localStorage.setItem('inventory_data', JSON.stringify(products));
  }, [products]);

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const findByBarcode = (barcode: string) => {
    return products.find(p => p.barcode === barcode);
  };

  const importData = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        setProducts(data);
        return true;
      }
    } catch (e) {
      console.error('Import failed', e);
    }
    return false;
  };

  const exportData = () => {
    return JSON.stringify(products, null, 2);
  };

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    findByBarcode,
    importData,
    exportData
  };
}
