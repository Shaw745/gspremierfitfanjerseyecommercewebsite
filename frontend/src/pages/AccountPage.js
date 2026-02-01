import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Package, Heart, MapPin, LogOut, ChevronRight } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatDate, API_URL } from '../lib/utils';
import { toast } from 'sonner';

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please sign in to view your account');
      navigate('/');
      return;
    }
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, wishlistRes] = await Promise.all([
        axios.get(`${API_URL}/orders`),
        axios.get(`${API_URL}/wishlist`),
      ]);
      setOrders(ordersRes.data.orders || []);
      setWishlist(wishlistRes.data.items || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'pending_payment': return 'bg-orange-100 text-orange-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_payment': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'pending_payment': return 'Pending Payment';
      case 'awaiting_payment': return 'Awaiting Payment';
      case 'processing': return 'Processing';
      case 'out_for_delivery': return 'Out for Delivery';
      default: return status?.charAt(0).toUpperCase() + status?.slice(1);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 px-6 md:px-12 bg-[#050505]">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-neutral-400 mb-2">Welcome back,</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white" data-testid="account-title">
                {user?.full_name?.toUpperCase()}
              </h1>
            </div>
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#050505]"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 mb-8">
              <TabsTrigger
                value="orders"
                className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-[#050505] rounded-none bg-transparent font-semibold uppercase tracking-wider text-sm"
                data-testid="tab-orders"
              >
                <Package className="w-4 h-4 mr-2" />
                Orders ({orders.length})
              </TabsTrigger>
              <TabsTrigger
                value="wishlist"
                className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-[#050505] rounded-none bg-transparent font-semibold uppercase tracking-wider text-sm"
                data-testid="tab-wishlist"
              >
                <Heart className="w-4 h-4 mr-2" />
                Wishlist ({wishlist.length})
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-[#050505] rounded-none bg-transparent font-semibold uppercase tracking-wider text-sm"
                data-testid="tab-profile"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" data-testid="orders-content">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-neutral-100 h-32 rounded" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                  <h3 className="text-xl font-bold mb-2">No orders yet</h3>
                  <p className="text-neutral-600 mb-6">Start shopping to see your orders here.</p>
                  <Button onClick={() => navigate('/shop')} data-testid="shop-now-orders-btn">
                    Shop Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border p-6"
                      data-testid={`order-${order.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <p className="font-mono text-sm text-neutral-500">Order #{order.reference}</p>
                          <p className="text-sm text-neutral-500">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(order.status)}>
                            {formatStatus(order.status)}
                          </Badge>
                          <Badge className={getPaymentStatusColor(order.payment_status)}>
                            {formatStatus(order.payment_status)}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Pending Payment Notice */}
                      {(order.payment_status === 'awaiting_payment' || order.status === 'pending_payment') && (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded mb-4">
                          <p className="text-orange-800 font-semibold text-sm">⏳ Payment Awaiting Verification</p>
                          <p className="text-orange-700 text-sm">
                            Your payment is being verified by our team. You'll receive an email confirmation once your payment is confirmed.
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4 mb-4">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="w-16 h-20 bg-neutral-100">
                              <img
                                src={item.product_image || 'https://via.placeholder.com/100'}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{item.product_name}</p>
                              <p className="text-xs text-neutral-500">
                                {item.size} / {item.color} × {item.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <p className="text-sm text-neutral-500">+{order.items.length - 3} more items</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <span className="font-bold">{formatPrice(order.total)}</span>
                        <Button variant="outline" size="sm">
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist" data-testid="wishlist-content">
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/4] bg-neutral-200 mb-4" />
                      <div className="h-4 bg-neutral-200 w-1/2 mb-2" />
                      <div className="h-5 bg-neutral-200 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : wishlist.length === 0 ? (
                <div className="text-center py-20">
                  <Heart className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Your wishlist is empty</h3>
                  <p className="text-neutral-600 mb-6">Save items you love to your wishlist.</p>
                  <Button onClick={() => navigate('/shop')} data-testid="shop-now-wishlist-btn">
                    Explore Products
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {wishlist.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" data-testid="profile-content">
              <div className="max-w-xl">
                <div className="space-y-6">
                  <div className="bg-neutral-50 p-6">
                    <h3 className="font-bold uppercase tracking-wider text-sm mb-4">Account Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-neutral-500">Full Name</p>
                        <p className="font-semibold">{user?.full_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Email</p>
                        <p className="font-semibold">{user?.email}</p>
                      </div>
                      {user?.phone && (
                        <div>
                          <p className="text-sm text-neutral-500">Phone</p>
                          <p className="font-semibold">{user.phone}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-neutral-500">Member Since</p>
                        <p className="font-semibold">{formatDate(user?.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AccountPage;
