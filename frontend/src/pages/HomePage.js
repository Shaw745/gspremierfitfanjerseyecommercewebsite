import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { API_URL } from '../lib/utils';

// Sports Video Data - Epic Moments (All verified working)
const SPORTS_VIDEOS = [
  {
    id: 1,
    title: "Benfica GK Trubin Scores vs Real Madrid!",
    description: "98th minute header knocks Real Madrid out of Champions League - Jan 2026",
    youtubeId: "K64czXu2OuA",
    thumbnail: "https://img.youtube.com/vi/K64czXu2OuA/maxresdefault.jpg"
  },
  {
    id: 2,
    title: "Ronaldo's Bicycle Kick vs Juventus",
    description: "One of the greatest goals ever - Standing ovation from Juventus fans",
    youtubeId: "Nt8198a0acA",
    thumbnail: "https://img.youtube.com/vi/Nt8198a0acA/maxresdefault.jpg"
  },
  {
    id: 3,
    title: "AGUEROOO! Man City vs QPR 93:20",
    description: "The most dramatic Premier League title win ever - Last minute winner",
    youtubeId: "4XSo5Z0hEAs",
    thumbnail: "https://img.youtube.com/vi/4XSo5Z0hEAs/maxresdefault.jpg"
  },
  {
    id: 4,
    title: "LeBron's Block - Game 7 NBA Finals",
    description: "The chasedown block that sealed Cleveland's first championship",
    youtubeId: "-zd62MxKXp8",
    thumbnail: "https://img.youtube.com/vi/-zd62MxKXp8/maxresdefault.jpg"
  },
  {
    id: 5,
    title: "Man City vs QPR - Last 10 Minutes",
    description: "Full drama of the greatest Premier League finale",
    youtubeId: "qrFPRrZLGmU",
    thumbnail: "https://img.youtube.com/vi/qrFPRrZLGmU/maxresdefault.jpg"
  }
];

// Video Modal Component
const VideoModal = ({ isOpen, onClose, videos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const nextVideo = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };
  
  const prevVideo = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextVideo();
      if (e.key === 'ArrowLeft') prevVideo();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentVideo = videos[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
        onClick={onClose}
        data-testid="video-modal"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-5xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 text-white hover:text-[#CCFF00] transition-colors"
            data-testid="close-video-modal"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?autoplay=1&rel=0`}
              title={currentVideo.title}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Video Info */}
          <div className="mt-4 text-white">
            <h3 className="text-xl md:text-2xl font-bold">{currentVideo.title}</h3>
            <p className="text-neutral-400 mt-1">{currentVideo.description}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prevVideo}
              className="flex items-center gap-2 text-white hover:text-[#CCFF00] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            
            <div className="flex gap-2">
              {videos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentIndex ? 'bg-[#CCFF00]' : 'bg-neutral-600 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextVideo}
              className="flex items-center gap-2 text-white hover:text-[#CCFF00] transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Video Thumbnails */}
          <div className="mt-6 grid grid-cols-5 gap-2">
            {videos.map((video, idx) => (
              <button
                key={video.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative aspect-video rounded overflow-hidden border-2 transition-all ${
                  idx === currentIndex ? 'border-[#CCFF00]' : 'border-transparent hover:border-white/50'
                }`}
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                  }}
                />
                {idx === currentIndex && (
                  <div className="absolute inset-0 bg-[#CCFF00]/20" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  useEffect(() => {
    if (!isInView) return;
    
    let startTime;
    let animationFrame;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration]);
  
  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
};

// Stats Section Component
const StatsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const stats = [
    { value: 100, suffix: '%', label: 'Premium Quality' },
    { value: 50, suffix: 'K+', label: 'Happy Athletes' },
    { value: null, display: '24/7', label: 'Support' },
    { value: 30, suffix: '+', label: 'Countries' },
  ];
  
  return (
    <section 
      ref={ref}
      className="bg-[#CCFF00] py-8 md:py-10"
      data-testid="stats-section"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl md:text-5xl lg:text-6xl font-black text-[#050505] mb-2">
                {stat.value !== null ? (
                  <AnimatedCounter 
                    end={stat.value} 
                    suffix={stat.suffix} 
                    duration={1.8}
                  />
                ) : (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                  >
                    {stat.display}
                  </motion.span>
                )}
              </p>
              <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-[#050505]/70">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const handleMouseMove = (e) => {
    // Optional: Add mouse tracking functionality for hero section
    // This can be used for parallax effects or interactive elements
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products?featured=true&limit=4`);
      setFeaturedProducts(response.data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white scroll-smooth overflow-x-hidden">
      <Navbar />
      
      {/* Video Modal */}
      <VideoModal 
        isOpen={videoModalOpen} 
        onClose={() => setVideoModalOpen(false)} 
        videos={SPORTS_VIDEOS}
      />

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center overflow-hidden bg-[#050505] pt-20"
        data-testid="hero-section"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/95 to-[#050505]/80" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-0">
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            {/* Center - Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center max-w-3xl"
            >
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-[#CCFF00] text-xs md:text-sm font-semibold uppercase tracking-[0.3em] mb-6 md:mb-8"
              >
                Engineered for the Obsessed
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 md:mb-10 text-white"
              >
                ELEVATE YOUR
                <br />
                <span className="text-[#CCFF00]">GAME</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-base md:text-lg lg:text-xl text-neutral-300 max-w-xl mx-auto mb-10 md:mb-12"
              >
                Premium sportswear engineered for peak performance. Crafted with precision for athletes who demand excellence.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link to="/shop">
                  <Button
                    size="lg"
                    className="bg-[#CCFF00] text-[#050505] hover:bg-[#b8e600] font-semibold uppercase tracking-wider px-8 py-6 text-sm md:text-base rounded-none transition-all hover:scale-105"
                    data-testid="shop-now-btn"
                  >
                    Shop Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setVideoModalOpen(true)}
                  className="border-white text-white hover:bg-white hover:text-[#050505] font-semibold uppercase tracking-wider px-8 py-6 text-sm md:text-base rounded-none transition-all"
                  data-testid="watch-video-btn"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Watch Film
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Animated Stats Section */}
      <StatsSection />

      {/* Featured Products */}
      <section className="py-20 md:py-28 px-6 md:px-12" data-testid="featured-products-section">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-[#CCFF00] bg-[#050505] inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
                Featured
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
                NEW ARRIVALS
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link to="/shop?featured=true">
                <Button
                  variant="outline"
                  className="border-[#050505] text-[#050505] hover:bg-[#050505] hover:text-white font-semibold uppercase tracking-wider rounded-none transition-all hover:scale-105"
                  data-testid="view-all-products-btn"
                >
                  View All
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="relative py-20 md:py-28 bg-[#050505] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
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
              <p className="text-neutral-400 text-base md:text-lg leading-relaxed mb-6">
                At Gs Premier Fit Fan, we don't just make sportswear—we engineer performance. Every stitch, every fabric choice, every design decision is made with one goal: to help you perform at your absolute best.
              </p>
              <p className="text-neutral-400 text-base md:text-lg leading-relaxed mb-8">
                Born from a passion for sports and an obsession with quality, we're building a global brand that represents the next generation of athletic excellence.
              </p>
              <Button
                className="bg-[#CCFF00] text-[#050505] hover:bg-[#b8e600] font-semibold uppercase tracking-wider rounded-none transition-all hover:scale-105"
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
                  src="https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&q=80"
                  alt="Athletic Model"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="absolute -bottom-6 -left-6 md:-bottom-8 md:-left-8 w-36 h-36 md:w-48 md:h-48 bg-[#CCFF00] flex items-center justify-center"
              >
                <div className="text-center">
                  <p className="text-4xl md:text-5xl font-black text-[#050505]">100%</p>
                  <p className="text-xs md:text-sm font-semibold text-[#050505] uppercase tracking-wider">Premium Quality</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 md:py-28 px-6 md:px-12" data-testid="categories-section" id="about">
        <div className="max-w-[1400px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4">
              SHOP BY SPORT
            </h2>
            <p className="text-neutral-600 text-base md:text-lg max-w-xl mx-auto">
              Find the perfect gear for your game
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tighter mb-2">
                      {category.name.toUpperCase()}
                    </h3>
                    <span className="inline-flex items-center text-[#CCFF00] font-semibold uppercase tracking-wider text-sm group-hover:translate-x-2 transition-transform duration-300">
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
      <section className="relative py-20 md:py-28 overflow-hidden" id="contact">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1920&q=80')`,
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
            <p className="text-neutral-300 text-base md:text-lg lg:text-xl max-w-xl mx-auto mb-8">
              Join thousands of athletes who trust Gs Premier Fit Fan for their performance needs.
            </p>
            <Link to="/shop">
              <Button
                size="lg"
                className="bg-[#CCFF00] text-[#050505] hover:bg-[#b8e600] font-semibold uppercase tracking-wider px-10 md:px-12 py-6 text-sm md:text-base rounded-none transition-all hover:scale-105"
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
