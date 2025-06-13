import express from 'express';
import {
  globalSearch,
  searchMedicines,
  getProvidersByLocation,
  getTrendingSearches,
} from '../controllers/searchController';

const router = express.Router();

// Global search across all healthcare entities
router.get('/', globalSearch);

// Medicine search
router.get('/medicines', searchMedicines);

// Location-based provider search
router.get('/providers', getProvidersByLocation);

// Trending searches and suggestions
router.get('/trending', getTrendingSearches);

export default router; 