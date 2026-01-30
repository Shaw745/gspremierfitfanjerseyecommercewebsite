import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { Badge } from '../../components/ui/badge';
import { formatPrice, formatDate, API_URL } from '../../lib/utils';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: 'Total Revenue',
      value: formatPrice(analytics?.total_revenue || 0),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      label: 'Total Orders',
      value: analytics?.total_orders || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Products',
      value: analytics?.total_products || 0,
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      label: 'Total Customers',
      value: analytics?.total_customers || 0,
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="admin-stats">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-neutral-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{loading ? '...' : stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm" data-testid="recent-orders">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Orders</h2>
            <a href="/admin/orders" className="text-sm text-[#CCFF00] bg-[#050505] px-3 py-1 rounded flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4">
                    <div className="w-12 h-12 bg-neutral-200 rounded" />
                    <div className="flex-1">
                      <div className="h-4 bg-neutral-200 w-1/2 mb-2" />
                      <div className="h-3 bg-neutral-200 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : analytics?.recent_orders?.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {analytics?.recent_orders?.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-mono text-sm">{order.reference}</p>
                      <p className="text-xs text-neutral-500">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(order.total)}</p>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm" data-testid="order-stats">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold">Order Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Pending Orders</span>
                <span className="font-bold text-yellow-600">{analytics?.pending_orders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Confirmed Orders</span>
                <span className="font-bold text-green-600">{analytics?.confirmed_orders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Total Orders</span>
                <span className="font-bold">{analytics?.total_orders || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
