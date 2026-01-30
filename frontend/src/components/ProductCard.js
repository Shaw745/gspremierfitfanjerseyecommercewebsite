import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatPrice } from '../lib/utils';

const ProductCard = ({ product, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link
        to={`/product/${product.id}`}
        className="group block"
        data-testid={`product-card-${product.id}`}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 mb-4">
          <img
            src={product.images?.[0] || 'https://via.placeholder.com/400x500'}
            alt={product.name}
            className="w-full h-full object-cover image-zoom"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          {/* Featured Badge */}
          {product.featured && (
            <div className="absolute top-4 left-4 bg-[#CCFF00] text-[#050505] px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              New
            </div>
          )}
          
          {/* Sale Badge */}
          {product.compare_price && product.compare_price > product.price && (
            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Sale
            </div>
          )}
          
          {/* Quick View on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="bg-white text-center py-3 font-semibold uppercase tracking-wider text-sm">
              Quick View
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">
            {product.sport}
          </p>
          <h3 className="font-bold text-lg uppercase tracking-tight group-hover:text-[#050505] transition-colors line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formatPrice(product.price)}</span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-neutral-400 line-through text-sm">
                {formatPrice(product.compare_price)}
              </span>
            )}
          </div>
          
          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex gap-1 pt-2">
              {product.colors.slice(0, 4).map((color, idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 rounded-full border border-neutral-300"
                  style={{
                    backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' :
                      color.toLowerCase() === 'black' ? '#050505' :
                      color.toLowerCase() === 'red' ? '#ef4444' :
                      color.toLowerCase() === 'navy' ? '#1e3a5f' :
                      color.toLowerCase() === 'yellow' ? '#fbbf24' :
                      color.toLowerCase() === 'neon green' ? '#CCFF00' :
                      color.toLowerCase() === 'orange' ? '#f97316' :
                      color.toLowerCase()
                  }}
                  title={color}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-xs text-neutral-500">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
