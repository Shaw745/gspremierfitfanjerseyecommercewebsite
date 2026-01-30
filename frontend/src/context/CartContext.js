import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../lib/utils';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Use local storage for non-authenticated users
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        setCart(JSON.parse(localCart));
      }
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/cart`);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity, size, color) => {
    if (isAuthenticated) {
      try {
        await axios.post(`${API_URL}/cart/add`, { product_id: productId, quantity, size, color });
        await fetchCart();
      } catch (error) {
        console.error('Failed to add to cart:', error);
        throw error;
      }
    } else {
      // Local storage fallback
      const newCart = { ...cart };
      const existingIndex = newCart.items.findIndex(
        item => item.product_id === productId && item.size === size && item.color === color
      );
      if (existingIndex > -1) {
        newCart.items[existingIndex].quantity += quantity;
      } else {
        newCart.items.push({ product_id: productId, quantity, size, color });
      }
      localStorage.setItem('cart', JSON.stringify(newCart));
      setCart(newCart);
    }
  };

  const updateCartItem = async (productId, quantity, size, color) => {
    if (isAuthenticated) {
      try {
        await axios.put(`${API_URL}/cart/update`, { product_id: productId, quantity, size, color });
        await fetchCart();
      } catch (error) {
        console.error('Failed to update cart:', error);
        throw error;
      }
    }
  };

  const removeFromCart = async (productId, size, color) => {
    await updateCartItem(productId, 0, size, color);
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await axios.delete(`${API_URL}/cart/clear`);
        setCart({ items: [], total: 0 });
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    } else {
      localStorage.removeItem('cart');
      setCart({ items: [], total: 0 });
    }
  };

  const cartCount = cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateCartItem, removeFromCart, clearCart, fetchCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};
