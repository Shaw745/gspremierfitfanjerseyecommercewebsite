import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Building2, Bitcoin, Copy, Check, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, API_URL } from '../lib/utils';
import { toast } from 'sonner';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [cryptoRates, setCryptoRates] = useState({});
  const [orderResult, setOrderResult] = useState(null);
  const [copied, setCopied] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Don't pre-fill admin data - only use customer data
  const isAdmin = user?.is_admin || user?.email === 'admin@gspremierfitfan.com';
  
  const [shippingForm, setShippingForm] = useState({
    full_name: isAdmin ? '' : (user?.full_name || ''),
    email: isAdmin ? '' : (user?.email || ''),
    phone: isAdmin ? '' : (user?.phone || ''),
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
  });

  const [selectedPayment, setSelectedPayment] = useState('paystack');

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please sign in to checkout');
      navigate('/cart');
      return;
    }
    if (cart.items.length === 0 && !searchParams.get('reference')) {
      navigate('/cart');
      return;
    }
    fetchPaymentMethods();
    fetchCryptoRates();

    // Check for payment verification
    const reference = searchParams.get('reference');
    if (reference) {
      verifyPayment(reference);
    }
  }, [isAuthenticated, cart.items.length]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get(`${API_URL}/payment-methods`);
      setPaymentMethods(response.data.methods || []);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const fetchCryptoRates = async () => {
    try {
      const response = await axios.get(`${API_URL}/crypto/rates`);
      setCryptoRates(response.data);
    } catch (error) {
      console.error('Failed to fetch crypto rates:', error);
    }
  };

  const verifyPayment = async (reference) => {
    setLoading(true);
    try {
      const orderId = localStorage.getItem('pending_order_id');
      if (!orderId) {
        toast.error('Order not found');
        navigate('/cart');
        return;
      }

      const response = await axios.post(`${API_URL}/payments/verify`, {
        reference,
        order_id: orderId,
      });

      if (response.data.status === 'success') {
        toast.success('Payment successful!');
        localStorage.removeItem('pending_order_id');
        setStep(4);
        setOrderResult({ reference, status: 'paid' });
      } else {
        toast.error('Payment verification failed');
        setStep(3);
      }
    } catch (error) {
      toast.error('Payment verification failed');
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Nigerian phone number: +234 or 0 followed by 10 digits
    const phoneRegex = /^(\+234|0)[0-9]{10}$/;
    // Also allow international format
    const intlRegex = /^\+[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, '')) || intlRegex.test(phone.replace(/\s/g, ''));
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    // Validate required fields
    if (!shippingForm.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }

    if (!shippingForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(shippingForm.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!shippingForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(shippingForm.phone)) {
      errors.phone = 'Please enter a valid phone number (e.g., +2348012345678 or 08012345678)';
    }

    if (!shippingForm.address.trim()) {
      errors.address = 'Address is required';
    }

    if (!shippingForm.city.trim()) {
      errors.city = 'City is required';
    }

    if (!shippingForm.state.trim()) {
      errors.state = 'State is required';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setStep(2);
  };

  const handlePaymentSubmit = async () => {
    setLoading(true);
    try {
      const orderData = {
        shipping_address: shippingForm,
        payment_method: selectedPayment,
        items: cart.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
      };

      const response = await axios.post(`${API_URL}/orders`, orderData);
      const { order_id, reference, payment_info, payment_method } = response.data;

      localStorage.setItem('pending_order_id', order_id);
      setOrderResult({ order_id, reference, payment_info, payment_method });
      setStep(3);

      // Redirect to Paystack if selected
      if (payment_method === 'paystack' && payment_info?.authorization_url) {
        window.location.href = payment_info.authorization_url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(''), 2000);
  };

  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const handleConfirmPayment = async () => {
    setConfirmingPayment(true);
    
    // Simulate submission delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Show pending confirmation - admin will verify
    toast.success('Payment confirmation submitted! We will verify and update your order status.');
    clearCart();
    setStep(4);
    setConfirmingPayment(false);
  };

  const getCryptoAmount = (ngn, crypto) => {
    const rateMap = {
      'btc': cryptoRates?.bitcoin?.ngn,
      'eth': cryptoRates?.ethereum?.ngn,
      'usdt': cryptoRates?.tether?.ngn,
      'usdc': cryptoRates?.['usd-coin']?.ngn,
    };
    const rate = rateMap[crypto];
    if (!rate) return '...';
    return (ngn / rate).toFixed(crypto === 'btc' ? 8 : 4);
  };

  const getPaymentIcon = (method) => {
    if (method.includes('crypto')) return <Bitcoin className="w-5 h-5" />;
    if (method === 'bank_transfer') return <Building2 className="w-5 h-5" />;
    return <CreditCard className="w-5 h-5" />;
  };

  if (loading && !orderResult) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden">
        <Navbar />
        <div className="pt-32 pb-24 px-6 md:px-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 px-6 md:px-12 bg-[#050505]">
        <div className="max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white" data-testid="checkout-title">
              CHECKOUT
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Steps Indicator */}
      <section className="py-8 px-6 md:px-12 border-b">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-center gap-4 md:gap-8">
            {['Shipping', 'Payment', 'Confirm', 'Complete'].map((label, index) => (
              <div key={label} className="flex items-center gap-2 md:gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step > index + 1 ? 'bg-[#CCFF00] text-[#050505]' : step === index + 1 ? 'bg-[#050505] text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                  {step > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className={`hidden md:inline text-sm font-semibold uppercase tracking-wider ${step >= index + 1 ? 'text-[#050505]' : 'text-neutral-400'}`}>
                  {label}
                </span>
                {index < 3 && <ArrowRight className="w-4 h-4 text-neutral-300" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Form Area */}
            <div className="lg:col-span-2">
              {/* Step 1: Shipping */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">Shipping Information</h2>
                  <form onSubmit={handleShippingSubmit} className="space-y-6" data-testid="shipping-form">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          value={shippingForm.full_name}
                          onChange={(e) => {
                            setShippingForm({ ...shippingForm, full_name: e.target.value });
                            if (formErrors.full_name) setFormErrors({ ...formErrors, full_name: '' });
                          }}
                          className={formErrors.full_name ? 'border-red-500' : ''}
                          placeholder="Enter your full name"
                          data-testid="shipping-name-input"
                        />
                        {formErrors.full_name && <p className="text-red-500 text-sm mt-1">{formErrors.full_name}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={shippingForm.email}
                          onChange={(e) => {
                            setShippingForm({ ...shippingForm, email: e.target.value });
                            if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                          }}
                          className={formErrors.email ? 'border-red-500' : ''}
                          placeholder="your@email.com"
                          data-testid="shipping-email-input"
                        />
                        {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone * <span className="text-neutral-400 text-xs font-normal">(e.g., +2348012345678)</span></Label>
                      <Input
                        id="phone"
                        value={shippingForm.phone}
                        onChange={(e) => {
                          setShippingForm({ ...shippingForm, phone: e.target.value });
                          if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                        }}
                        className={formErrors.phone ? 'border-red-500' : ''}
                        placeholder="+2348012345678 or 08012345678"
                        data-testid="shipping-phone-input"
                      />
                      {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                    </div>
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={shippingForm.address}
                        onChange={(e) => {
                          setShippingForm({ ...shippingForm, address: e.target.value });
                          if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                        }}
                        className={formErrors.address ? 'border-red-500' : ''}
                        placeholder="Street address"
                        data-testid="shipping-address-input"
                      />
                      {formErrors.address && <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>}
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={shippingForm.city}
                          onChange={(e) => {
                            setShippingForm({ ...shippingForm, city: e.target.value });
                            if (formErrors.city) setFormErrors({ ...formErrors, city: '' });
                          }}
                          className={formErrors.city ? 'border-red-500' : ''}
                          placeholder="City"
                          data-testid="shipping-city-input"
                        />
                        {formErrors.city && <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>}
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={shippingForm.state}
                          onChange={(e) => {
                            setShippingForm({ ...shippingForm, state: e.target.value });
                            if (formErrors.state) setFormErrors({ ...formErrors, state: '' });
                          }}
                          className={formErrors.state ? 'border-red-500' : ''}
                          placeholder="State"
                          data-testid="shipping-state-input"
                        />
                        {formErrors.state && <p className="text-red-500 text-sm mt-1">{formErrors.state}</p>}
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={shippingForm.country}
                          disabled
                          data-testid="shipping-country-input"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full md:w-auto bg-[#050505] hover:bg-[#1a1a1a] text-white font-semibold uppercase tracking-wider"
                      data-testid="continue-to-payment-btn"
                    >
                      Continue to Payment
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* Step 2: Payment Method Selection */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">Payment Method</h2>
                  <RadioGroup
                    value={selectedPayment}
                    onValueChange={setSelectedPayment}
                    className="space-y-4"
                    data-testid="payment-method-select"
                  >
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${selectedPayment === method.id ? 'border-[#050505] bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}
                      >
                        <RadioGroupItem value={method.id} id={method.id} />
                        {getPaymentIcon(method.id)}
                        <span className="font-semibold">{method.name}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  <div className="flex gap-4 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      data-testid="back-to-shipping-btn"
                    >
                      Back
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1 bg-[#050505] hover:bg-[#1a1a1a] text-white font-semibold uppercase tracking-wider"
                      onClick={handlePaymentSubmit}
                      disabled={loading}
                      data-testid="place-order-btn"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Place Order'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment Instructions */}
              {step === 3 && orderResult && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">Complete Payment</h2>
                  <div className="bg-neutral-50 p-6 mb-6">
                    <p className="text-sm text-neutral-600 mb-2">Order Reference</p>
                    <p className="font-mono font-bold text-lg">{orderResult.reference}</p>
                  </div>

                  {/* Paystack Error Message */}
                  {orderResult.payment_method === 'paystack' && orderResult.payment_info?.error && (
                    <div className="bg-red-50 border border-red-200 p-6 mb-6 rounded" data-testid="paystack-error">
                      <h3 className="font-semibold text-red-700 mb-2">Payment Gateway Issue</h3>
                      <p className="text-red-600 mb-4">
                        We couldn't connect to the card payment system. Please use bank transfer or cryptocurrency instead.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setStep(2)}
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Choose Another Payment Method
                      </Button>
                    </div>
                  )}

                  {/* Paystack Redirect Info */}
                  {orderResult.payment_method === 'paystack' && orderResult.payment_info?.authorization_url && (
                    <div className="bg-blue-50 border border-blue-200 p-6 mb-6 rounded" data-testid="paystack-redirect">
                      <h3 className="font-semibold text-blue-700 mb-2">Redirecting to Payment...</h3>
                      <p className="text-blue-600 mb-4">
                        You will be redirected to Paystack to complete your card payment.
                      </p>
                      <Button
                        onClick={() => window.location.href = orderResult.payment_info.authorization_url}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay with Card Now
                      </Button>
                    </div>
                  )}

                  {/* Paystack - No Authorization URL (API key issue) */}
                  {orderResult.payment_method === 'paystack' && !orderResult.payment_info?.authorization_url && !orderResult.payment_info?.error && (
                    <div className="bg-yellow-50 border border-yellow-200 p-6 mb-6 rounded" data-testid="paystack-pending">
                      <h3 className="font-semibold text-yellow-700 mb-2">Card Payment Processing</h3>
                      <p className="text-yellow-600 mb-4">
                        Card payment is being set up. If you're not redirected automatically, please choose bank transfer.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setStep(2)}
                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      >
                        Choose Another Payment Method
                      </Button>
                    </div>
                  )}

                  {orderResult.payment_method === 'bank_transfer' && (
                    <div className="space-y-4" data-testid="bank-transfer-details">
                      <h3 className="font-semibold">Bank Transfer Details</h3>
                      <div className="bg-neutral-50 p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600">Bank Name</span>
                          <span className="font-semibold">{orderResult.payment_info?.bank_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{orderResult.payment_info?.account_number}</span>
                            <button
                              onClick={() => handleCopy(orderResult.payment_info?.account_number, 'account')}
                              className="p-1 hover:bg-neutral-200 rounded"
                            >
                              {copied === 'account' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600">Account Name</span>
                          <span className="font-semibold">{orderResult.payment_info?.account_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600">Amount</span>
                          <span className="font-bold text-lg">{formatPrice(orderResult.payment_info?.amount)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-600">
                        Please use <strong>{orderResult.reference}</strong> as payment reference.
                      </p>
                    </div>
                  )}

                  {orderResult.payment_method?.startsWith('crypto_') && (
                    <div className="space-y-4" data-testid="crypto-payment-details">
                      <h3 className="font-semibold">Crypto Payment Details</h3>
                      <div className="bg-neutral-50 p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600">Currency</span>
                          <span className="font-semibold">{orderResult.payment_info?.crypto_type}</span>
                        </div>
                        <div>
                          <span className="text-neutral-600 block mb-2">Wallet Address</span>
                          <div className="flex items-center gap-2 bg-white p-3 border">
                            <span className="font-mono text-sm break-all flex-1">{orderResult.payment_info?.wallet_address}</span>
                            <button
                              onClick={() => handleCopy(orderResult.payment_info?.wallet_address, 'wallet')}
                              className="p-2 hover:bg-neutral-100 rounded flex-shrink-0"
                            >
                              {copied === 'wallet' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600">Amount (NGN)</span>
                          <span className="font-bold">{formatPrice(orderResult.payment_info?.amount_ngn)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600">Approx. {orderResult.payment_info?.crypto_type}</span>
                          <span className="font-mono font-bold">
                            {getCryptoAmount(orderResult.payment_info?.amount_ngn, orderResult.payment_info?.crypto_type?.toLowerCase())}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-600">
                        Send the exact amount and include <strong>{orderResult.reference}</strong> in the memo if possible.
                      </p>
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="w-full mt-8 bg-[#CCFF00] text-[#050505] hover:bg-[#b8e600] font-semibold uppercase tracking-wider disabled:opacity-50"
                    onClick={handleConfirmPayment}
                    disabled={confirmingPayment}
                    data-testid="confirm-payment-btn"
                  >
                    {confirmingPayment ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "I've Made the Payment"
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Step 4: Success */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <div className="w-20 h-20 bg-[#CCFF00] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-[#050505]" />
                  </div>
                  <h2 className="text-3xl font-bold uppercase tracking-tight mb-4" data-testid="order-success-title">
                    Order Submitted!
                  </h2>
                  
                  {/* Order Reference */}
                  {orderResult?.reference && (
                    <div className="bg-neutral-100 inline-block px-6 py-3 rounded mb-6">
                      <p className="text-sm text-neutral-500">Order Reference</p>
                      <p className="font-mono font-bold text-lg">{orderResult.reference}</p>
                    </div>
                  )}
                  
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded max-w-md mx-auto mb-8">
                    <p className="text-yellow-800 font-semibold mb-1">⏳ Payment Pending Verification</p>
                    <p className="text-yellow-700 text-sm">
                      Our team will verify your payment and update your order status. 
                      You'll receive an email confirmation once verified.
                    </p>
                  </div>
                  
                  <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                    Thank you for your order! Keep your order reference safe for tracking.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => navigate('/account')}
                      className="bg-[#050505] hover:bg-[#1a1a1a] text-white font-semibold uppercase tracking-wider"
                      data-testid="view-orders-btn"
                    >
                      View My Orders
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/shop')}
                      data-testid="continue-shopping-success-btn"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            {step < 4 && (
              <div className="lg:col-span-1">
                <div className="bg-neutral-50 p-6 sticky top-24" data-testid="checkout-summary">
                  <h2 className="text-xl font-bold uppercase tracking-tight mb-6">Order Summary</h2>
                  <div className="space-y-4 mb-6">
                    {cart.items.map((item) => (
                      <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex gap-4">
                        <div className="w-16 h-20 bg-neutral-200 flex-shrink-0">
                          <img
                            src={item.product?.images?.[0] || 'https://via.placeholder.com/100'}
                            alt={item.product?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm line-clamp-1">{item.product?.name}</p>
                          <p className="text-neutral-500 text-xs">
                            {item.size} / {item.color} × {item.quantity}
                          </p>
                          <p className="font-semibold mt-1">{formatPrice(item.item_total || item.product?.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Subtotal</span>
                      <span className="font-semibold">{formatPrice(cart.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Shipping</span>
                      <span className="text-neutral-600">Free</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-lg">{formatPrice(cart.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
