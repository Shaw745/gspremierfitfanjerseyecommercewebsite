import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Share2, Truck, Shield, RefreshCw, Minus, Plus, Check, Star, ThumbsUp } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { API_URL, formatPrice, formatDate } from '../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';

const sizeGuide = {
  'XS': { chest: '86-91', waist: '71-76', hip: '86-91' },
  'S': { chest: '91-96', waist: '76-81', hip: '91-96' },
  'M': { chest: '96-101', waist: '81-86', hip: '96-101' },
  'L': { chest: '101-107', waist: '86-91', hip: '101-107' },
  'XL': { chest: '107-112', waist: '91-96', hip: '107-112' },
  'XXL': { chest: '112-117', waist: '96-101', hip: '112-117' },
};

const StarRating = ({ rating, onRate, interactive = false, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          onClick={() => interactive && onRate && onRate(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          disabled={!interactive}
        >
          <Star
            className={`${sizeClasses} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}`}
          />
        </button>
      ))}
    </div>
  );
};

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, total: 0, distribution: {} });
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products/${id}`);
      setProduct(response.data);
      if (response.data.colors?.length > 0) {
        setSelectedColor(response.data.colors[0]);
      }
      if (response.data.sizes?.length > 0) {
        setSelectedSize(response.data.sizes[0]);
      }
      // Fetch related products
      const relatedRes = await axios.get(`${API_URL}/products?sport=${response.data.sport}&limit=4`);
      setRelatedProducts(relatedRes.data.products.filter(p => p.id !== id).slice(0, 4));
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}/reviews`);
      setReviews(response.data.reviews || []);
      setReviewStats({
        average_rating: response.data.average_rating || 0,
        total: response.data.total || 0,
        distribution: response.data.distribution || {}
      });
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to write a review');
      return;
    }
    setSubmittingReview(true);
    try {
      await axios.post(`${API_URL}/products/${id}/reviews`, {
        product_id: id,
        ...newReview
      });
      toast.success('Review submitted successfully!');
      setReviewModalOpen(false);
      setNewReview({ rating: 5, title: '', comment: '' });
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await axios.post(`${API_URL}/reviews/${reviewId}/helpful`);
      fetchReviews();
    } catch (error) {
      console.error('Failed to mark helpful:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (!selectedColor) {
      toast.error('Please select a color');
      return;
    }
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity, selectedSize, selectedColor);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save items');
      return;
    }
    try {
      if (inWishlist) {
        await axios.delete(`${API_URL}/wishlist/${product.id}`);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await axios.post(`${API_URL}/wishlist/${product.id}`);
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const getColorHex = (color) => {
    const colorMap = {
      'white': '#ffffff',
      'black': '#050505',
      'red': '#ef4444',
      'navy': '#1e3a5f',
      'yellow': '#fbbf24',
      'neon green': '#CCFF00',
      'orange': '#f97316',
      'blue': '#3b82f6',
    };
    return colorMap[color.toLowerCase()] || color;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-24 px-6 md:px-12">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid md:grid-cols-2 gap-12 animate-pulse">
              <div className="aspect-square bg-neutral-200" />
              <div className="space-y-4">
                <div className="h-4 bg-neutral-200 w-1/4" />
                <div className="h-8 bg-neutral-200 w-3/4" />
                <div className="h-6 bg-neutral-200 w-1/3" />
                <div className="h-32 bg-neutral-200 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Breadcrumb */}
      <div className="pt-24 px-6 md:px-12 bg-neutral-50">
        <div className="max-w-[1400px] mx-auto py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-neutral-500 hover:text-[#050505]">Home</Link>
            <span className="text-neutral-400">/</span>
            <Link to="/shop" className="text-neutral-500 hover:text-[#050505]">Shop</Link>
            <span className="text-neutral-400">/</span>
            <span className="text-[#050505]">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <section className="py-12 px-6 md:px-12" data-testid="product-detail-section">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
            {/* Images */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aspect-square bg-neutral-100 overflow-hidden"
              >
                <img
                  src={product.images?.[selectedImage] || 'https://via.placeholder.com/600'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  data-testid="product-main-image"
                />
              </motion.div>
              {product.images?.length > 1 && (
                <div className="flex gap-4">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 border-2 overflow-hidden ${selectedImage === index ? 'border-[#050505]' : 'border-transparent'}`}
                      data-testid={`product-thumbnail-${index}`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-[#CCFF00] bg-[#050505] inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
                  {product.sport}
                </p>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-4" data-testid="product-name">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-2xl font-bold" data-testid="product-price">
                    {formatPrice(product.price)}
                  </span>
                  {product.compare_price && product.compare_price > product.price && (
                    <>
                      <span className="text-xl text-neutral-400 line-through">
                        {formatPrice(product.compare_price)}
                      </span>
                      <span className="bg-red-600 text-white px-2 py-1 text-xs font-semibold uppercase">
                        -{Math.round((1 - product.price / product.compare_price) * 100)}%
                      </span>
                    </>
                  )}
                </div>
                <p className="text-neutral-600 leading-relaxed mb-8" data-testid="product-description">
                  {product.description}
                </p>

                {/* Color Selection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold uppercase tracking-wider text-sm">
                      Color: <span className="font-normal normal-case">{selectedColor}</span>
                    </span>
                  </div>
                  <div className="flex gap-3">
                    {product.colors?.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${selectedColor === color ? 'border-[#050505]' : 'border-neutral-300'}`}
                        style={{ backgroundColor: getColorHex(color) }}
                        title={color}
                        data-testid={`color-${color.toLowerCase().replace(' ', '-')}`}
                      >
                        {selectedColor === color && (
                          <Check className={`w-5 h-5 ${color.toLowerCase() === 'white' || color.toLowerCase() === 'yellow' ? 'text-[#050505]' : 'text-white'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold uppercase tracking-wider text-sm">
                      Size: <span className="font-normal">{selectedSize}</span>
                    </span>
                    <button
                      onClick={() => setSizeGuideOpen(true)}
                      className="text-sm text-neutral-600 hover:text-[#050505] underline"
                      data-testid="size-guide-btn"
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes?.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[50px] h-12 px-4 border font-semibold uppercase tracking-wider text-sm transition-colors ${
                          selectedSize === size
                            ? 'bg-[#050505] text-white border-[#050505]'
                            : 'bg-white text-[#050505] border-neutral-300 hover:border-[#050505]'
                        }`}
                        data-testid={`size-${size}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-8">
                  <span className="font-semibold uppercase tracking-wider text-sm mb-3 block">
                    Quantity
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-neutral-300">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                        data-testid="quantity-decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-semibold" data-testid="quantity-value">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-12 h-12 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                        data-testid="quantity-increase"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-neutral-500">
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mb-8">
                  <Button
                    size="lg"
                    className="flex-1 bg-[#050505] hover:bg-[#1a1a1a] text-white font-semibold uppercase tracking-wider py-6"
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.stock === 0}
                    data-testid="add-to-cart-btn"
                  >
                    {addingToCart ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className={`px-6 ${inWishlist ? 'bg-red-50 border-red-500 text-red-500' : ''}`}
                    onClick={handleToggleWishlist}
                    data-testid="wishlist-btn"
                  >
                    <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-6"
                    data-testid="share-btn"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 py-6 border-t border-b">
                  <div className="text-center">
                    <Truck className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Free Shipping</span>
                  </div>
                  <div className="text-center">
                    <Shield className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Secure Payment</span>
                  </div>
                  <div className="text-center">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Easy Returns</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Info Tabs */}
      <section className="py-12 px-6 md:px-12 bg-neutral-50">
        <div className="max-w-[1400px] mx-auto">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0">
              <TabsTrigger
                value="description"
                className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-[#050505] rounded-none bg-transparent font-semibold uppercase tracking-wider text-sm"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-[#050505] rounded-none bg-transparent font-semibold uppercase tracking-wider text-sm"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-[#050505] rounded-none bg-transparent font-semibold uppercase tracking-wider text-sm"
              >
                Shipping
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-[#050505] rounded-none bg-transparent font-semibold uppercase tracking-wider text-sm"
              >
                Reviews ({reviewStats.total})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="py-8">
              <p className="text-neutral-600 leading-relaxed max-w-3xl">
                {product.description}
              </p>
            </TabsContent>
            <TabsContent value="details" className="py-8">
              <ul className="space-y-2 text-neutral-600">
                <li>• Category: <span className="capitalize">{product.category}</span></li>
                <li>• Sport: {product.sport}</li>
                <li>• Available Sizes: {product.sizes?.join(', ')}</li>
                <li>• Available Colors: {product.colors?.join(', ')}</li>
                {product.collection && <li>• Collection: {product.collection}</li>}
              </ul>
            </TabsContent>
            <TabsContent value="shipping" className="py-8">
              <div className="space-y-4 text-neutral-600 max-w-3xl">
                <p>Free standard shipping on all orders over ₦50,000.</p>
                <p>Standard delivery: 3-5 business days</p>
                <p>Express delivery: 1-2 business days (additional fee applies)</p>
                <p>International shipping available to select countries.</p>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="py-8">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Rating Summary */}
                <div className="bg-white p-6 border">
                  <div className="text-center mb-4">
                    <p className="text-5xl font-black">{reviewStats.average_rating || 0}</p>
                    <StarRating rating={reviewStats.average_rating} size="lg" />
                    <p className="text-sm text-neutral-500 mt-2">{reviewStats.total} reviews</p>
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-sm w-3">{star}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <Progress 
                          value={reviewStats.total ? (reviewStats.distribution[star] / reviewStats.total) * 100 : 0} 
                          className="flex-1 h-2"
                        />
                        <span className="text-sm text-neutral-500 w-8">{reviewStats.distribution[star] || 0}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-6 bg-[#050505] hover:bg-[#1a1a1a] text-white"
                    onClick={() => setReviewModalOpen(true)}
                    data-testid="write-review-btn"
                  >
                    Write a Review
                  </Button>
                </div>

                {/* Reviews List */}
                <div className="md:col-span-2 space-y-6">
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-neutral-500">No reviews yet. Be the first to review this product!</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b pb-6" data-testid={`review-${review.id}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <StarRating rating={review.rating} size="sm" />
                              {review.verified_purchase && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold mt-1">{review.title}</h4>
                          </div>
                          <span className="text-sm text-neutral-500">{formatDate(review.created_at)}</span>
                        </div>
                        <p className="text-neutral-600 mb-3">{review.comment}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-500">by {review.user_name}</span>
                          <button 
                            onClick={() => handleMarkHelpful(review.id)}
                            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-[#050505]"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Helpful ({review.helpful_count || 0})
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-24 px-6 md:px-12" data-testid="related-products-section">
          <div className="max-w-[1400px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-12">
              YOU MAY ALSO LIKE
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      <Dialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">SIZE GUIDE</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-neutral-600 mb-4">All measurements are in centimeters (cm)</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border p-3 text-left font-semibold">Size</th>
                  <th className="border p-3 text-left font-semibold">Chest</th>
                  <th className="border p-3 text-left font-semibold">Waist</th>
                  <th className="border p-3 text-left font-semibold">Hip</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sizeGuide).map(([size, measurements]) => (
                  <tr key={size} className={selectedSize === size ? 'bg-[#CCFF00]/20' : ''}>
                    <td className="border p-3 font-semibold">{size}</td>
                    <td className="border p-3">{measurements.chest}</td>
                    <td className="border p-3">{measurements.waist}</td>
                    <td className="border p-3">{measurements.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProductPage;
