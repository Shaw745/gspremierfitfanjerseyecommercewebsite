import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play, ChevronDown } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { API_URL } from '../lib/utils';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const heroRef = useRef(null);
  const jerseyRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products?featured=true&limit=4`);
      setFeaturedProducts(response.data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  // 3D Jersey Mouse Effect
  const handleMouseMove = (e) => {
    if (!jerseyRef.current) return;
    const rect = jerseyRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 25;
    const y = (e.clientY - rect.top - rect.height / 2) / 25;
    setMousePosition({ x, y });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar transparent />

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden bg-[#050505]"
        onMouseMove={handleMouseMove}
        data-testid="hero-section"
      >
        {/* Background Image with Parallax */}
        <motion.div 
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1743630738181-b0e26c76c74c?w=1920&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-black/60" />
        </motion.div>

        {/* 3D Floating Jersey Element */}
        <div className="perspective-container absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            ref={jerseyRef}
            className="preserve-3d w-[300px] md:w-[500px] h-[400px] md:h-[600px]"
            animate={{
              rotateY: mousePosition.x,
              rotateX: -mousePosition.y,
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 30 }}
          >
            <img
              src="https://images.pexels.com/photos/28555936/pexels-photo-28555936.jpeg?w=500"
              alt="Premium Jersey"
              className="w-full h-full object-contain drop-shadow-2xl"
              style={{ transform: 'translateZ(50px)' }}
            />
          </motion.div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-[#CCFF00] text-sm md:text-base font-semibold uppercase tracking-[0.3em] mb-4">
              Engineered for the Obsessed
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-6">
              ELEVATE YOUR
              <br />
              <span className="text-[#CCFF00]">GAME</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-300 max-w-xl mx-auto mb-8">
              Premium sportswear engineered for peak performance. Crafted with precision for athletes who demand excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop">
                <Button
                  size="lg"
                  className="bg-[#CCFF00] text-[#050505] hover:bg-[#b8e600] font-semibold uppercase tracking-wider px-8 py-6 text-base"
                  data-testid="shop-now-btn"
                >
                  Shop Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-[#050505] font-semibold uppercase tracking-wider px-8 py-6 text-base"
                data-testid="watch-video-btn"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Film
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white"
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </section>

      {/* Marquee Section */}
      <section className="bg-[#CCFF00] py-4 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-[#050505] text-xl md:text-2xl font-black tracking-tighter mx-8">
              PERFORMANCE • PRECISION • POWER • PREMIUM •
            </span>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 md:py-32 px-6 md:px-12" data-testid="featured-products-section">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[#CCFF00] bg-[#050505] inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
                Featured
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
                NEW ARRIVALS
              </h2>
            </div>
            <Link to="/shop?featured=true">
              <Button
                variant="outline"
                className="border-[#050505] text-[#050505] hover:bg-[#050505] hover:text-white font-semibold uppercase tracking-wider"
                data-testid="view-all-products-btn"
              >
                View All
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="relative py-24 md:py-32 bg-[#050505] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="text-[#CCFF00] text-sm font-semibold uppercase tracking-[0.3em] mb-4">
                Our Story
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-6">
                CRAFTED FOR
                <br />
                <span className="text-[#CCFF00]">CHAMPIONS</span>
              </h2>
              <p className="text-neutral-400 text-lg leading-relaxed mb-8">
                At Gs Premier Fit Fan, we don't just make sportswear—we engineer performance. Every stitch, every fabric choice, every design decision is made with one goal: to help you perform at your absolute best.
              </p>
              <p className="text-neutral-400 text-lg leading-relaxed mb-8">
                Born from a passion for sports and an obsession with quality, we're building a global brand that represents the next generation of athletic excellence.
              </p>
              <Button
                className="bg-[#CCFF00] text-[#050505] hover:bg-[#b8e600] font-semibold uppercase tracking-wider"
                data-testid="learn-more-btn"
              >
                Learn More
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1686561394788-e450f15ff1e5?w=800&q=80"
                  alt="Athlete"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-[#CCFF00] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-5xl font-black text-[#050505]">100%</p>
                  <p className="text-sm font-semibold text-[#050505] uppercase tracking-wider">Premium Quality</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 md:py-32 px-6 md:px-12" data-testid="categories-section">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4">
              SHOP BY SPORT
            </h2>
            <p className="text-neutral-600 text-lg max-w-xl mx-auto">
              Find the perfect gear for your game
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Football', image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80' },
              { name: 'Basketball', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80' },
              { name: 'Running', image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80' },
            ].map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  to={`/shop?sport=${category.name}`}
                  className="group relative block aspect-[3/4] overflow-hidden"
                  data-testid={`category-${category.name.toLowerCase()}`}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover image-zoom"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">
                      {category.name.toUpperCase()}
                    </h3>
                    <span className="inline-flex items-center text-[#CCFF00] font-semibold uppercase tracking-wider text-sm group-hover:translate-x-2 transition-transform">
                      Shop Now <ArrowRight className="ml-2 w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1671810458671-759db56dc405?w=1920&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-[#050505]/90" />
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter text-white mb-6">
              READY TO
              <br />
              <span className="text-[#CCFF00]">DOMINATE?</span>
            </h2>
            <p className="text-neutral-300 text-lg md:text-xl max-w-xl mx-auto mb-8">
              Join thousands of athletes who trust Gs Premier Fit Fan for their performance needs.
            </p>
            <Link to="/shop">
              <Button
                size="lg"
                className="bg-[#CCFF00] text-[#050505] hover:bg-[#b8e600] font-semibold uppercase tracking-wider px-12 py-6 text-base"
                data-testid="explore-collection-btn"
              >
                Explore Collection
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
