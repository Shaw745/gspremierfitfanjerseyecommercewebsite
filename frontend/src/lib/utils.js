import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// Base URL for static files (uploads)
export const BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Helper to get full image URL
export function getImageUrl(imagePath) {
  if (!imagePath) return 'https://via.placeholder.com/400x500?text=No+Image';
  
  // If it's already a full URL (http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path (starts with /uploads), prepend the base URL
  if (imagePath.startsWith('/uploads')) {
    return `${BASE_URL}${imagePath}`;
  }
  
  // Otherwise return as-is
  return imagePath;
}
