import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, OrderItem } from '../types';

export interface CartItem extends OrderItem {
  cartItemId: string;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: Product, 
    quantity?: number, 
    selectedOption?: string, 
    targetNote?: string,
    customPrice?: number,
    customImage?: string
  ) => void;
  removeFromCart: (cartItemIdOrProductId: string) => void;
  updateQuantity: (cartItemIdOrProductId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
  totalItemsCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('angusshop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('angusshop_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const isMasteryItem = (name: string, productId?: string) => {
    return (
      productId === 'prod_farm_mastery_100' ||
      name.includes('ฟาร์มมาสเตอร์รี่') ||
      name.includes('มาสเตอร์รี่') ||
      name.includes('Mastery') ||
      name.includes('มาส')
    );
  };

  const getItemMaxQty = (stock: number, name: string, productId?: string) => {
    if (isMasteryItem(name, productId)) {
      return Math.min(stock, 6); // Max 600 mastery (6 x 100)
    }
    return stock;
  };

  const addToCart = (
    product: Product, 
    quantity = 1, 
    selectedOption?: string, 
    targetNote?: string,
    customPrice?: number,
    customImage?: string
  ) => {
    setItems((prev) => {
      const cartItemId = selectedOption 
        ? `${product.productId}_${selectedOption}` 
        : product.productId;
      const displayName = product.name;

      const maxLimit = getItemMaxQty(product.stock, product.name, product.productId);
      const existingIndex = prev.findIndex((item) => item.cartItemId === cartItemId || (!item.cartItemId && item.productId === cartItemId));
      
      const finalPrice = customPrice !== undefined ? customPrice : product.price;
      const finalImage = customImage || product.image;

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(maxLimit, updated[existingIndex].quantity + quantity);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          price: finalPrice,
          image: finalImage,
          targetNote: targetNote || updated[existingIndex].targetNote,
        };
        return updated;
      } else {
        const initialQty = Math.min(maxLimit, Math.max(1, quantity));
        return [
          ...prev,
          {
            cartItemId,
            productId: product.productId,
            name: displayName,
            slug: product.slug,
            price: finalPrice,
            quantity: initialQty,
            image: finalImage,
            deliveryType: product.deliveryType,
            stock: product.stock,
            selectedOption: selectedOption || undefined,
            targetNote: targetNote || undefined,
            deliveryInstructions: product.deliveryInstructions,
            instructionsTitle: product.instructionsTitle,
            tradeServerLink: product.tradeServerLink,
            serverLinkTitle: product.serverLinkTitle,
            claimCode: product.claimCode,
            claimCodeTitle: product.claimCodeTitle,
          },
        ];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemIdOrProductId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemIdOrProductId && item.productId !== cartItemIdOrProductId));
  };

  const updateQuantity = (cartItemIdOrProductId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemIdOrProductId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemIdOrProductId || (!item.cartItemId && item.productId === cartItemIdOrProductId)) {
          const maxLimit = getItemMaxQty(item.stock, item.name, item.productId);
          return { ...item, quantity: Math.min(maxLimit, quantity) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal;
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        total,
        totalItemsCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
