"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const medStoreController_1 = require("../controllers/medStoreController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', authMiddleware_1.authenticate, medStoreController_1.getMedStores);
router.get('/:id', authMiddleware_1.authenticate, medStoreController_1.getMedStoreById);
router.post('/', medStoreController_1.createMedStore);
router.put('/:id', authMiddleware_1.authenticate, medStoreController_1.updateMedStore);
router.delete('/:id', authMiddleware_1.authenticate, medStoreController_1.deleteMedStore);
exports.default = router;
