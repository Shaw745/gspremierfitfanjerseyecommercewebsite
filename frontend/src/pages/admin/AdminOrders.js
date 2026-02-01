import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Truck, Package, CheckCircle, Clock, Loader2 } from 'lucide-react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { formatPrice, formatDate, API_URL } from '../../lib/utils';
import { toast } from 'sonner';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    status: '',
    tracking_number: '',
    tracking_url: '',
    carrier: '',
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await axios.get(`${API_URL}/admin/orders?${params.toString()}`);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const openTrackingModal = (order) => {
    setSelectedOrder(order);
    setTrackingForm({
      status: order.status,
      tracking_number: order.tracking_number || '',
      tracking_url: order.tracking_url || '',
      carrier: order.carrier || '',
      notes: ''
    });
    setTrackingModalOpen(true);
  };

  const handleUpdateWithTracking = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/admin/orders/${selectedOrder.id}`, trackingForm);
      toast.success('Order updated with tracking info');
      setTrackingModalOpen(false);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/admin/orders/${orderId}`, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleConfirmPayment = async (orderId) => {
    try {
      setConfirmingPayment(orderId);
      await axios.post(`${API_URL}/admin/orders/${orderId}/confirm-payment`);
      toast.success('Payment confirmed! Customer has been notified via email.');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: 'paid', status: 'processing' });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to confirm payment');
    } finally {
      setConfirmingPayment(null);
    }
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

  const formatPaymentStatus = (status) => {
    switch (status) {
      case 'awaiting_payment': return 'Awaiting Payment';
      case 'pending': return 'Pending';
      case 'paid': return 'Paid';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  const formatOrderStatus = (status) => {
    switch (status) {
      case 'pending_payment': return 'Pending Payment';
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'confirmed': return 'Confirmed';
      case 'shipped': return 'Shipped';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <AdminLayout title="Orders">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-neutral-500">
          {orders.length} order{orders.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Orders Table - Responsive wrapper */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden" data-testid="orders-table">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left p-4 font-semibold text-sm">Order</th>
              <th className="text-left p-4 font-semibold text-sm">Customer</th>
              <th className="text-left p-4 font-semibold text-sm">Total</th>
              <th className="text-left p-4 font-semibold text-sm">Payment</th>
              <th className="text-left p-4 font-semibold text-sm">Status</th>
              <th className="text-left p-4 font-semibold text-sm">Date</th>
              <th className="text-right p-4 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-t animate-pulse">
                  <td className="p-4"><div className="h-4 bg-neutral-200 w-24 rounded" /></td>
                  <td className="p-4"><div className="h-4 bg-neutral-200 w-32 rounded" /></td>
                  <td className="p-4"><div className="h-4 bg-neutral-200 w-20 rounded" /></td>
                  <td className="p-4"><div className="h-4 bg-neutral-200 w-16 rounded" /></td>
                  <td className="p-4"><div className="h-4 bg-neutral-200 w-20 rounded" /></td>
                  <td className="p-4"><div className="h-4 bg-neutral-200 w-24 rounded" /></td>
                  <td className="p-4"><div className="h-4 bg-neutral-200 w-16 rounded ml-auto" /></td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-neutral-500">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t hover:bg-neutral-50"
                  data-testid={`order-row-${order.id}`}
                >
                  <td className="p-4">
                    <p className="font-mono font-semibold">{order.reference}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold">{order.shipping_address?.full_name}</p>
                    <p className="text-xs text-neutral-500">{order.user_email}</p>
                  </td>
                  <td className="p-4 font-semibold">{formatPrice(order.total)}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <Badge className={getPaymentStatusColor(order.payment_status)}>
                        {formatPaymentStatus(order.payment_status)}
                      </Badge>
                      {/* Show Confirm Payment button for awaiting_payment orders */}
                      {(order.payment_status === 'awaiting_payment' || 
                        (order.payment_status === 'pending' && 
                         (order.payment_method === 'bank_transfer' || order.payment_method?.startsWith('crypto_')))) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConfirmPayment(order.id)}
                          disabled={confirmingPayment === order.id}
                          className="text-xs h-7 border-green-500 text-green-700 hover:bg-green-50"
                          data-testid={`confirm-payment-${order.id}`}
                        >
                          {confirmingPayment === order.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              Confirming...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Confirm Payment
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleUpdateStatus(order.id, value)}
                    >
                      <SelectTrigger className={`w-36 ${getStatusColor(order.status)}`}>
                        <SelectValue>{formatOrderStatus(order.status)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending_payment">Pending Payment</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4 text-sm text-neutral-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTrackingModal(order)}
                        data-testid={`tracking-order-${order.id}`}
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        Tracking
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        data-testid={`view-order-${order.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Tracking Modal */}
      <Dialog open={trackingModalOpen} onOpenChange={setTrackingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Update Tracking - {selectedOrder?.reference}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateWithTracking} className="space-y-4 mt-4">
            <div>
              <Label>Status</Label>
              <Select
                value={trackingForm.status}
                onValueChange={(value) => setTrackingForm({ ...trackingForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Carrier</Label>
              <Input
                value={trackingForm.carrier}
                onChange={(e) => setTrackingForm({ ...trackingForm, carrier: e.target.value })}
                placeholder="e.g., DHL, FedEx, GIG Logistics"
              />
            </div>
            <div>
              <Label>Tracking Number</Label>
              <Input
                value={trackingForm.tracking_number}
                onChange={(e) => setTrackingForm({ ...trackingForm, tracking_number: e.target.value })}
                placeholder="Enter tracking number"
              />
            </div>
            <div>
              <Label>Tracking URL</Label>
              <Input
                value={trackingForm.tracking_url}
                onChange={(e) => setTrackingForm({ ...trackingForm, tracking_url: e.target.value })}
                placeholder="https://tracking.example.com/..."
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={trackingForm.notes}
                onChange={(e) => setTrackingForm({ ...trackingForm, notes: e.target.value })}
                placeholder="Optional notes for customer"
              />
            </div>
            <Button type="submit" className="w-full bg-[#050505] hover:bg-[#1a1a1a] text-white">
              Update Order
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.reference}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Status */}
              <div className="flex gap-4">
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
                <Badge className={getPaymentStatusColor(selectedOrder.payment_status)}>
                  Payment: {selectedOrder.payment_status}
                </Badge>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 bg-neutral-50">
                      <div className="w-16 h-20 bg-neutral-200">
                        <img
                          src={item.product_image || 'https://via.placeholder.com/100'}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.product_name}</p>
                        <p className="text-sm text-neutral-500">
                          Size: {item.size} | Color: {item.color}
                        </p>
                        <p className="text-sm">
                          {formatPrice(item.unit_price)} × {item.quantity} = {formatPrice(item.item_total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold mb-3">Shipping Address</h3>
                <div className="p-3 bg-neutral-50">
                  <p className="font-semibold">{selectedOrder.shipping_address?.full_name}</p>
                  <p>{selectedOrder.shipping_address?.address}</p>
                  <p>{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state}</p>
                  <p>{selectedOrder.shipping_address?.country}</p>
                  <p className="mt-2">Phone: {selectedOrder.shipping_address?.phone}</p>
                  <p>Email: {selectedOrder.shipping_address?.email}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold mb-3">Payment</h3>
                <div className="p-3 bg-neutral-50">
                  <p>Method: <span className="capitalize">{selectedOrder.payment_method?.replace('_', ' ')}</span></p>
                  <p className="font-bold text-lg mt-2">Total: {formatPrice(selectedOrder.total)}</p>
                </div>
              </div>

              {/* Update Status */}
              <div className="flex items-center gap-4">
                <span className="font-semibold">Update Status:</span>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => handleUpdateStatus(selectedOrder.id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
