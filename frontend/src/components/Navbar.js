import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, User, Menu, X, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { toast } from 'sonner';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login, register, logout } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null);
  const [authForm, setAuthForm] = useState({ email: '', password: '', full_name: '', phone: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authModal === 'login') {
        await login(authForm.email, authForm.password);
        toast.success('Welcome back!');
      } else {
        await register(authForm);
        toast.success('Account created successfully!');
      }
      setAuthModal(null);
      setAuthForm({ email: '', password: '', full_name: '', phone: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'New Arrivals', path: '/shop?featured=true' },
    { name: 'Best Sellers', path: '/shop?collection=Elite Series' },
    { name: 'About', path: '#about' },
    { name: 'Contact', path: '#contact' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('#')) return false;
    return location.pathname === path || location.search.includes(path.split('?')[1]);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/90 backdrop-blur-lg shadow-sm' 
            : 'bg-white'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* GS Symbol Only - No Text */}
            <Link to="/" className="flex items-center flex-shrink-0" data-testid="logo-link">
              <svg 
                width="28" 
                height="28" 
                viewBox="0 0 40 40" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#050505]"
              >
                <path 
                  d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 4c8.837 0 16 7.163 16 16s-7.163 16-16 16S4 28.837 4 20 11.163 4 20 4z" 
                  fill="currentColor"
                />
                <path 
                  d="M20 8c-6.627 0-12 5.373-12 12h4c0-4.418 3.582-8 8-8V8z" 
                  fill="currentColor"
                />
                <path 
                  d="M28 14v6h-6v4h10V14h-4z" 
                  fill="#CCFF00"
                />
                <text 
                  x="12" 
                  y="27" 
                  fontFamily="Arial Black, sans-serif" 
                  fontSize="14" 
                  fontWeight="900" 
                  fill="currentColor"
                >
                  GS
                </text>
              </svg>
            </Link>

            {/* Desktop Navigation - Center */}
            <div className="hidden lg:flex items-center justify-center flex-1 px-8">
              <div className="flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`relative px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors group ${
                      isActive(link.path) 
                        ? 'text-[#050505]' 
                        : 'text-neutral-500 hover:text-[#050505]'
                    }`}
                    data-testid={`nav-${link.name.toLowerCase().replace(' ', '-')}`}
                  >
                    {link.name}
                    <span className={`absolute bottom-0 left-4 right-4 h-0.5 bg-[#CCFF00] transform transition-transform duration-300 ${
                      isActive(link.path) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 hover:bg-neutral-100 rounded-full transition-colors"
                data-testid="search-btn"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Account Button */}
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/account')}
                  className="p-2.5 hover:bg-neutral-100 rounded-full transition-colors"
                  data-testid="account-btn"
                >
                  <User className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setAuthModal('login')}
                  className="p-2.5 hover:bg-neutral-100 rounded-full transition-colors"
                  data-testid="login-btn"
                >
                  <User className="w-5 h-5" />
                </button>
              )}

              {/* Cart Button */}
              <Link
                to="/cart"
                className="p-2.5 hover:bg-neutral-100 rounded-full transition-colors relative"
                data-testid="cart-btn"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#CCFF00] text-[#050505] text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>

              {/* Shop Now CTA - Desktop */}
              <Link to="/shop" className="hidden md:block ml-2">
                <Button
                  className="bg-[#050505] hover:bg-[#1a1a1a] text-white font-semibold uppercase tracking-wider text-xs px-5 py-2.5 rounded-none"
                  data-testid="shop-now-nav-btn"
                >
                  Shop Now
                </Button>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 hover:bg-neutral-100 rounded-full transition-colors ml-1"
                data-testid="mobile-menu-btn"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Slide from right */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              
              {/* Menu Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 lg:hidden shadow-2xl"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <span className="text-lg font-black tracking-tighter">MENU</span>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Links */}
                  <nav className="flex-1 overflow-y-auto py-4">
                    {navLinks.map((link, index) => (
                      <motion.div
                        key={link.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={link.path}
                          className={`flex items-center justify-between px-6 py-4 text-lg font-medium transition-colors ${
                            isActive(link.path)
                              ? 'bg-[#CCFF00]/10 text-[#050505] border-l-4 border-[#CCFF00]'
                              : 'text-neutral-700 hover:bg-neutral-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.name}
                          <ChevronRight className="w-5 h-5 text-neutral-400" />
                        </Link>
                      </motion.div>
                    ))}
                  </nav>

                  {/* Footer */}
                  <div className="p-6 border-t space-y-4">
                    <Link 
                      to="/shop"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block"
                    >
                      <Button className="w-full bg-[#050505] hover:bg-[#1a1a1a] text-white font-semibold uppercase tracking-wider py-4 rounded-none">
                        Shop Now
                      </Button>
                    </Link>
                    {isAuthenticated ? (
                      <div className="flex gap-3">
                        <Link
                          to="/account"
                          className="flex-1"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button variant="outline" className="w-full rounded-none">
                            My Account
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          className="rounded-none"
                          onClick={() => { logout(); setMobileMenuOpen(false); }}
                        >
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full rounded-none"
                        onClick={() => { setAuthModal('login'); setMobileMenuOpen(false); }}
                      >
                        Sign In / Register
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Search Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">SEARCH</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                autoFocus
                data-testid="search-input"
              />
              <Button 
                type="submit" 
                className="bg-[#050505] hover:bg-[#1a1a1a] text-white px-6"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Auth Modal */}
      <Dialog open={!!authModal} onOpenChange={() => setAuthModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {authModal === 'login' ? 'WELCOME BACK' : 'JOIN THE TEAM'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAuth} className="space-y-4 mt-4">
            {authModal === 'register' && (
              <>
                <Input
                  placeholder="Full Name"
                  value={authForm.full_name}
                  onChange={(e) => setAuthForm({ ...authForm, full_name: e.target.value })}
                  required
                  data-testid="register-name-input"
                />
                <Input
                  placeholder="Phone (optional)"
                  value={authForm.phone}
                  onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                  data-testid="register-phone-input"
                />
              </>
            )}
            <Input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              required
              data-testid="auth-email-input"
            />
            <Input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              required
              minLength={6}
              data-testid="auth-password-input"
            />
            <Button
              type="submit"
              className="w-full bg-[#050505] hover:bg-[#1a1a1a] text-white font-semibold uppercase tracking-wider"
              disabled={authLoading}
              data-testid="auth-submit-btn"
            >
              {authLoading ? 'Loading...' : authModal === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
            <p className="text-center text-sm text-neutral-600">
              {authModal === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthModal('register')}
                    className="font-semibold text-[#050505] hover:underline"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthModal('login')}
                    className="font-semibold text-[#050505] hover:underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
