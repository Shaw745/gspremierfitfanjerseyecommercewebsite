import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, User, Menu, X, Search, Heart } from 'lucide-react';
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

const Navbar = ({ transparent = false }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, register, logout } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null
  const [authForm, setAuthForm] = useState({ email: '', password: '', full_name: '', phone: '' });
  const [authLoading, setAuthLoading] = useState(false);

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

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 ${transparent ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md border-b border-neutral-200'}`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
              <span className="text-2xl font-black tracking-tighter text-[#050505]">
                GS PREMIER
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/shop"
                className="text-sm font-semibold uppercase tracking-wider text-neutral-700 hover:text-[#050505] transition-colors"
                data-testid="shop-link"
              >
                Shop
              </Link>
              <Link
                to="/shop?collection=Elite Series"
                className="text-sm font-semibold uppercase tracking-wider text-neutral-700 hover:text-[#050505] transition-colors"
                data-testid="collections-link"
              >
                Collections
              </Link>
              <Link
                to="/shop?featured=true"
                className="text-sm font-semibold uppercase tracking-wider text-neutral-700 hover:text-[#050505] transition-colors"
                data-testid="new-arrivals-link"
              >
                New Arrivals
              </Link>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/account')}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                  data-testid="account-btn"
                >
                  <User className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setAuthModal('login')}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                  data-testid="login-btn"
                >
                  <User className="w-5 h-5" />
                </button>
              )}

              <Link
                to="/cart"
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors relative"
                data-testid="cart-btn"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#CCFF00] text-[#050505] text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-neutral-100 rounded-full transition-colors"
                data-testid="mobile-menu-btn"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-neutral-200"
            >
              <div className="px-6 py-4 space-y-4">
                <Link
                  to="/shop"
                  className="block text-lg font-semibold uppercase tracking-wider"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Shop
                </Link>
                <Link
                  to="/shop?collection=Elite Series"
                  className="block text-lg font-semibold uppercase tracking-wider"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Collections
                </Link>
                <Link
                  to="/shop?featured=true"
                  className="block text-lg font-semibold uppercase tracking-wider"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  New Arrivals
                </Link>
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/account"
                      className="block text-lg font-semibold uppercase tracking-wider"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="block text-lg font-semibold uppercase tracking-wider text-red-600"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setAuthModal('login'); setMobileMenuOpen(false); }}
                    className="block text-lg font-semibold uppercase tracking-wider"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

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
