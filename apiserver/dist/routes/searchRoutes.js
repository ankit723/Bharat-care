"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const searchController_1 = require("../controllers/searchController");
const router = express_1.default.Router();
// Global search across all healthcare entities
router.get('/', searchController_1.globalSearch);
// Medicine search
router.get('/medicines', searchController_1.searchMedicines);
// Location-based provider search
router.get('/providers', searchController_1.getProvidersByLocation);
// Trending searches and suggestions
router.get('/trending', searchController_1.getTrendingSearches);
exports.default = router;
