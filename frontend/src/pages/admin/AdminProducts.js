import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
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
import { formatPrice, API_URL } from '../../lib/utils';
import { toast } from 'sonner';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    category: 'jerseys',
    sport: 'Football',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White'],
    images: [''],
    stock: '',
    featured: false,
    collection: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products?limit=100`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        compare_price: product.compare_price?.toString() || '',
        category: product.category,
        sport: product.sport,
        sizes: product.sizes,
        colors: product.colors,
        images: product.images.length > 0 ? product.images : [''],
        stock: product.stock.toString(),
        featured: product.featured,
        collection: product.collection || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        compare_price: '',
        category: 'jerseys',
        sport: 'Football',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'White'],
        images: [''],
        stock: '',
        featured: false,
        collection: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        stock: parseInt(formData.stock) || 0,
        images: formData.images.filter(img => img.trim()),
      };

      if (editingProduct) {
        await axios.put(`${API_URL}/admin/products/${editingProduct.id}`, productData);
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API_URL}/admin/products`, productData);
        toast.success('Product created successfully');
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${API_URL}/admin/products/${productId}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const removeImageField = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages.length > 0 ? newImages : [''] });
  };

  const toggleSize = (size) => {
    const newSizes = formData.sizes.includes(size)
      ? formData.sizes.filter(s => s !== size)
      : [...formData.sizes, size];
    setFormData({ ...formData, sizes: newSizes });
  };

  const toggleColor = (color) => {
    const newColors = formData.colors.includes(color)
      ? formData.colors.filter(c => c !== color)
      : [...formData.colors, color];
    setFormData({ ...formData, colors: newColors });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const allColors = ['Black', 'White', 'Red', 'Navy', 'Yellow', 'Neon Green', 'Orange', 'Blue'];

  return (
    <AdminLayout title="Products">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="product-search-input"
          />
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-[#050505] hover:bg-[#1a1a1a] text-white"
          data-testid="add-product-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Products Table - Responsive wrapper */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden" data-testid="products-table">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left p-4 font-semibold text-sm">Product</th>
              <th className="text-left p-4 font-semibold text-sm">Category</th>
              <th className="text-left p-4 font-semibold text-sm">Price</th>
              <th className="text-left p-4 font-semibold text-sm">Stock</th>
              <th className="text-left p-4 font-semibold text-sm">Status</th>
              <th className="text-right p-4 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-t animate-pulse">
                  <td className="p-4"><div className="h-12 bg-neutral-200 rounded" /></td>
                  <td className="p-4"><div className="h-4 bg-neutral-200 w-20 rounded" /></td>
                  <td className="p-4"><div className="h-4 bg-neutral-200 w-16 rounded" /></td>
                  <td className="p-4"><div className="h-4 bg-neutral-200 w-12 rounded" /></td>
                  <td className="p-4"><div className="h-4 bg-neutral-200 w-16 rounded" /></td>
                  <td className="p-4"><div className="h-4 bg-neutral-200 w-20 rounded ml-auto" /></td>
                </tr>
              ))
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-neutral-500">
                  No products found
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t hover:bg-neutral-50"
                  data-testid={`product-row-${product.id}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-100 rounded overflow-hidden">
                        <img
                          src={product.images?.[0] || 'https://via.placeholder.com/100'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-xs text-neutral-500">{product.sport}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 capitalize">{product.category}</td>
                  <td className="p-4 font-semibold">{formatPrice(product.price)}</td>
                  <td className="p-4">{product.stock}</td>
                  <td className="p-4">
                    {product.featured && (
                      <Badge className="bg-[#CCFF00] text-[#050505]">Featured</Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(product)}
                        data-testid={`edit-product-${product.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(product.id)}
                        data-testid={`delete-product-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
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

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4" data-testid="product-form">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sport">Sport *</Label>
                <Select
                  value={formData.sport}
                  onValueChange={(value) => setFormData({ ...formData, sport: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Football">Football</SelectItem>
                    <SelectItem value="Basketball">Basketball</SelectItem>
                    <SelectItem value="Running">Running</SelectItem>
                    <SelectItem value="Tennis">Tennis</SelectItem>
                    <SelectItem value="Gym">Gym</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price (₦) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="compare_price">Compare Price (₦)</Label>
                <Input
                  id="compare_price"
                  type="number"
                  value={formData.compare_price}
                  onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jerseys">Jerseys</SelectItem>
                    <SelectItem value="kits">Training Kits</SelectItem>
                    <SelectItem value="shorts">Shorts</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="collection">Collection</Label>
                <Input
                  id="collection"
                  value={formData.collection}
                  onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                  placeholder="e.g., Elite Series"
                />
              </div>
            </div>

            <div>
              <Label>Sizes</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {allSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-4 py-2 border font-semibold text-sm ${
                      formData.sizes.includes(size)
                        ? 'bg-[#050505] text-white border-[#050505]'
                        : 'bg-white text-[#050505] border-neutral-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Colors</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {allColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleColor(color)}
                    className={`px-4 py-2 border font-semibold text-sm ${
                      formData.colors.includes(color)
                        ? 'bg-[#050505] text-white border-[#050505]'
                        : 'bg-white text-[#050505] border-neutral-300'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Images</Label>
              <div className="space-y-2 mt-2">
                {formData.images.map((image, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder="Image URL"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeImageField(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addImageField}>
                  <Plus className="w-4 h-4 mr-2" /> Add Image
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <Label>Featured Product</Label>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#050505] hover:bg-[#1a1a1a] text-white">
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProducts;
