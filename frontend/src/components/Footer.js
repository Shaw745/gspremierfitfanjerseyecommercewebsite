import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Youtube, Mail } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

const Footer = () => {
  return (
    <footer className="bg-[#050505] text-white">
      {/* Newsletter Section */}
      <div className="border-b border-neutral-800">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">
                JOIN THE MOVEMENT
              </h3>
              <p className="text-neutral-400">
                Subscribe for exclusive drops, early access, and more.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 w-full sm:min-w-[280px]"
                data-testid="newsletter-email-input"
              />
              <Button
                className="bg-[#CCFF00] text-[#050505] hover:bg-[#b8e600] font-semibold uppercase tracking-wider px-6 whitespace-nowrap"
                data-testid="newsletter-submit-btn"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-2xl font-black tracking-tighter mb-4">GS PREMIER</h4>
            <p className="text-neutral-400 text-sm mb-6">
              Engineered for the obsessed. Premium sportswear crafted for peak performance.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-neutral-400 hover:text-[#CCFF00] transition-colors" data-testid="social-instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-[#CCFF00] transition-colors" data-testid="social-twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-[#CCFF00] transition-colors" data-testid="social-facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-[#CCFF00] transition-colors" data-testid="social-youtube">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h5 className="text-sm font-semibold uppercase tracking-wider mb-4">Shop</h5>
            <ul className="space-y-3">
              <li>
                <Link to="/shop" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/shop?category=jerseys" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  Jerseys
                </Link>
              </li>
              <li>
                <Link to="/shop?category=kits" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  Training Kits
                </Link>
              </li>
              <li>
                <Link to="/shop?featured=true" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h5 className="text-sm font-semibold uppercase tracking-wider mb-4">Support</h5>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  Size Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h5 className="text-sm font-semibold uppercase tracking-wider mb-4">Company</h5>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  Press
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-400 hover:text-white text-sm transition-colors">
                  Sustainability
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-neutral-500 text-sm">
              © 2024 Gs Premier Fit Fan. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-neutral-500 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-neutral-500 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
