import { Product } from '../types';
import { fallbackProducts } from './fallbackProducts';

// Initial products catalog with fallbacks for zero-read and offline/quota resilience
export const initialProducts: Product[] = fallbackProducts;
