import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/utils';
import { toast } from 'sonner';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateCartItem, removeFromCart, loading } = useCart();
  const { isAuthenticated } = useAuth();

  const handleQuantityChange = async (item, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(item.product_id, newQuantity, item.size, item.color);
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemove = async (item) => {
    try {
      await removeFromCart(item.product_id, item.size, item.color);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to checkout');
      return;
    }
    navigate('/checkout');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden">
        <Navbar />
        <div className="pt-32 pb-24 px-6 md:px-12">
          <div className="max-w-[1400px] mx-auto text-center">
            <ShoppingBag className="w-20 h-20 mx-auto text-neutral-300 mb-6" />
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">
              YOUR CART IS EMPTY
            </h1>
            <p className="text-neutral-600 mb-8">
              Please sign in to view your cart
            </p>
            <Link to="/shop">
              <Button
                size="lg"
                className="bg-[#050505] hover:bg-[#1a1a1a] text-white font-semibold uppercase tracking-wider"
                data-testid="continue-shopping-btn"
              >
                Continue Shopping
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden">
        <Navbar />
        <div className="pt-32 pb-24 px-6 md:px-12">
          <div className="max-w-[1400px] mx-auto text-center">
            <ShoppingBag className="w-20 h-20 mx-auto text-neutral-300 mb-6" />
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">
              YOUR CART IS EMPTY
            </h1>
            <p className="text-neutral-600 mb-8">
              Looks like you haven't added any items yet.
            </p>
            <Link to="/shop">
              <Button
                size="lg"
                className="bg-[#050505] hover:bg-[#1a1a1a] text-white font-semibold uppercase tracking-wider"
                data-testid="continue-shopping-btn"
              >
                Continue Shopping
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 px-6 md:px-12 bg-[#050505]">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white" data-testid="cart-title">
              YOUR CART
            </h1>
            <p className="text-neutral-400 mt-2">
              {cart.items.length} item{cart.items.length !== 1 ? 's' : ''}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-12 px-6 md:px-12" data-testid="cart-content">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {cart.items.map((item, index) => (
                  <motion.div
                    key={`${item.product_id}-${item.size}-${item.color}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-6 pb-6 border-b border-neutral-200"
                    data-testid={`cart-item-${item.product_id}`}
                  >
                    {/* Image */}
                    <Link to={`/product/${item.product_id}`} className="w-24 h-32 md:w-32 md:h-40 flex-shrink-0 bg-neutral-100">
                      <img
                        src={item.product?.images?.[0] || 'https://via.placeholder.com/200'}
                        alt={item.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <Link to={`/product/${item.product_id}`}>
                          <h3 className="font-bold text-lg uppercase tracking-tight hover:underline">
                            {item.product?.name}
                          </h3>
                        </Link>
                        <p className="text-neutral-500 text-sm mt-1">
                          Size: {item.size} | Color: {item.color}
                        </p>
                        <p className="font-semibold mt-2">
                          {formatPrice(item.product?.price || 0)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-neutral-300">
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                            disabled={loading}
                            data-testid={`quantity-decrease-${item.product_id}`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                            disabled={loading}
                            data-testid={`quantity-increase-${item.product_id}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-bold">
                            {formatPrice(item.item_total || item.product?.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => handleRemove(item)}
                            className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                            disabled={loading}
                            data-testid={`remove-item-${item.product_id}`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Link to="/shop" className="inline-flex items-center gap-2 mt-8 text-neutral-600 hover:text-[#050505] transition-colors">
                <ArrowRight className="w-4 h-4 rotate-180" />
                Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-neutral-50 p-6 sticky top-24" data-testid="order-summary">
                <h2 className="text-xl font-bold uppercase tracking-tight mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal</span>
                    <span className="font-semibold">{formatPrice(cart.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Shipping</span>
                    <span className="text-neutral-600">Calculated at checkout</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg" data-testid="cart-total">{formatPrice(cart.total)}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-[#050505] hover:bg-[#1a1a1a] text-white font-semibold uppercase tracking-wider py-6"
                  onClick={handleCheckout}
                  data-testid="checkout-btn"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <p className="text-xs text-neutral-500 text-center mt-4">
                  Taxes and shipping calculated at checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CartPage;
