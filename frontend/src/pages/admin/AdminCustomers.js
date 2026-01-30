import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Mail, Phone } from 'lucide-react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { Input } from '../../components/ui/input';
import { formatDate, API_URL } from '../../lib/utils';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/customers`);
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Customers">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="customer-search-input"
          />
        </div>
        <p className="text-neutral-500">
          {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Customers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="customers-grid">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-neutral-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-neutral-200 w-32 mb-2 rounded" />
                  <div className="h-3 bg-neutral-200 w-24 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-neutral-500">
            No customers found
          </div>
        ) : (
          filteredCustomers.map((customer, index) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-lg shadow-sm"
              data-testid={`customer-card-${customer.id}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#CCFF00] rounded-full flex items-center justify-center text-[#050505] font-bold text-lg">
                  {customer.full_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{customer.full_name}</p>
                  <p className="text-xs text-neutral-500">
                    Member since {formatDate(customer.created_at)}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-neutral-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;
