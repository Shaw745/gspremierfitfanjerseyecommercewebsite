import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import { API_URL, formatPrice } from '../lib/utils';

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [sports, setSports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    sport: searchParams.get('sport') || '',
    category: searchParams.get('category') || '',
    collection: searchParams.get('collection') || '',
    featured: searchParams.get('featured') === 'true',
    minPrice: 0,
    maxPrice: 200000,
    search: searchParams.get('search') || '',
    sortBy: 'newest',
  });

  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchFilters = async () => {
    try {
      const [sportsRes, categoriesRes, collectionsRes] = await Promise.all([
        axios.get(`${API_URL}/sports`),
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/collections`),
      ]);
      setSports(sportsRes.data.sports || []);
      setCategories(categoriesRes.data.categories || []);
      setCollections(collectionsRes.data.collections || []);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.sport) params.append('sport', filters.sport);
      if (filters.category) params.append('category', filters.category);
      if (filters.collection) params.append('collection', filters.collection);
      if (filters.featured) params.append('featured', 'true');
      if (filters.minPrice > 0) params.append('min_price', filters.minPrice);
      if (filters.maxPrice < 200000) params.append('max_price', filters.maxPrice);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_URL}/products?${params.toString()}`);
      let productList = response.data.products || [];

      // Sort
      if (filters.sortBy === 'price-low') {
        productList.sort((a, b) => a.price - b.price);
      } else if (filters.sortBy === 'price-high') {
        productList.sort((a, b) => b.price - a.price);
      } else if (filters.sortBy === 'name') {
        productList.sort((a, b) => a.name.localeCompare(b.name));
      }

      setProducts(productList);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      sport: '',
      category: '',
      collection: '',
      featured: false,
      minPrice: 0,
      maxPrice: 200000,
      search: '',
      sortBy: 'newest',
    });
    setPriceRange([0, 200000]);
    setSearchParams({});
  };

  const activeFilterCount = [
    filters.sport,
    filters.category,
    filters.collection,
    filters.featured,
    filters.minPrice > 0,
    filters.maxPrice < 200000,
  ].filter(Boolean).length;

  const FilterSidebar = ({ mobile = false }) => (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <h4 className="font-semibold uppercase tracking-wider text-sm mb-4">Search</h4>
        <Input
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          data-testid="search-input"
        />
      </div>

      {/* Sport Filter */}
      <div>
        <h4 className="font-semibold uppercase tracking-wider text-sm mb-4">Sport</h4>
        <div className="space-y-3">
          {sports.map((sport) => (
            <label key={sport} className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={filters.sport === sport}
                onCheckedChange={(checked) => setFilters({ ...filters, sport: checked ? sport : '' })}
                data-testid={`filter-sport-${sport.toLowerCase()}`}
              />
              <span className="text-sm">{sport}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="font-semibold uppercase tracking-wider text-sm mb-4">Category</h4>
        <div className="space-y-3">
          {categories.map((category) => (
            <label key={category} className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={filters.category === category}
                onCheckedChange={(checked) => setFilters({ ...filters, category: checked ? category : '' })}
                data-testid={`filter-category-${category.toLowerCase()}`}
              />
              <span className="text-sm capitalize">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Collection Filter */}
      {collections.length > 0 && (
        <div>
          <h4 className="font-semibold uppercase tracking-wider text-sm mb-4">Collection</h4>
          <div className="space-y-3">
            {collections.map((collection) => (
              <label key={collection} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={filters.collection === collection}
                  onCheckedChange={(checked) => setFilters({ ...filters, collection: checked ? collection : '' })}
                  data-testid={`filter-collection-${collection.toLowerCase().replace(' ', '-')}`}
                />
                <span className="text-sm">{collection}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h4 className="font-semibold uppercase tracking-wider text-sm mb-4">Price Range</h4>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          onValueCommit={(value) => setFilters({ ...filters, minPrice: value[0], maxPrice: value[1] })}
          max={200000}
          step={5000}
          className="mb-4"
          data-testid="price-slider"
        />
        <div className="flex justify-between text-sm text-neutral-600">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearFilters}
          data-testid="clear-filters-btn"
        >
          Clear All Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 px-6 md:px-12 bg-[#050505]" data-testid="shop-hero">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-4">
              {filters.sport || filters.category || filters.collection || 'ALL PRODUCTS'}
            </h1>
            <p className="text-neutral-400 text-lg">
              {total} products found
            </p>
          </motion.div>
        </div>
      </section>

      {/* Shop Content */}
      <section className="py-12 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex gap-12">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <FilterSidebar />
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b">
                {/* Mobile Filter Toggle */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden" data-testid="mobile-filters-btn">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="ml-2 w-5 h-5 bg-[#CCFF00] text-[#050505] text-xs rounded-full flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSidebar mobile />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <div className="flex items-center gap-4 ml-auto">
                  <span className="text-sm text-neutral-600 hidden sm:inline">Sort by:</span>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                  >
                    <SelectTrigger className="w-40" data-testid="sort-select">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {filters.sport && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-sm">
                      {filters.sport}
                      <button onClick={() => setFilters({ ...filters, sport: '' })}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.category && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-sm capitalize">
                      {filters.category}
                      <button onClick={() => setFilters({ ...filters, category: '' })}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.collection && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-sm">
                      {filters.collection}
                      <button onClick={() => setFilters({ ...filters, collection: '' })}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Products */}
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/4] bg-neutral-200 mb-4" />
                      <div className="h-4 bg-neutral-200 w-1/2 mb-2" />
                      <div className="h-5 bg-neutral-200 w-3/4 mb-2" />
                      <div className="h-4 bg-neutral-200 w-1/3" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-2xl font-bold mb-2">No products found</p>
                  <p className="text-neutral-600 mb-6">Try adjusting your filters</p>
                  <Button onClick={clearFilters} data-testid="clear-filters-empty-btn">
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
                  {products.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ShopPage;
